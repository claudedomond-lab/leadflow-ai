import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { lead_id } = body;

        // Get lead details
        const lead = await base44.asServiceRole.entities.Lead.get(lead_id);

        // Get business hours
        const config = await base44.asServiceRole.entities.VerticalConfig.filter({ vertical: lead.vertical });
        const businessHours = config[0]?.business_hours || { start: '09:00', end: '18:00' };

        // Generate appointment slots (next 3 business days)
        const slots = [];
        const now = new Date();
        
        for (let i = 1; i <= 3; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() + i);
            
            // Skip weekends for now
            if (date.getDay() === 0 || date.getDay() === 6) continue;
            
            // Morning slot (10 AM)
            const morning = new Date(date);
            morning.setHours(10, 0, 0, 0);
            slots.push(morning);
            
            // Afternoon slot (2 PM)
            const afternoon = new Date(date);
            afternoon.setHours(14, 0, 0, 0);
            slots.push(afternoon);
        }

        // Format slots for message
        const formattedSlots = slots.slice(0, 4).map((slot, idx) => {
            const day = slot.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
            const time = slot.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            return `${idx + 1}. ${day} at ${time}`;
        }).join('\n');

        // Create conversation with appointment proposal
        const message = `Great news! Based on your interest, I'd love to schedule a test drive. Here are some available times:\n\n${formattedSlots}\n\nWhich works best for you? Just reply with the number, or suggest another time that's convenient.`;

        await base44.asServiceRole.entities.Conversation.create({
            lead_id: lead_id,
            role: 'ai',
            message,
            action_type: 'book_appointment',
            ai_reasoning: 'High-intent lead with budget match - proposing test drive slots',
            channel: 'sms'
        });

        // Update lead status
        await base44.asServiceRole.entities.Lead.update(lead_id, {
            status: 'qualifying'
        });

        return Response.json({
            action: 'propose_appointment',
            message,
            slots: slots.slice(0, 4).map(s => s.toISOString()),
            next_step: 'await_lead_response'
        });

    } catch (error) {
        console.error('Error proposing appointment:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});