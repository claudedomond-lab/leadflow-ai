import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Parse incoming lead data
        const body = await req.json();
        const {
            name,
            phone,
            email,
            lead_source,
            vehicle_interest,
            time_submitted
        } = body;

        // Validate required fields
        if (!name) {
            return Response.json({ error: 'Name is required' }, { status: 400 });
        }

        // Map lead_source to our source enum
        const sourceMap = {
            'Facebook': 'facebook',
            'Google': 'google',
            'Autotrader': 'other'
        };
        const source = sourceMap[lead_source] || 'website';

        // Determine vertical (defaulting to dealer for now, can be expanded)
        const vertical = 'dealer';

        // Create lead in database
        const lead = await base44.asServiceRole.entities.Lead.create({
            name,
            email: email || '',
            phone: phone || '',
            source,
            vertical,
            status: 'new',
            priority: 'medium',
            intent_score: 50, // Default, will be updated by AI
            notes: vehicle_interest ? `Interested in: ${vehicle_interest}` : '',
            vertical_data: {
                vehicle_interest
            },
            follow_up_day: 0,
            last_contact_date: time_submitted || new Date().toISOString()
        });

        // Trigger AI evaluation
        const evaluation = await base44.asServiceRole.functions.invoke('evaluateLead', {
            lead_id: lead.id,
            lead_data: {
                name,
                phone,
                email,
                vehicle_interest,
                source: lead_source
            }
        });

        // Trigger initial auto-response
        const initialResponse = await base44.asServiceRole.functions.invoke('sendInitialResponse', {
            lead_id: lead.id
        });

        // Update lead status after initial response
        await base44.asServiceRole.entities.Lead.update(lead.id, {
            status: 'contacted'
        });

        return Response.json({
            success: true,
            lead_id: lead.id,
            status: 'contacted',
            evaluation: evaluation.data,
            initial_response: initialResponse.data
        });

    } catch (error) {
        console.error('Error receiving lead:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});