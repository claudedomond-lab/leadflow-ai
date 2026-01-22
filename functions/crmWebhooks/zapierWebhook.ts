import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Zapier Universal Webhook Handler
 * Works with any CRM via Zapier integration
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();

        // Flexible field mapping - Zapier sends normalized data
        const leadData = {
            name: body.name || body.full_name || body.contact_name,
            email: body.email || body.email_address,
            phone: body.phone || body.phone_number || body.mobile,
            lead_source: body.source || body.lead_source || 'zapier',
            vehicle_interest: body.vehicle_interest || body.vehicle || body.notes,
            time_submitted: body.timestamp || body.created_at || new Date().toISOString()
        };

        // Store original CRM info
        leadData.crm_id = body.crm_id || body.id;
        leadData.crm_type = body.crm_type || 'zapier';

        const result = await base44.asServiceRole.functions.invoke('receiveIncomingLead', leadData);

        return Response.json({
            success: true,
            base44_lead_id: result.data.lead_id,
            message: 'Lead received via Zapier'
        });

    } catch (error) {
        console.error('Zapier webhook error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});