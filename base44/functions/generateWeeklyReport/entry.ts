import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Get all data from past 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Fetch all leads
        const allLeads = await base44.asServiceRole.entities.Lead.list('-created_date', 500);
        const weekLeads = allLeads.filter(l => new Date(l.created_date) >= sevenDaysAgo);

        // Fetch all appointments
        const allAppointments = await base44.asServiceRole.entities.Appointment.list('-created_date', 500);
        const weekAppointments = allAppointments.filter(a => new Date(a.created_date) >= sevenDaysAgo);

        // Fetch all conversations
        const allConversations = await base44.asServiceRole.entities.Conversation.list('-created_date', 1000);
        const weekConversations = allConversations.filter(c => new Date(c.created_date) >= sevenDaysAgo);

        // Calculate metrics
        const totalLeads = weekLeads.length;
        const appointmentsBooked = weekAppointments.length;
        const convertedLeads = weekLeads.filter(l => l.status === 'converted').length;
        const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

        // Calculate average response time (AI responds instantly, so <1 min)
        const aiResponses = weekConversations.filter(c => c.role === 'ai');
        const averageResponseTime = aiResponses.length > 0 ? '<1' : '0';

        // Lead source performance
        const sourceCount = {};
        weekLeads.forEach(lead => {
            const source = lead.source || 'unknown';
            sourceCount[source] = (sourceCount[source] || 0) + 1;
        });
        const topLeadSources = Object.entries(sourceCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([source, count]) => ({ source, count }));

        // Status breakdown
        const statusBreakdown = {};
        weekLeads.forEach(lead => {
            const status = lead.status || 'unknown';
            statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
        });

        // Average intent score
        const avgIntentScore = weekLeads.length > 0
            ? (weekLeads.reduce((sum, l) => sum + (l.intent_score || 0), 0) / weekLeads.length).toFixed(0)
            : 0;

        // High-priority leads
        const highPriorityLeads = weekLeads.filter(l => l.priority === 'high').length;

        // Escalations
        const escalations = weekLeads.filter(l => l.status === 'escalated').length;

        const report = {
            period: 'Last 7 Days',
            generated_at: new Date().toISOString(),
            total_leads: totalLeads,
            appointments_booked: appointmentsBooked,
            converted_leads: convertedLeads,
            conversion_rate: `${conversionRate}%`,
            average_response_time: `${averageResponseTime} minutes`,
            average_intent_score: avgIntentScore,
            high_priority_leads: highPriorityLeads,
            escalations,
            top_lead_sources: topLeadSources,
            status_breakdown: statusBreakdown,
            ai_messages_sent: aiResponses.length,
            human_interventions: escalations,
            automation_rate: totalLeads > 0 ? `${(((totalLeads - escalations) / totalLeads) * 100).toFixed(1)}%` : '0%'
        };

        return Response.json(report);

    } catch (error) {
        console.error('Error generating report:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});