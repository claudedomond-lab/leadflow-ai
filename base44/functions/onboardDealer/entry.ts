import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Dealer Onboarding - Save configuration and validate setup
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
            dealer_name,
            location,
            phone,
            email,
            business_hours,
            escalation_contacts,
            lead_sources,
            inventory_data,
            calendar_config,
            follow_up_rules,
            internal_notes
        } = body;

        // Generate unique dealer ID
        const dealer_id = `dealer_${Date.now()}`;

        // Validate required fields
        if (!dealer_name || !phone || !email) {
            return Response.json({
                error: 'Missing required fields: dealer_name, phone, email'
            }, { status: 400 });
        }

        // Create dealer configuration
        const dealerConfig = await base44.asServiceRole.entities.DealerConfig.create({
            dealer_name,
            dealer_id,
            location,
            phone,
            email,
            business_hours: business_hours || {
                monday: "9:00 AM - 7:00 PM",
                tuesday: "9:00 AM - 7:00 PM",
                wednesday: "9:00 AM - 7:00 PM",
                thursday: "9:00 AM - 7:00 PM",
                friday: "9:00 AM - 7:00 PM",
                saturday: "9:00 AM - 6:00 PM",
                sunday: "Closed"
            },
            escalation_contacts: escalation_contacts || [],
            lead_sources: lead_sources || [],
            inventory_data: inventory_data || {},
            calendar_config: calendar_config || {
                test_drive_duration: 60,
                available_slots: ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"],
                booking_buffer: 2
            },
            follow_up_rules: follow_up_rules || {
                day_0_active: true,
                day_3_active: true,
                day_5_active: true,
                day_7_active: true,
                auto_escalate_after_days: 7
            },
            setup_status: 'testing',
            internal_notes: internal_notes || ''
        });

        // Create corresponding VerticalConfig for this dealer
        await base44.asServiceRole.entities.VerticalConfig.create({
            vertical: 'dealer',
            business_name: dealer_name,
            greeting_message: `Hi! Thanks for reaching out to ${dealer_name}. How can we help you today?`,
            qualification_questions: [
                "What type of vehicle are you interested in?",
                "What's your timeline for purchasing?",
                "Do you have a trade-in?",
                "Have you been pre-approved for financing?"
            ],
            appointment_types: ["test_drive", "consultation", "follow_up_call"],
            business_hours: business_hours || {
                start: "09:00",
                end: "19:00",
                days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
            },
            tone: "professional",
            is_active: true
        });

        return Response.json({
            success: true,
            dealer_id,
            dealer_name,
            config_id: dealerConfig.id,
            message: 'Dealer configuration saved. Run tests to validate setup.',
            next_steps: [
                'Test SMS functionality',
                'Test calendar booking',
                'Test webhook integration',
                'Activate system'
            ]
        });

    } catch (error) {
        console.error('Onboarding error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});