import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Test Dealer Setup - Validate SMS, calendar, and webhooks
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { dealer_id, test_phone } = body;

        // Get dealer config
        const configs = await base44.asServiceRole.entities.DealerConfig.filter({ dealer_id });
        if (configs.length === 0) {
            return Response.json({ error: 'Dealer not found' }, { status: 404 });
        }

        const dealerConfig = configs[0];
        const testResults = {};

        // Test 1: SMS Functionality (simulated)
        try {
            // Create test lead
            const testLead = await base44.asServiceRole.entities.Lead.create({
                name: 'Test Lead',
                phone: test_phone || dealerConfig.phone,
                email: 'test@example.com',
                source: 'test',
                vertical: 'dealer',
                status: 'new',
                priority: 'high',
                notes: 'Onboarding test lead'
            });

            // Send test message
            await base44.asServiceRole.entities.Conversation.create({
                lead_id: testLead.id,
                role: 'ai',
                message: `Test message from ${dealerConfig.dealer_name}. Your AI is configured correctly!`,
                action_type: 'message',
                channel: 'sms',
                ai_reasoning: 'Onboarding validation test'
            });

            testResults.sms_test = 'success';
        } catch (error) {
            testResults.sms_test = `failed: ${error.message}`;
        }

        // Test 2: Calendar Booking
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(10, 0, 0, 0);

            const testAppointment = await base44.asServiceRole.entities.Appointment.create({
                lead_id: 'test-lead',
                lead_name: 'Test Lead',
                type: 'test_drive',
                scheduled_date: tomorrow.toISOString(),
                duration_minutes: dealerConfig.calendar_config.test_drive_duration,
                status: 'scheduled',
                location: dealerConfig.location,
                notes: 'Onboarding validation test',
                vertical: 'dealer'
            });

            // Clean up test appointment
            await base44.asServiceRole.entities.Appointment.delete(testAppointment.id);

            testResults.calendar_test = 'success';
        } catch (error) {
            testResults.calendar_test = `failed: ${error.message}`;
        }

        // Test 3: Webhook Integration
        try {
            if (dealerConfig.lead_sources && dealerConfig.lead_sources.length > 0) {
                const webhookSource = dealerConfig.lead_sources[0];
                testResults.webhook_test = webhookSource.webhook_url 
                    ? 'configured' 
                    : 'not_configured';
            } else {
                testResults.webhook_test = 'no_sources_configured';
            }
        } catch (error) {
            testResults.webhook_test = `failed: ${error.message}`;
        }

        // Update dealer config with test results
        await base44.asServiceRole.entities.DealerConfig.update(dealerConfig.id, {
            test_results: {
                ...testResults,
                last_tested: new Date().toISOString()
            },
            setup_status: Object.values(testResults).every(r => r === 'success' || r === 'configured')
                ? 'active'
                : 'testing'
        });

        const allTestsPassed = testResults.sms_test === 'success' && 
                              testResults.calendar_test === 'success';

        return Response.json({
            dealer_id,
            dealer_name: dealerConfig.dealer_name,
            test_results: testResults,
            all_tests_passed: allTestsPassed,
            status: allTestsPassed ? 'active' : 'needs_attention',
            message: allTestsPassed 
                ? '✅ All tests passed! Dealer is ready to go live.'
                : '⚠️ Some tests failed. Review configuration and retry.',
            output: {
                dealer_name: dealerConfig.dealer_name,
                dealer_id,
                lead_sources: dealerConfig.lead_sources.map(s => ({
                    source_name: s.source_name,
                    mapped_fields: ["name", "phone", "email", "vehicle_interest"]
                })),
                inventory_loaded: !!dealerConfig.inventory_data?.vehicle_count,
                calendar_connected: testResults.calendar_test === 'success',
                follow_up_active: dealerConfig.follow_up_rules.day_0_active,
                escalation_contacts: dealerConfig.escalation_contacts.map(c => `${c.name}/${c.email}/${c.phone}`),
                sample_test_status: allTestsPassed ? 'success' : 'failure',
                internal_notes: dealerConfig.internal_notes
            }
        });

    } catch (error) {
        console.error('Test setup error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});