import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * RESTful API Endpoint - /v1/leads
 * API Key authentication, rate limiting
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // API Key authentication
        const apiKey = req.headers.get('X-API-Key');
        if (!apiKey) {
            return Response.json({ error: 'Missing API Key' }, { status: 401 });
        }

        // Validate API key
        const sources = await base44.asServiceRole.entities.LeadSource.filter({ 
            api_key: apiKey,
            source_type: 'api',
            is_active: true
        });

        if (sources.length === 0) {
            return Response.json({ error: 'Invalid API Key' }, { status: 403 });
        }

        const leadSource = sources[0];

        // Rate limiting check
        const rateLimit = leadSource.config?.rate_limit || 100;
        const recentLeads = await base44.asServiceRole.entities.Lead.filter({
            source: 'api',
            created_date: { $gte: new Date(Date.now() - 60 * 60 * 1000).toISOString() }
        });

        if (recentLeads.length >= rateLimit) {
            return Response.json({ 
                error: 'Rate limit exceeded',
                limit: rateLimit,
                reset_in: '1 hour'
            }, { status: 429 });
        }

        const body = await req.json();
        
        // Validate required fields
        if (!body.name || !body.email || !body.phone) {
            return Response.json({ 
                error: 'Missing required fields: name, email, phone' 
            }, { status: 400 });
        }

        // Normalize lead data
        const leadData = {
            name: body.name,
            email: body.email,
            phone: normalizePhone(body.phone),
            source: 'api',
            vertical: body.vertical || 'dealer',
            status: 'new',
            priority: body.priority || 'medium',
            notes: body.notes || '',
            vertical_data: {
                vehicle_interest: body.vehicle_interest || {},
                api_source: leadSource.source_name,
                api_metadata: body.metadata || {}
            }
        };

        // Deduplication
        const duplicateCheck = await base44.asServiceRole.functions.invoke('deduplicateLead', {
            lead_data: leadData,
            dealer_id: leadSource.dealer_id,
            window_hours: 72
        });

        if (duplicateCheck.data.is_duplicate) {
            return Response.json({
                success: false,
                duplicate: true,
                original_lead_id: duplicateCheck.data.original_lead_id,
                message: 'Duplicate lead detected'
            }, { status: 409 });
        }

        // Create lead
        const lead = await base44.asServiceRole.entities.Lead.create(leadData);

        // Update source stats
        await base44.asServiceRole.entities.LeadSource.update(leadSource.id, {
            stats: {
                ...leadSource.stats,
                total_leads: (leadSource.stats?.total_leads || 0) + 1,
                last_received: new Date().toISOString(),
                status: 'active'
            }
        });

        // Trigger AI processing
        await base44.asServiceRole.functions.invoke('eventTrigger', {
            event_type: 'new_lead',
            data: { lead_id: lead.id }
        });

        return Response.json({
            success: true,
            lead_id: lead.id,
            message: 'Lead ingested successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('API ingestion error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function normalizePhone(phone) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        return `+1${digits}`;
    } else if (digits.length === 11 && digits[0] === '1') {
        return `+${digits}`;
    }
    return phone;
}