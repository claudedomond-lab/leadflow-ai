import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Receive Voice Call Webhook Handler - Processes incoming voice calls from Twilio
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.text();
        const params = new URLSearchParams(body);

        // Extract Twilio voice data
        const from = params.get('From'); // Caller's phone number
        const to = params.get('To'); // Your Twilio number
        const callSid = params.get('CallSid');

        if (!from) {
            return new Response('Invalid call data', { status: 400 });
        }

        // Find existing lead by phone
        let lead = null;
        const existingLeads = await base44.asServiceRole.entities.Lead.filter({ phone: from });
        if (existingLeads.length > 0) {
            lead = existingLeads[0];
        }

        if (!lead) {
            // Create new lead from call
            lead = await base44.asServiceRole.entities.Lead.create({
                phone: from,
                source: 'phone_call',
                vertical: 'dealer',
                status: 'new',
                intent_score: 50,
                notes: `Lead called in`,
                last_contact_date: new Date().toISOString()
            });
        }

        // Log the call
        await base44.asServiceRole.entities.Conversation.create({
            lead_id: lead.id,
            role: 'lead',
            message: 'Incoming phone call',
            action_type: 'incoming_call',
            channel: 'voice'
        });

        // Update lead status
        await base44.asServiceRole.entities.Lead.update(lead.id, {
            status: 'contacted',
            last_contact_date: new Date().toISOString()
        });

        // Generate voice response TwiML
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you for calling LeadFlow AI. We're here to help you find the perfect vehicle. Please leave a message after the beep, and we'll get back to you shortly.</Say>
    <Record maxLength="30" action="/functions/handleVoiceMessage" method="POST" />
    <Say voice="alice">We didn't receive a message. Please call back or text us. Goodbye.</Say>
</Response>`;

        return new Response(twiml, {
            headers: { 'Content-Type': 'text/xml' },
            status: 200
        });

    } catch (error) {
        console.error('Voice call processing error:', error);
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Sorry, we're experiencing technical difficulties. Please try again later.</Say>
    <Hangup />
</Response>`;
        return new Response(twiml, {
            headers: { 'Content-Type': 'text/xml' },
            status: 200
        });
    }
});