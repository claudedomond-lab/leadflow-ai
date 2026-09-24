import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Parse incoming Twilio webhook data
        const formData = await req.formData();
        const from = formData.get('From');
        const body = formData.get('Body');
        const messageSid = formData.get('MessageSid');

        // Normalize phone number
        const normalizedPhone = from?.replace(/[^\d+]/g, '');

        // Find lead by phone number
        const leads = await base44.asServiceRole.entities.Lead.filter({
            phone: normalizedPhone
        });

        if (leads.length > 0) {
            const lead = leads[0];

            // Log conversation
            await base44.asServiceRole.entities.Conversation.create({
                lead_id: lead.id,
                role: 'lead',
                message: body,
                channel: 'sms',
                action_type: 'message'
            });

            // Trigger AI response (optional - call conversationEngine)
            await base44.asServiceRole.functions.invoke('conversationEngine', {
                lead_id: lead.id,
                incoming_message: body,
                channel: 'sms'
            });
        }

        // Respond to Twilio with TwiML (empty response = no auto-reply)
        return new Response(
            '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
            {
                headers: { 'Content-Type': 'text/xml' },
            }
        );
    } catch (error) {
        console.error('Twilio webhook error:', error);
        return new Response(
            '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
            {
                headers: { 'Content-Type': 'text/xml' },
            }
        );
    }
});