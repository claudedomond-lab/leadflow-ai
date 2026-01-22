import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Get all leads that need follow-up
        const now = new Date();
        const allLeads = await base44.asServiceRole.entities.Lead.list('-created_date', 500);

        // Filter leads that need follow-up today
        const leadsToFollowUp = allLeads.filter(lead => {
            // Skip converted, lost, or escalated leads
            if (['converted', 'lost', 'escalated', 'appointment_scheduled'].includes(lead.status)) {
                return false;
            }

            // Skip leads that have completed follow-up sequence
            if (lead.follow_up_day >= 7) {
                return false;
            }

            // Check if it's time for next follow-up
            const lastContact = new Date(lead.last_contact_date);
            const daysSinceContact = Math.floor((now - lastContact) / (1000 * 60 * 60 * 24));

            // Skip recently contacted leads to allow conversation flow
            if (lead.status === 'contacted' && daysSinceContact < 1) {
                return false;
            }

            // Follow-up schedule: Day 0, 1, 3, 5, 7
            const followUpSchedule = [0, 1, 3, 5, 7];
            const currentDay = lead.follow_up_day || 0;
            const nextDayIndex = followUpSchedule.indexOf(currentDay) + 1;

            if (nextDayIndex < followUpSchedule.length) {
                const targetDay = followUpSchedule[nextDayIndex];
                return daysSinceContact >= targetDay;
            }

            return false;
        });

        console.log(`Found ${leadsToFollowUp.length} leads needing follow-up`);

        const results = [];

        // Process each lead
        for (const lead of leadsToFollowUp) {
            try {
                const response = await base44.asServiceRole.functions.invoke('sendFollowUp', {
                    lead_id: lead.id
                });
                
                results.push({
                    lead_id: lead.id,
                    lead_name: lead.name,
                    success: true,
                    follow_up_day: response.data.follow_up_day
                });
            } catch (error) {
                console.error(`Error following up with lead ${lead.id}:`, error);
                results.push({
                    lead_id: lead.id,
                    lead_name: lead.name,
                    success: false,
                    error: error.message
                });
            }
        }

        return Response.json({
            processed: leadsToFollowUp.length,
            results,
            timestamp: now.toISOString()
        });

    } catch (error) {
        console.error('Error processing follow-ups:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});