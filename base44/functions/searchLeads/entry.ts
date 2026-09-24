import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Advanced Search Service - Fuzzy matching, date-range filtering, saved searches
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await req.json();
        const { 
            keyword, 
            status, 
            source, 
            priority, 
            date_from, 
            date_to, 
            intent_score_min, 
            intent_score_max,
            dealer_id,
            fuzzy = true,
            save_search = false,
            search_name
        } = body;

        // Get all leads
        let allLeads = await base44.entities.Lead.list('-created_date', 5000);

        // Apply filters
        let results = allLeads;

        if (status && status.length > 0) {
            results = results.filter(l => status.includes(l.status));
        }

        if (source && source.length > 0) {
            results = results.filter(l => source.includes(l.source));
        }

        if (priority && priority.length > 0) {
            results = results.filter(l => priority.includes(l.priority));
        }

        if (date_from) {
            results = results.filter(l => new Date(l.created_date) >= new Date(date_from));
        }

        if (date_to) {
            results = results.filter(l => new Date(l.created_date) <= new Date(date_to));
        }

        if (intent_score_min !== undefined) {
            results = results.filter(l => (l.intent_score || 0) >= intent_score_min);
        }

        if (intent_score_max !== undefined) {
            results = results.filter(l => (l.intent_score || 0) <= intent_score_max);
        }

        // Keyword search (fuzzy)
        if (keyword) {
            results = results.filter(l => {
                const searchText = `${l.name} ${l.email} ${l.phone} ${l.notes || ''} ${JSON.stringify(l.vertical_data || {})}`.toLowerCase();
                
                if (fuzzy) {
                    // Fuzzy matching - allow typos
                    const keywordLower = keyword.toLowerCase();
                    return searchText.includes(keywordLower) || 
                           fuzzyMatch(l.name.toLowerCase(), keywordLower) ||
                           fuzzyMatch(l.email?.toLowerCase() || '', keywordLower) ||
                           fuzzyMatch(l.vertical_data?.vehicle_interest?.vin?.toLowerCase() || '', keywordLower);
                } else {
                    return searchText.includes(keyword.toLowerCase());
                }
            });
        }

        // Save search if requested
        if (save_search && search_name) {
            await base44.entities.SavedSearch.create({
                search_name,
                dealer_id: dealer_id || user.email,
                filters: {
                    status,
                    source,
                    priority,
                    date_from,
                    date_to,
                    intent_score_min,
                    intent_score_max,
                    keyword
                },
                is_public: false
            });
        }

        return Response.json({
            total_results: results.length,
            results: results.slice(0, 100), // Limit to 100 for performance
            filters_applied: {
                keyword,
                status,
                source,
                priority,
                date_from,
                date_to,
                intent_score_min,
                intent_score_max,
                fuzzy
            },
            saved: save_search
        });

    } catch (error) {
        console.error('Search error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function fuzzyMatch(str, keyword) {
    if (!str || !keyword) return false;
    
    const threshold = 0.7;
    const len1 = str.length;
    const len2 = keyword.length;
    
    if (Math.abs(len1 - len2) > len2 * 0.5) return false;
    
    // Simple fuzzy check - keyword chars appear in order
    let matchCount = 0;
    let lastIndex = -1;
    
    for (const char of keyword) {
        const index = str.indexOf(char, lastIndex + 1);
        if (index > lastIndex) {
            matchCount++;
            lastIndex = index;
        }
    }
    
    return (matchCount / keyword.length) >= threshold;
}