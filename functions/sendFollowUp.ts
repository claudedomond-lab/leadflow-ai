import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { lead_id } = body;

        // Get lead details
        const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
        const followUpDay = lead.follow_up_day || 0;

        // Get conversation history
        const conversations = await base44.asServiceRole.entities.Conversation.filter({ lead_id });
        const lastResponse = conversations
            .filter(c => c.role === 'lead')
            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

        // Determine tone and message based on follow-up day
        const followUpMessages = {
            0: `Hi ${lead.name}! Just wanted to follow up on my previous message about ${lead.vertical_data?.vehicle_interest || 'your vehicle interest'}. Have you had a chance to think about when you'd like to come in for a test drive?`,
            1: `Hey ${lead.name}! I know you're probably busy, but I wanted to make sure you got my message. We've got some great deals right now${lead.vertical_data?.vehicle_interest ? ` on the ${lead.vertical_data.vehicle_interest}` : ''}. Would love to help you find the perfect car!`,
            3: `${lead.name}, just checking in! I wanted to make sure we don't miss the opportunity to help you with your vehicle search. If now isn't the right time, no worries - just let me know when works better for you.`,
            5: `Hi ${lead.name}! Last check-in from me. If you're still interested in ${lead.vertical_data?.vehicle_interest || 'finding the right vehicle'}, I'm here to help. Otherwise, I'll let you reach out when you're ready. No pressure!`,
            7: `${lead.name}, thanks for your interest! I'll close out our conversation for now. Feel free to reach back out anytime - we'd love to help you when the timing is right. Take care!`
        };

        const message = followUpMessages[followUpDay] || followUpMessages[0];

        // Adjust tone based on previous responsiveness
        const responsiveness = lastResponse ? 'fast' : 'slow';
        
        // Create follow-up conversation
        await base44.asServiceRole.entities.Conversation.create({
            lead_id,
            role: 'ai',
            message,
            action_type: 'follow_up',
            ai_reasoning: `Day ${followUpDay} follow-up. Responsiveness: ${responsiveness}`,
            channel: 'sms'
        });

        // Increment follow-up day
        const nextDay = followUpDay === 0 ? 1 : followUpDay === 1 ? 3 : followUpDay === 3 ? 5 : followUpDay === 5 ? 7 : 7;
        
        await base44.asServiceRole.entities.Lead.update(lead_id, {
            follow_up_day: nextDay,
            last_contact_date: new Date().toISOString(),
            status: followUpDay >= 7 ? 'lost' : lead.status
        });

        // Schedule next follow-up if not at day 7
        if (followUpDay < 7) {
            const daysUntilNext = nextDay - followUpDay;
            const nextFollowUpDate = new Date();
            nextFollowUpDate.setDate(nextFollowUpDate.getDate() + daysUntilNext);
            
            await base44.asServiceRole.entities.Lead.update(lead_id, {
                next_follow_up_date: nextFollowUpDate.toISOString()
            });
        }

        return Response.json({
            action: 'follow_up',
            message,
            follow_up_day: followUpDay,
            next_follow_up_day: nextDay,
            status: followUpDay >= 7 ? 'sequence_complete' : 'scheduled'
        });

    } catch (error) {
        console.error('Error sending follow-up:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});