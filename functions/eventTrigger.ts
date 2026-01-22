import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Central Event Layer - Triggers AI actions automatically
 * Events: new_lead, missed_call, incoming_text, calendar_no_show, daily_check, response_received
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { event_type, data } = body;

        let result;

        switch (event_type) {
            case 'new_lead':
                // New lead enters system
                result = await handleNewLead(base44, data);
                break;

            case 'missed_call':
                // Missed call detected
                result = await handleMissedCall(base44, data);
                break;

            case 'incoming_text':
                // Lead replied via SMS
                result = await handleIncomingText(base44, data);
                break;

            case 'incoming_email':
                // Lead replied via email
                result = await handleIncomingEmail(base44, data);
                break;

            case 'calendar_no_show':
                // Lead missed appointment
                result = await handleNoShow(base44, data);
                break;

            case 'response_received':
                // Generic response from lead
                result = await handleResponse(base44, data);
                break;

            default:
                return Response.json({ error: 'Unknown event type' }, { status: 400 });
        }

        return Response.json({
            event_type,
            processed: true,
            result
        });

    } catch (error) {
        console.error('Event trigger error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

async function handleNewLead(base44, data) {
    const { lead_id } = data;
    
    // Trigger evaluation and initial contact
    const evaluation = await base44.asServiceRole.functions.invoke('evaluateLead', { lead_id, lead_data: data });
    
    return {
        action: 'new_lead_processed',
        evaluation: evaluation.data
    };
}

async function handleMissedCall(base44, data) {
    const { lead_id, phone_number, timestamp } = data;
    
    // Find or create lead
    let lead;
    const existingLeads = await base44.asServiceRole.entities.Lead.filter({ phone: phone_number });
    
    if (existingLeads.length > 0) {
        lead = existingLeads[0];
    } else {
        // Create new lead from missed call
        lead = await base44.asServiceRole.entities.Lead.create({
            name: 'Missed Call Lead',
            phone: phone_number,
            source: 'phone',
            vertical: 'dealer',
            status: 'new',
            priority: 'high',
            intent_score: 65,
            notes: `Missed call at ${timestamp}`,
            last_contact_date: timestamp
        });
    }
    
    // Send immediate SMS response
    const message = `Hi! I see you just called and we missed you. Sorry about that! How can we help you today? Are you interested in scheduling a test drive?`;
    
    await base44.asServiceRole.entities.Conversation.create({
        lead_id: lead.id,
        role: 'ai',
        message,
        action_type: 'message',
        ai_reasoning: 'Missed call recovery - immediate SMS outreach',
        channel: 'sms'
    });
    
    // Boost priority
    await base44.asServiceRole.entities.Lead.update(lead.id, {
        priority: 'high',
        intent_score: Math.min(100, (lead.intent_score || 50) + 15)
    });
    
    return { action: 'missed_call_recovered', lead_id: lead.id };
}

async function handleIncomingText(base44, data) {
    const { lead_id, message, timestamp } = data;
    
    // Log conversation
    await base44.asServiceRole.entities.Conversation.create({
        lead_id,
        role: 'lead',
        message,
        action_type: 'message',
        channel: 'sms'
    });
    
    // Update last contact
    await base44.asServiceRole.entities.Lead.update(lead_id, {
        last_contact_date: timestamp,
        follow_up_day: 0 // Reset follow-up sequence
    });
    
    // Trigger conversation engine
    const response = await base44.asServiceRole.functions.invoke('conversationEngine', {
        lead_id,
        incoming_message: message
    });
    
    return response.data;
}

async function handleIncomingEmail(base44, data) {
    const { lead_id, message, subject, timestamp } = data;
    
    await base44.asServiceRole.entities.Conversation.create({
        lead_id,
        role: 'lead',
        message: `${subject}\n\n${message}`,
        action_type: 'message',
        channel: 'email'
    });
    
    await base44.asServiceRole.entities.Lead.update(lead_id, {
        last_contact_date: timestamp,
        follow_up_day: 0
    });
    
    const response = await base44.asServiceRole.functions.invoke('conversationEngine', {
        lead_id,
        incoming_message: message
    });
    
    return response.data;
}

async function handleNoShow(base44, data) {
    const { appointment_id, lead_id } = data;
    
    // Update appointment status
    await base44.asServiceRole.entities.Appointment.update(appointment_id, {
        status: 'no_show'
    });
    
    // Send recovery message
    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    const message = `Hi ${lead.name}! We noticed you missed your appointment today. No worries - life happens! Would you like to reschedule? I have some openings tomorrow and later this week.`;
    
    await base44.asServiceRole.entities.Conversation.create({
        lead_id,
        role: 'ai',
        message,
        action_type: 'follow_up',
        ai_reasoning: 'No-show recovery attempt',
        channel: 'sms'
    });
    
    // Lower intent score slightly
    await base44.asServiceRole.entities.Lead.update(lead_id, {
        intent_score: Math.max(30, (lead.intent_score || 50) - 10),
        status: 'contacted'
    });
    
    return { action: 'no_show_recovery_sent' };
}

async function handleResponse(base44, data) {
    const { lead_id, message } = data;
    
    return await base44.asServiceRole.functions.invoke('conversationEngine', {
        lead_id,
        incoming_message: message
    });
}