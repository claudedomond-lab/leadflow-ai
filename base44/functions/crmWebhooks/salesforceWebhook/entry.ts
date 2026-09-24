import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Salesforce CRM Webhook Handler
 * Receives new lead notifications from Salesforce
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();

        // Salesforce lead payload mapping
        const leadData = {
            name: `${body.FirstName || ''} ${body.LastName || ''}`.trim(),
            email: body.Email,
            phone: body.Phone || body.MobilePhone,
            lead_source: body.LeadSource || 'salesforce',
            vehicle_interest: body.Vehicle_Interest__c || body.Description,
            time_submitted: body.CreatedDate || new Date().toISOString()
        };

        // Store Salesforce Lead ID for sync
        leadData.crm_id = body.Id;
        leadData.crm_type = 'salesforce';

        // Trigger lead intake
        const result = await base44.asServiceRole.functions.invoke('receiveIncomingLead', leadData);

        // Return success to Salesforce
        return Response.json({
            success: true,
            base44_lead_id: result.data.lead_id,
            salesforce_lead_id: body.Id
        });

    } catch (error) {
        console.error('Salesforce webhook error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});