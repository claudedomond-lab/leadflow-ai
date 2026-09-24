import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * ADF/XML Email Parser - Parse Auto-lead Data Format emails
 * Handles inbound SMTP traffic and extracts lead data
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { email_body, from_email, dealer_id } = body;

        // Parse ADF/XML structure
        const adfData = parseADFXML(email_body);

        if (!adfData) {
            return Response.json({ 
                error: 'Invalid ADF/XML format',
                parsed: false 
            }, { status: 400 });
        }

        // Normalize data
        const normalizedLead = {
            name: `${adfData.prospect?.name?.first || ''} ${adfData.prospect?.name?.last || ''}`.trim(),
            email: adfData.prospect?.email || adfData.prospect?.contact?.email,
            phone: normalizePhone(adfData.prospect?.phone || adfData.prospect?.contact?.phone),
            source: 'adf_email',
            vertical: 'dealer',
            status: 'new',
            priority: 'medium',
            vertical_data: {
                vehicle_interest: adfData.vehicle ? {
                    year: adfData.vehicle.year,
                    make: adfData.vehicle.make,
                    model: adfData.vehicle.model,
                    vin: adfData.vehicle.vin,
                    stock: adfData.vehicle.stock
                } : {},
                vendor: adfData.vendor || {},
                adf_source: from_email,
                raw_adf: email_body
            }
        };

        // Check for duplicates (72-hour window)
        const duplicateCheck = await base44.asServiceRole.functions.invoke('deduplicateLead', {
            lead_data: normalizedLead,
            dealer_id,
            window_hours: 72
        });

        if (duplicateCheck.data.is_duplicate) {
            return Response.json({
                parsed: true,
                duplicate_detected: true,
                original_lead_id: duplicateCheck.data.original_lead_id,
                action: 'merged'
            });
        }

        // Create lead
        const lead = await base44.asServiceRole.entities.Lead.create(normalizedLead);

        // Track ingestion
        const sources = await base44.asServiceRole.entities.LeadSource.filter({ 
            dealer_id, 
            source_type: 'adf_email' 
        });
        
        if (sources.length > 0) {
            await base44.asServiceRole.entities.LeadSource.update(sources[0].id, {
                stats: {
                    ...sources[0].stats,
                    total_leads: (sources[0].stats?.total_leads || 0) + 1,
                    last_received: new Date().toISOString()
                }
            });
        }

        // Trigger AI evaluation
        await base44.asServiceRole.functions.invoke('eventTrigger', {
            event_type: 'new_lead',
            data: { lead_id: lead.id }
        });

        return Response.json({
            success: true,
            lead_id: lead.id,
            parsed: true,
            duplicate_detected: false
        });

    } catch (error) {
        console.error('ADF parsing error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function parseADFXML(xmlString) {
    try {
        // Simple XML parser for ADF format
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, 'text/xml');

        const prospect = {
            name: {
                first: doc.querySelector('prospect name part[type="first"]')?.textContent,
                last: doc.querySelector('prospect name part[type="last"]')?.textContent
            },
            email: doc.querySelector('prospect email')?.textContent,
            phone: doc.querySelector('prospect phone')?.textContent
        };

        const vehicle = {
            year: doc.querySelector('vehicle year')?.textContent,
            make: doc.querySelector('vehicle make')?.textContent,
            model: doc.querySelector('vehicle model')?.textContent,
            vin: doc.querySelector('vehicle vin')?.textContent,
            stock: doc.querySelector('vehicle stock')?.textContent
        };

        const vendor = {
            name: doc.querySelector('vendor vendorname')?.textContent,
            contact: doc.querySelector('vendor contact')?.textContent
        };

        return { prospect, vehicle, vendor };
    } catch (error) {
        console.error('XML parsing failed:', error);
        return null;
    }
}

function normalizePhone(phone) {
    if (!phone) return null;
    // Convert to E.164 format
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        return `+1${digits}`;
    } else if (digits.length === 11 && digits[0] === '1') {
        return `+${digits}`;
    }
    return phone;
}