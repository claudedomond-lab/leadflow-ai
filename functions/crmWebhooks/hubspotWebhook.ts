import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * HubSpot CRM Webhook Handler
 * Receives contact/deal notifications from HubSpot
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();

        // HubSpot sends subscriptionType and objectId
        const objectId = body[0]?.objectId;
        
        // In production, you'd fetch full contact details from HubSpot API
        // For now, map from webhook payload
        const properties = body[0]?.properties || {};

        const leadData = {
            name: `${properties.firstname?.value || ''} ${properties.lastname?.value || ''}`.trim(),
            email: properties.email?.value,
            phone: properties.phone?.value || properties.mobilephone?.value,
            lead_source: properties.hs_lead_source?.value || 'hubspot',
            vehicle_interest: properties.vehicle_interest?.value || properties.notes?.value,
            time_submitted: properties.createdate?.value || new Date().toISOString()
        };

        leadData.crm_id = objectId;
        leadData.crm_type = 'hubspot';

        const result = await base44.asServiceRole.functions.invoke('receiveIncomingLead', leadData);

        return Response.json({
            success: true,
            base44_lead_id: result.data.lead_id,
            hubspot_contact_id: objectId
        });

    } catch (error) {
        console.error('HubSpot webhook error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});