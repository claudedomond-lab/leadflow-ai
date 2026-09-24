import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Master Admin Daily Operations - Monitor all dealers, execute follow-ups, handle escalations
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Get all active dealers
        const allDealers = await base44.asServiceRole.entities.DealerConfig.filter({ 
            setup_status: 'active' 
        });

        const dailyReport = {
            date: today,
            active_dealers: [],
            new_dealers_added: [],
            overall_internal_notes: ''
        };

        // Process each dealer
        for (const dealer of allDealers) {
            const dealerReport = {
                dealer_id: dealer.dealer_id,
                dealer_name: dealer.dealer_name,
                total_leads: 0,
                responses_sent: 0,
                appointments_booked: 0,
                escalations: 0,
                internal_notes: []
            };

            // 1. Check for new leads since last run
            const allLeads = await base44.asServiceRole.entities.Lead.list('-created_date', 1000);
            const recentLeads = allLeads.filter(l => 
                new Date(l.created_date) >= yesterday &&
                l.vertical === 'dealer'
            );
            dealerReport.total_leads = recentLeads.length;

            // Check AI responded to each lead
            const conversations = await base44.asServiceRole.entities.Conversation.list('-created_date', 2000);
            const aiResponses = conversations.filter(c => 
                c.role === 'ai' && 
                new Date(c.created_date) >= yesterday
            );
            dealerReport.responses_sent = aiResponses.length;

            // Log slow responses (>2 minutes)
            const slowResponses = recentLeads.filter(lead => {
                const leadTime = new Date(lead.created_date);
                const firstResponse = aiResponses.find(c => c.lead_id === lead.id);
                if (firstResponse) {
                    const responseTime = new Date(firstResponse.created_date);
                    const diffMinutes = (responseTime - leadTime) / 1000 / 60;
                    return diffMinutes > 2;
                }
                return false;
            });

            if (slowResponses.length > 0) {
                dealerReport.internal_notes.push(`${slowResponses.length} leads had response time >2 minutes`);
            }

            // 2. Execute follow-up sequences
            const leadsNeedingFollowUp = recentLeads.filter(l => 
                l.status !== 'converted' && 
                l.status !== 'lost' &&
                l.next_follow_up_date &&
                new Date(l.next_follow_up_date) <= new Date()
            );

            for (const lead of leadsNeedingFollowUp) {
                try {
                    await base44.asServiceRole.functions.invoke('sendFollowUp', { lead_id: lead.id });
                    dealerReport.internal_notes.push(`Follow-up sent to lead ${lead.name} (Day ${lead.follow_up_day})`);
                } catch (error) {
                    dealerReport.internal_notes.push(`Failed to send follow-up to ${lead.name}: ${error.message}`);
                }
            }

            // 3. Check for escalations
            const escalatedLeads = recentLeads.filter(l => l.status === 'escalated');
            dealerReport.escalations = escalatedLeads.length;

            // Notify dealer contacts for high-priority escalations
            const highPriorityEscalations = escalatedLeads.filter(l => l.priority === 'high');
            for (const lead of highPriorityEscalations) {
                if (dealer.escalation_contacts && dealer.escalation_contacts.length > 0) {
                    for (const contact of dealer.escalation_contacts) {
                        try {
                            await base44.asServiceRole.integrations.Core.SendEmail({
                                to: contact.email,
                                subject: `🔥 Hot Lead Escalation: ${lead.name}`,
                                body: `High-priority lead requires immediate attention.\n\nLead: ${lead.name}\nPhone: ${lead.phone}\nEmail: ${lead.email}\nIntent Score: ${lead.intent_score}\nNotes: ${lead.notes}`
                            });
                        } catch (error) {
                            dealerReport.internal_notes.push(`Failed to notify ${contact.email}: ${error.message}`);
                        }
                    }
                }
            }

            // 4. Count appointments booked
            const appointments = await base44.asServiceRole.entities.Appointment.list('-created_date', 500);
            const recentAppointments = appointments.filter(a => 
                new Date(a.created_date) >= yesterday &&
                a.vertical === 'dealer'
            );
            dealerReport.appointments_booked = recentAppointments.length;

            // Check for anomalies
            if (dealerReport.total_leads > 0 && dealerReport.responses_sent === 0) {
                dealerReport.internal_notes.push('⚠️ CRITICAL: Leads received but no AI responses sent!');
            }

            if (dealerReport.total_leads > 100) {
                dealerReport.internal_notes.push(`🔥 High volume: ${dealerReport.total_leads} leads in 24h`);
            }

            dealerReport.internal_notes = dealerReport.internal_notes.length > 0 
                ? dealerReport.internal_notes.join(' | ') 
                : 'All flows running smoothly';

            dailyReport.active_dealers.push(dealerReport);
        }

        // Overall summary
        const totalLeads = dailyReport.active_dealers.reduce((sum, d) => sum + d.total_leads, 0);
        const totalResponses = dailyReport.active_dealers.reduce((sum, d) => sum + d.responses_sent, 0);
        const totalAppointments = dailyReport.active_dealers.reduce((sum, d) => sum + d.appointments_booked, 0);
        const totalEscalations = dailyReport.active_dealers.reduce((sum, d) => sum + d.escalations, 0);

        dailyReport.overall_internal_notes = `Master AI daily ops completed. ${allDealers.length} active dealers, ${totalLeads} leads, ${totalResponses} responses, ${totalAppointments} appointments, ${totalEscalations} escalations.`;

        return Response.json(dailyReport);

    } catch (error) {
        console.error('Master admin daily ops error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});