import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { lead_id, appointment_time, appointment_type = 'test_drive' } = body;

        // Get lead details
        const lead = await base44.asServiceRole.entities.Lead.get(lead_id);

        // Create appointment
        const appointment = await base44.asServiceRole.entities.Appointment.create({
            lead_id: lead_id,
            lead_name: lead.name,
            type: appointment_type,
            scheduled_date: appointment_time,
            duration_minutes: 60,
            status: 'scheduled',
            location: 'Main Dealership Location',
            notes: `Auto-booked via AI for ${lead.vertical_data?.vehicle_interest || 'vehicle inquiry'}`,
            vertical: lead.vertical
        });

        // Format appointment time for message
        const appointmentDate = new Date(appointment_time);
        const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
        });
        const formattedTime = appointmentDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });

        // Create confirmation message
        const confirmationMessage = `Perfect! Your appointment is confirmed for ${formattedDate} at ${formattedTime}. ✅\n\nWe'll have the ${lead.vertical_data?.vehicle_interest || 'vehicle'} ready for your test drive. See you then!\n\nNeed to reschedule? Just let me know.`;

        await base44.asServiceRole.entities.Conversation.create({
            lead_id: lead_id,
            role: 'ai',
            message: confirmationMessage,
            action_type: 'book_appointment',
            ai_reasoning: 'Appointment successfully booked and confirmed',
            channel: 'sms'
        });

        // Update lead status
        await base44.asServiceRole.entities.Lead.update(lead_id, {
            status: 'appointment_scheduled',
            last_contact_date: new Date().toISOString()
        });

        return Response.json({
            action: 'book_appointment',
            appointment_id: appointment.id,
            appointment_time,
            message: confirmationMessage,
            status: 'confirmed'
        });

    } catch (error) {
        console.error('Error booking appointment:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});