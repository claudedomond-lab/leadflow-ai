import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Rules & Guardrails Engine - Enforces boundaries, compliance, and business logic
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { lead_id, action_type, proposed_action } = body;

        const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
        const config = await base44.asServiceRole.entities.VerticalConfig.filter({ vertical: lead.vertical });
        
        const rules = {
            // Pricing Rules
            can_discuss_price: lead.status !== 'new',
            max_discount_mention: 10, // percentage
            
            // Communication Rules
            max_messages_per_day: 3,
            quiet_hours_start: 21, // 9 PM
            quiet_hours_end: 8, // 8 AM
            
            // Escalation Rules
            escalate_if_negotiating_price: true,
            escalate_if_angry: true,
            escalate_if_complex_trade_in: true,
            
            // Appointment Rules
            min_hours_notice: 2,
            max_future_booking_days: 14,
            
            // Industry-Specific (Dealer)
            cannot_commit_to_specific_price: true,
            cannot_guarantee_trade_in_value: true,
            must_mention_dealer_fees: false,
            
            // Compliance
            required_disclaimers: ['Offers subject to credit approval'],
            cannot_guarantee_inventory: true
        };

        // Check rules
        const violations = [];
        const now = new Date();
        const currentHour = now.getHours();

        // Quiet hours check
        if (currentHour >= rules.quiet_hours_start || currentHour < rules.quiet_hours_end) {
            violations.push({
                rule: 'quiet_hours',
                severity: 'block',
                message: 'Cannot send messages during quiet hours (9 PM - 8 AM)'
            });
        }

        // Daily message limit
        const conversations = await base44.asServiceRole.entities.Conversation.filter({ lead_id });
        const todayMessages = conversations.filter(c => {
            const msgDate = new Date(c.created_date);
            return c.role === 'ai' && 
                   msgDate.toDateString() === now.toDateString() &&
                   c.action_type === 'message';
        });

        if (todayMessages.length >= rules.max_messages_per_day) {
            violations.push({
                rule: 'max_messages_per_day',
                severity: 'block',
                message: `Already sent ${rules.max_messages_per_day} messages today`
            });
        }

        // Check if proposed action contains pricing discussion
        if (proposed_action?.message && action_type === 'message') {
            const message = proposed_action.message.toLowerCase();
            
            // Pricing guardrails
            if ((message.includes('price') || message.includes('$') || message.includes('discount')) 
                && !rules.can_discuss_price) {
                violations.push({
                    rule: 'pricing_discussion',
                    severity: 'warn',
                    message: 'Pricing discussion with new lead - proceed with caution'
                });
            }

            // Detect negotiation language
            const negotiationWords = ['deal', 'negotiate', 'lowest price', 'best price', 'discount', 'can you do better'];
            if (negotiationWords.some(word => message.includes(word))) {
                violations.push({
                    rule: 'negotiation_detected',
                    severity: 'escalate',
                    message: 'Negotiation detected - recommend human intervention',
                    action: 'escalate'
                });
            }

            // Compliance checks
            if (message.includes('guarantee') && rules.cannot_guarantee_inventory) {
                violations.push({
                    rule: 'false_guarantee',
                    severity: 'block',
                    message: 'Cannot guarantee inventory availability'
                });
            }
        }

        // Appointment timing rules
        if (action_type === 'book_appointment' && proposed_action?.appointment_time) {
            const appointmentTime = new Date(proposed_action.appointment_time);
            const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);
            
            if (hoursUntilAppointment < rules.min_hours_notice) {
                violations.push({
                    rule: 'min_hours_notice',
                    severity: 'block',
                    message: `Appointments require ${rules.min_hours_notice} hours notice`
                });
            }

            const daysUntilAppointment = hoursUntilAppointment / 24;
            if (daysUntilAppointment > rules.max_future_booking_days) {
                violations.push({
                    rule: 'max_future_booking',
                    severity: 'block',
                    message: `Cannot book more than ${rules.max_future_booking_days} days in advance`
                });
            }
        }

        // Check for escalation triggers
        if (lead.intent_score < 20 && action_type === 'message') {
            violations.push({
                rule: 'low_intent_score',
                severity: 'warn',
                message: 'Very low intent score - consider pausing outreach',
                suggestion: 'Wait for lead to re-engage'
            });
        }

        // Determine if action should proceed
        const blockers = violations.filter(v => v.severity === 'block');
        const shouldEscalate = violations.some(v => v.severity === 'escalate');
        const warnings = violations.filter(v => v.severity === 'warn');

        return Response.json({
            allowed: blockers.length === 0,
            should_escalate: shouldEscalate,
            violations,
            warnings,
            rules_applied: Object.keys(rules).length,
            recommendation: blockers.length > 0 ? 'block_action' : 
                           shouldEscalate ? 'escalate_to_human' :
                           warnings.length > 0 ? 'proceed_with_caution' : 'proceed'
        });

    } catch (error) {
        console.error('Rules engine error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});