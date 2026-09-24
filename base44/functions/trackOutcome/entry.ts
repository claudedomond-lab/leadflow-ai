import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Learning Loop - Tracks outcomes to improve AI over time
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { lead_id, outcome_type, metadata } = body;

        // Outcome types: 'appointment_booked', 'appointment_completed', 'converted', 
        //                'ghosted', 'lost', 'escalated', 'responded', 'no_show'

        const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
        const conversations = await base44.asServiceRole.entities.Conversation.filter({ lead_id });

        // Calculate metrics
        const aiMessages = conversations.filter(c => c.role === 'ai').length;
        const leadMessages = conversations.filter(c => c.role === 'lead').length;
        const responseRate = aiMessages > 0 ? (leadMessages / aiMessages) : 0;
        const daysSinceFirstContact = Math.floor(
            (new Date() - new Date(lead.created_date)) / (1000 * 60 * 60 * 24)
        );

        // Create outcome record
        const outcomeData = {
            lead_id,
            outcome_type,
            lead_vertical: lead.vertical,
            lead_source: lead.source,
            initial_intent_score: lead.vertical_data?.initial_intent_score || lead.intent_score,
            final_intent_score: lead.intent_score,
            priority: lead.priority,
            days_to_outcome: daysSinceFirstContact,
            ai_messages_sent: aiMessages,
            lead_responses: leadMessages,
            response_rate: responseRate,
            follow_up_day_reached: lead.follow_up_day,
            strategies_used: lead.vertical_data?.conversation_outcomes?.map(o => o.strategy_used) || [],
            metadata,
            timestamp: new Date().toISOString()
        };

        // Store in lead's vertical data for analysis
        await base44.asServiceRole.entities.Lead.update(lead_id, {
            vertical_data: {
                ...(lead.vertical_data || {}),
                outcome: outcomeData
            }
        });

        // Analyze patterns for learning
        const allLeads = await base44.asServiceRole.entities.Lead.list('-created_date', 500);
        const completedLeads = allLeads.filter(l => 
            l.vertical_data?.outcome && 
            l.vertical === lead.vertical
        );

        if (completedLeads.length >= 10) {
            const successfulLeads = completedLeads.filter(l => 
                ['appointment_booked', 'converted'].includes(l.vertical_data.outcome.outcome_type)
            );

            // Calculate success patterns
            const avgSuccessIntentScore = successfulLeads.length > 0
                ? successfulLeads.reduce((sum, l) => sum + l.vertical_data.outcome.initial_intent_score, 0) / successfulLeads.length
                : 50;

            const avgSuccessResponseRate = successfulLeads.length > 0
                ? successfulLeads.reduce((sum, l) => sum + l.vertical_data.outcome.response_rate, 0) / successfulLeads.length
                : 0.5;

            const avgDaysToConversion = successfulLeads.length > 0
                ? successfulLeads.reduce((sum, l) => sum + l.vertical_data.outcome.days_to_outcome, 0) / successfulLeads.length
                : 3;

            // Top performing sources
            const sourcePerformance = {};
            successfulLeads.forEach(l => {
                const source = l.source;
                sourcePerformance[source] = (sourcePerformance[source] || 0) + 1;
            });

            const insights = {
                vertical: lead.vertical,
                total_leads_analyzed: completedLeads.length,
                success_rate: (successfulLeads.length / completedLeads.length * 100).toFixed(1) + '%',
                avg_success_intent_score: avgSuccessIntentScore.toFixed(0),
                avg_success_response_rate: (avgSuccessResponseRate * 100).toFixed(1) + '%',
                avg_days_to_conversion: avgDaysToConversion.toFixed(1),
                top_performing_sources: Object.entries(sourcePerformance)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([source, count]) => ({ source, conversions: count }))
            };

            return Response.json({
                outcome_recorded: true,
                outcome_type,
                lead_id,
                insights,
                recommendation: outcomeData.final_intent_score > avgSuccessIntentScore 
                    ? 'Lead shows above-average conversion potential'
                    : 'Standard follow-up protocol recommended'
            });
        }

        return Response.json({
            outcome_recorded: true,
            outcome_type,
            lead_id,
            message: 'Not enough data yet for insights (need 10+ completed leads)'
        });

    } catch (error) {
        console.error('Track outcome error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});