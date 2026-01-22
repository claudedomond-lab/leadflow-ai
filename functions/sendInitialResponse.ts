import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { lead_id } = body;

        // Get lead details
        const lead = await base44.asServiceRole.entities.Lead.get(lead_id);

        // Craft personalized initial message
        const message = `Hi ${lead.name}! Thanks for your interest${lead.vertical_data?.vehicle_interest ? ` in the ${lead.vertical_data.vehicle_interest}` : ''}. I'd love to help you find the perfect vehicle. When would be a good time for us to chat or schedule a test drive?`;

        // Create initial conversation
        await base44.asServiceRole.entities.Conversation.create({
            lead_id,
            role: 'ai',
            message,
            action_type: 'initial_response',
            ai_reasoning: 'Automated initial welcome response',
            channel: 'sms'
        });

        // Update lead
        await base44.asServiceRole.entities.Lead.update(lead_id, {
            last_contact_date: new Date().toISOString(),
            status: 'contacted'
        });

        return Response.json({
            success: true,
            message,
            lead_status: 'contacted'
        });

    } catch (error) {
        console.error('Error sending initial response:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});