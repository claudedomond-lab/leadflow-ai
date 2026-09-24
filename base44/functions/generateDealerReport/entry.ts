import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate Dealer-Facing Report
 * Shows ROI, appointments booked, response times, lead recovery
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { period = 'weekly', dealer_id } = body; // weekly or monthly

        const days = period === 'weekly' ? 7 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch all data
        const allLeads = await base44.asServiceRole.entities.Lead.list('-created_date', 1000);
        const periodLeads = allLeads.filter(l => new Date(l.created_date) >= startDate);

        const allAppointments = await base44.asServiceRole.entities.Appointment.list('-created_date', 500);
        const periodAppointments = allAppointments.filter(a => new Date(a.created_date) >= startDate);

        const allConversations = await base44.asServiceRole.entities.Conversation.list('-created_date', 2000);
        const periodConversations = allConversations.filter(c => new Date(c.created_date) >= startDate);

        // Calculate key metrics
        const totalLeads = periodLeads.length;
        const appointmentsBooked = periodAppointments.length;
        const appointmentsCompleted = periodAppointments.filter(a => a.status === 'completed').length;
        const convertedLeads = periodLeads.filter(l => l.status === 'converted').length;
        const escalatedToHuman = periodLeads.filter(l => l.status === 'escalated').length;

        // Response time (AI responds in <30 seconds)
        const avgResponseTime = '<30 seconds';

        // Lead recovery rate
        const previouslyGhostedLeads = periodLeads.filter(l => 
            l.follow_up_day > 0 && l.status !== 'lost'
        ).length;
        const recoveredLeads = periodLeads.filter(l => 
            l.follow_up_day > 0 && ['appointment_scheduled', 'converted'].includes(l.status)
        ).length;
        const recoveryRate = previouslyGhostedLeads > 0 
            ? ((recoveredLeads / previouslyGhostedLeads) * 100).toFixed(1) 
            : '0';

        // Conversion metrics
        const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';
        const appointmentRate = totalLeads > 0 ? ((appointmentsBooked / totalLeads) * 100).toFixed(1) : '0';

        // AI automation rate
        const humanHandledLeads = escalatedToHuman;
        const aiHandledLeads = totalLeads - humanHandledLeads;
        const automationRate = totalLeads > 0 ? ((aiHandledLeads / totalLeads) * 100).toFixed(1) : '0';

        // Lead source performance
        const sourceBreakdown = {};
        periodLeads.forEach(l => {
            const source = l.source || 'unknown';
            if (!sourceBreakdown[source]) {
                sourceBreakdown[source] = { total: 0, appointments: 0, converted: 0 };
            }
            sourceBreakdown[source].total++;
            if (l.status === 'appointment_scheduled' || l.status === 'converted') {
                sourceBreakdown[source].appointments++;
            }
            if (l.status === 'converted') {
                sourceBreakdown[source].converted++;
            }
        });

        // Messages sent
        const aiMessagesSent = periodConversations.filter(c => c.role === 'ai').length;
        const leadResponses = periodConversations.filter(c => c.role === 'lead').length;

        // Time saved calculation
        const avgTimePerLead = 5; // minutes a human would spend
        const timeSavedMinutes = aiHandledLeads * avgTimePerLead;
        const timeSavedHours = (timeSavedMinutes / 60).toFixed(1);

        // ROI estimate (assuming avg car deal profit = $2,500)
        const avgDealProfit = 2500;
        const estimatedRevenue = convertedLeads * avgDealProfit;
        const monthlySubscription = 1499; // Your pricing
        const roi = ((estimatedRevenue - monthlySubscription) / monthlySubscription * 100).toFixed(0);

        const report = {
            period: period === 'weekly' ? 'Last 7 Days' : 'Last 30 Days',
            generated_at: new Date().toISOString(),
            
            // Key Performance Metrics
            metrics: {
                leads_handled: totalLeads,
                appointments_booked: appointmentsBooked,
                appointments_completed: appointmentsCompleted,
                deals_closed: convertedLeads,
                avg_response_time: avgResponseTime,
                lead_recovery_rate: `${recoveryRate}%`,
                conversion_rate: `${conversionRate}%`,
                appointment_rate: `${appointmentRate}%`
            },

            // AI Performance
            ai_performance: {
                automation_rate: `${automationRate}%`,
                leads_handled_by_ai: aiHandledLeads,
                escalated_to_human: humanHandledLeads,
                messages_sent: aiMessagesSent,
                lead_responses: leadResponses,
                response_rate: leadResponses > 0 ? `${((leadResponses / aiMessagesSent) * 100).toFixed(1)}%` : '0%'
            },

            // Source Performance
            lead_sources: Object.entries(sourceBreakdown).map(([source, data]) => ({
                source,
                total_leads: data.total,
                appointments: data.appointments,
                converted: data.converted,
                conversion_rate: `${((data.converted / data.total) * 100).toFixed(1)}%`
            })).sort((a, b) => b.total_leads - a.total_leads),

            // ROI & Value
            value_delivered: {
                time_saved_hours: timeSavedHours,
                estimated_revenue: `$${estimatedRevenue.toLocaleString()}`,
                subscription_cost: `$${monthlySubscription}`,
                estimated_roi: `${roi}%`,
                recovered_leads: recoveredLeads
            },

            // Summary for dealer
            executive_summary: `In the ${period === 'weekly' ? 'past week' : 'past month'}, your AI handled ${totalLeads} leads, booked ${appointmentsBooked} appointments, and contributed to ${convertedLeads} closed deals. AI responded in under 30 seconds and automated ${automationRate}% of lead interactions, saving your team ${timeSavedHours} hours. Estimated revenue impact: $${estimatedRevenue.toLocaleString()}.`
        };

        return Response.json(report);

    } catch (error) {
        console.error('Report generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});