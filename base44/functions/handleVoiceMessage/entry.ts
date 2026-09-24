import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Handle Voice Message - Processes recorded voicemail from Twilio
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.text();
        const params = new URLSearchParams(body);

        // Extract recording data
        const recordingUrl = params.get('RecordingUrl');
        const from = params.get('From');
        const callSid = params.get('CallSid');

        if (!from) {
            return new Response('Invalid data', { status: 400 });
        }

        // Find lead by phone
        const existingLeads = await base44.asServiceRole.entities.Lead.filter({ phone: from });
        if (existingLeads.length === 0) {
            return new Response('Lead not found', { status: 404 });
        }
        const lead = existingLeads[0];

        // Log the voicemail
        await base44.asServiceRole.entities.Conversation.create({
            lead_id: lead.id,
            role: 'lead',
            message: recordingUrl ? `Voicemail recorded: ${recordingUrl}` : 'Voicemail left but no recording',
            action_type: 'voicemail',
            channel: 'voice'
        });

        // Trigger follow-up SMS
        await base44.asServiceRole.functions.invoke('sendInitialResponse', {
            lead_id: lead.id
        });

        // Return empty TwiML
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
</Response>`;

        return new Response(twiml, {
            headers: { 'Content-Type': 'text/xml' },
            status: 200
        });

    } catch (error) {
        console.error('Voicemail processing error:', error);
        return new Response('Error', { status: 500 });
    }
});