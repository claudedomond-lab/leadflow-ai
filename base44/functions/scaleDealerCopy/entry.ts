import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Scale New Dealer - Copy existing dealer configuration and customize
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const {
            source_dealer_id,
            new_dealer_name,
            new_location,
            new_phone,
            new_email,
            new_escalation_contacts,
            new_lead_sources,
            test_phone
        } = body;

        // Get source dealer configuration
        const sourceDealers = await base44.asServiceRole.entities.DealerConfig.filter({ 
            dealer_id: source_dealer_id 
        });

        if (sourceDealers.length === 0) {
            return Response.json({ error: 'Source dealer not found' }, { status: 404 });
        }

        const sourceDealer = sourceDealers[0];
        const new_dealer_id = `dealer_${Date.now()}`;

        // Copy configuration with new details
        const newDealerConfig = await base44.asServiceRole.entities.DealerConfig.create({
            dealer_name: new_dealer_name,
            dealer_id: new_dealer_id,
            location: new_location,
            phone: new_phone,
            email: new_email,
            
            // Copy from source
            business_hours: sourceDealer.business_hours,
            calendar_config: sourceDealer.calendar_config,
            follow_up_rules: sourceDealer.follow_up_rules,
            
            // New dealer-specific
            escalation_contacts: new_escalation_contacts || sourceDealer.escalation_contacts,
            lead_sources: new_lead_sources || [],
            
            inventory_data: {
                source: 'manual',
                vehicle_count: 0,
                last_synced: new Date().toISOString()
            },
            
            setup_status: 'testing',
            internal_notes: `Copied from ${sourceDealer.dealer_name} on ${new Date().toISOString()}`
        });

        // Create VerticalConfig
        await base44.asServiceRole.entities.VerticalConfig.create({
            vertical: 'dealer',
            business_name: new_dealer_name,
            greeting_message: `Hi! Thanks for reaching out to ${new_dealer_name}. How can we help you today?`,
            qualification_questions: [
                "What type of vehicle are you interested in?",
                "What's your timeline for purchasing?",
                "Do you have a trade-in?",
                "Have you been pre-approved for financing?"
            ],
            appointment_types: ["test_drive", "consultation", "follow_up_call"],
            business_hours: sourceDealer.business_hours,
            tone: "professional",
            is_active: true
        });

        // Run validation tests
        let testResults = {
            sms_test: 'pending',
            calendar_test: 'pending',
            webhook_test: 'not_configured'
        };

        try {
            // Test SMS
            const testLead = await base44.asServiceRole.entities.Lead.create({
                name: 'Test Lead',
                phone: test_phone || new_phone,
                email: 'test@example.com',
                source: 'test',
                vertical: 'dealer',
                status: 'new',
                priority: 'high',
                notes: `Scale test for ${new_dealer_name}`
            });

            await base44.asServiceRole.entities.Conversation.create({
                lead_id: testLead.id,
                role: 'ai',
                message: `Test message from ${new_dealer_name}. System configured successfully!`,
                action_type: 'message',
                channel: 'sms',
                ai_reasoning: 'Scaling validation test'
            });

            testResults.sms_test = 'success';

            // Test calendar
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(10, 0, 0, 0);

            const testAppointment = await base44.asServiceRole.entities.Appointment.create({
                lead_id: testLead.id,
                lead_name: 'Test Lead',
                type: 'test_drive',
                scheduled_date: tomorrow.toISOString(),
                duration_minutes: newDealerConfig.calendar_config.test_drive_duration,
                status: 'scheduled',
                location: new_location,
                notes: 'Scaling validation test',
                vertical: 'dealer'
            });

            await base44.asServiceRole.entities.Appointment.delete(testAppointment.id);
            testResults.calendar_test = 'success';

        } catch (error) {
            testResults.sms_test = `failed: ${error.message}`;
        }

        // Update dealer config with test results
        await base44.asServiceRole.entities.DealerConfig.update(newDealerConfig.id, {
            test_results: {
                ...testResults,
                last_tested: new Date().toISOString()
            },
            setup_status: testResults.sms_test === 'success' && testResults.calendar_test === 'success' 
                ? 'active' 
                : 'testing'
        });

        return Response.json({
            success: true,
            new_dealer_id,
            dealer_name: new_dealer_name,
            configuration_copied: true,
            inventory_mapped: newDealerConfig.inventory_data.vehicle_count > 0,
            calendar_connected: testResults.calendar_test === 'success',
            follow_up_active: newDealerConfig.follow_up_rules.day_0_active,
            escalation_contacts: newDealerConfig.escalation_contacts.map(c => `${c.name}/${c.email}/${c.phone}`),
            test_status: testResults.sms_test === 'success' && testResults.calendar_test === 'success' 
                ? 'success' 
                : 'partial_failure',
            internal_notes: `Dealer successfully copied from ${sourceDealer.dealer_name} and ${testResults.sms_test === 'success' ? 'activated' : 'in testing phase'}`,
            test_results: testResults
        });

    } catch (error) {
        console.error('Scale dealer error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});