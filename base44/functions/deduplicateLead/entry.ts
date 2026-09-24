import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Lead Deduplication - Detect duplicates within time window
 * Matching by Email/Phone/VIN with fuzzy name matching
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { lead_data, dealer_id, window_hours = 72 } = body;

        const windowStart = new Date(Date.now() - window_hours * 60 * 60 * 1000);

        // Get recent leads
        const recentLeads = await base44.asServiceRole.entities.Lead.list('-created_date', 1000);
        const candidateLeads = recentLeads.filter(l => 
            new Date(l.created_date) >= windowStart
        );

        let bestMatch = null;
        let highestScore = 0;
        let matchType = '';

        for (const candidate of candidateLeads) {
            let score = 0;
            let type = '';

            // Exact email match (highest priority)
            if (lead_data.email && candidate.email && 
                lead_data.email.toLowerCase() === candidate.email.toLowerCase()) {
                score = 100;
                type = 'exact_email';
            }
            // Exact phone match
            else if (lead_data.phone && candidate.phone && 
                     normalizePhone(lead_data.phone) === normalizePhone(candidate.phone)) {
                score = 95;
                type = 'exact_phone';
            }
            // VIN match
            else if (lead_data.vertical_data?.vehicle_interest?.vin && 
                     candidate.vertical_data?.vehicle_interest?.vin &&
                     lead_data.vertical_data.vehicle_interest.vin === candidate.vertical_data.vehicle_interest.vin) {
                score = 90;
                type = 'exact_vin';
            }
            // Fuzzy name + partial match
            else {
                const nameScore = fuzzyNameMatch(lead_data.name, candidate.name);
                const phonePartial = lead_data.phone && candidate.phone && 
                    lead_data.phone.slice(-4) === candidate.phone.slice(-4);
                
                if (nameScore > 80 && phonePartial) {
                    score = 70;
                    type = 'fuzzy_name';
                }
            }

            if (score > highestScore) {
                highestScore = score;
                bestMatch = candidate;
                matchType = type;
            }
        }

        const isDuplicate = highestScore >= 70;

        if (isDuplicate && bestMatch) {
            // Log duplicate
            await base44.asServiceRole.entities.LeadDuplicate.create({
                original_lead_id: bestMatch.id,
                duplicate_lead_id: lead_data.id || 'pending',
                match_type: matchType,
                match_score: highestScore,
                time_window_hours: Math.round((Date.now() - new Date(bestMatch.created_date)) / 1000 / 60 / 60),
                action_taken: 'flagged',
                dealer_id
            });

            return Response.json({
                is_duplicate: true,
                original_lead_id: bestMatch.id,
                match_type: matchType,
                match_score: highestScore,
                original_lead: {
                    name: bestMatch.name,
                    email: bestMatch.email,
                    phone: bestMatch.phone,
                    created_date: bestMatch.created_date
                }
            });
        }

        return Response.json({
            is_duplicate: false,
            message: 'No duplicate detected'
        });

    } catch (error) {
        console.error('Deduplication error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function normalizePhone(phone) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    return digits;
}

function fuzzyNameMatch(name1, name2) {
    if (!name1 || !name2) return 0;
    
    const n1 = name1.toLowerCase().replace(/[^a-z]/g, '');
    const n2 = name2.toLowerCase().replace(/[^a-z]/g, '');
    
    // Levenshtein distance
    const len1 = n1.length;
    const len2 = n2.length;
    const matrix = [];

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = n1[i - 1] === n2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    const similarity = ((maxLen - distance) / maxLen) * 100;

    return Math.round(similarity);
}