import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Receive SMS Webhook Handler - Processes incoming SMS from Twilio
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.text();
        const params = new URLSearchParams(body);

        // Extract Twilio SMS data
        const from = params.get('From'); // Sender's phone number
        const to = params.get('To'); // Your Twilio number
        const message = params.get('Body'); // SMS body
        const messageSid = params.get('MessageSid');

        if (!from || !message) {
            return new Response('Invalid SMS data', { status: 400 });
        }

        // Find existing lead by phone
        let lead = null;
        const existingLeads = await base44.asServiceRole.entities.Lead.filter({ phone: from });
        if (existingLeads.length > 0) {
            lead = existingLeads[0];
        }

        if (!lead) {
            // Create new lead from SMS
            lead = await base44.asServiceRole.entities.Lead.create({
                phone: from,
                source: 'sms',
                vertical: 'dealer',
                status: 'new',
                intent_score: 50,
                notes: `Lead contacted via SMS: ${message}`,
                last_contact_date: new Date().toISOString()
            });
        }

        // Log incoming message
        await base44.asServiceRole.entities.Conversation.create({
            lead_id: lead.id,
            role: 'lead',
            message: message,
            action_type: 'incoming_sms',
            channel: 'sms'
        });

        // Trigger AI conversation engine
        const aiResponse = await base44.asServiceRole.functions.invoke('conversationEngine', {
            lead_id: lead.id,
            incoming_message: message
        });

        // Return TwiML response for Twilio
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${aiResponse.data.response_sent}</Message>
</Response>`;

        return new Response(twiml, {
            headers: { 'Content-Type': 'text/xml' },
            status: 200
        });

    } catch (error) {
        console.error('SMS processing error:', error);
        // Return empty TwiML to acknowledge receipt
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
</Response>`;
        return new Response(twiml, {
            headers: { 'Content-Type': 'text/xml' },
            status: 200
        });
    }
});