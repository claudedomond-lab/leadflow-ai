import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { lead_id, reason } = body;

        // Get lead details
        const lead = await base44.asServiceRole.entities.Lead.get(lead_id);

        // Update lead status
        await base44.asServiceRole.entities.Lead.update(lead_id, {
            status: 'escalated',
            priority: 'high',
            notes: lead.notes ? `${lead.notes}\n\nESCALATED: ${reason}` : `ESCALATED: ${reason}`
        });

        // Create escalation conversation
        const escalationMessage = `I've noted your request! Since this involves ${reason.toLowerCase()}, I'm connecting you with one of our specialists who can better assist you. They'll reach out shortly. Thanks for your patience!`;

        await base44.asServiceRole.entities.Conversation.create({
            lead_id,
            role: 'ai',
            message: escalationMessage,
            action_type: 'escalate',
            ai_reasoning: `Escalated to human: ${reason}`,
            channel: 'sms'
        });

        // Send notification email to sales team
        try {
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: 'sales@dealership.com', // Replace with actual sales email
                subject: `🚨 Lead Escalation Required - ${lead.name}`,
                body: `
Lead requires human intervention:

Name: ${lead.name}
Phone: ${lead.phone}
Email: ${lead.email}
Vehicle Interest: ${lead.vertical_data?.vehicle_interest || 'Not specified'}
Intent Score: ${lead.intent_score}

Reason for Escalation: ${reason}

View lead: [Dashboard Link]

Please follow up ASAP.
                `.trim()
            });
        } catch (emailError) {
            console.warn('Failed to send escalation email:', emailError);
        }

        return Response.json({
            action: 'escalate',
            message: 'Lead requires human intervention',
            priority: 'high',
            reason,
            escalation_message: escalationMessage
        });

    } catch (error) {
        console.error('Error escalating lead:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});