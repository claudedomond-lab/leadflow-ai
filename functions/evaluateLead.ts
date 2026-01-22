import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { lead_id, lead_data } = body;

        // Get lead from database
        const lead = await base44.asServiceRole.entities.Lead.get(lead_id);

        // Use AI to evaluate the lead
        const evaluationPrompt = `
You are an expert lead qualification AI for a car dealership.

Analyze this lead and provide a JSON evaluation:

Lead Details:
- Name: ${lead_data.name}
- Phone: ${lead_data.phone || 'Not provided'}
- Email: ${lead_data.email || 'Not provided'}
- Source: ${lead_data.source}
- Vehicle Interest: ${lead_data.vehicle_interest || 'Not specified'}

Evaluate based on:
1. Intent (high/medium/low) - How likely are they to buy?
2. Budget Match (yes/no) - Does their interest suggest they can afford inventory?
3. Timeline (immediate/1-2 weeks/later) - When are they looking to buy?
4. Priority (low/medium/high) - Overall lead priority

Consider:
- Specific vehicle interest = higher intent
- Contact info provided = higher responsiveness
- Source quality (referrals > Google > Facebook)

Return ONLY valid JSON matching this schema exactly:
{
  "intent": "high|medium|low",
  "budget_match": "yes|no",
  "timeline": "immediate|1-2 weeks|later",
  "priority": "low|medium|high",
  "reasoning": "Brief explanation of the evaluation"
}`;

        const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: evaluationPrompt,
            response_json_schema: {
                type: "object",
                properties: {
                    intent: { type: "string", enum: ["high", "medium", "low"] },
                    budget_match: { type: "string", enum: ["yes", "no"] },
                    timeline: { type: "string", enum: ["immediate", "1-2 weeks", "later"] },
                    priority: { type: "string", enum: ["low", "medium", "high"] },
                    reasoning: { type: "string" }
                },
                required: ["intent", "budget_match", "timeline", "priority"]
            }
        });

        const evaluation = aiResponse;

        // Calculate intent score (0-100)
        const intentScores = { high: 85, medium: 55, low: 25 };
        let intent_score = intentScores[evaluation.intent];
        
        // Boost score if budget matches and timeline is immediate
        if (evaluation.budget_match === 'yes') intent_score += 10;
        if (evaluation.timeline === 'immediate') intent_score += 5;

        // Update lead with evaluation
        await base44.asServiceRole.entities.Lead.update(lead_id, {
            intent_score: Math.min(100, intent_score),
            priority: evaluation.priority,
            status: evaluation.intent === 'high' && evaluation.budget_match === 'yes' ? 'qualifying' : 'contacted',
            timeline: evaluation.timeline
        });

        // Create AI greeting conversation
        const config = await base44.asServiceRole.entities.VerticalConfig.filter({ vertical: lead.vertical });
        const greetingMessage = config[0]?.greeting_message || 
            `Hi ${lead_data.name}! Thanks for your interest${lead_data.vehicle_interest ? ` in the ${lead_data.vehicle_interest}` : ''}. I'm here to help! When would be a good time for a test drive?`;

        await base44.asServiceRole.entities.Conversation.create({
            lead_id: lead_id,
            role: 'ai',
            message: greetingMessage,
            action_type: 'message',
            ai_reasoning: `Initial greeting. Evaluation: ${evaluation.intent} intent, ${evaluation.timeline} timeline`,
            channel: 'sms'
        });

        // If high-intent lead with budget match, trigger appointment booking
        if (evaluation.intent === 'high' && evaluation.budget_match === 'yes') {
            await base44.asServiceRole.functions.invoke('proposeAppointment', {
                lead_id: lead_id
            });
        }

        return Response.json({
            intent: evaluation.intent,
            budget_match: evaluation.budget_match,
            timeline: evaluation.timeline,
            priority: evaluation.priority,
            intent_score,
            reasoning: evaluation.reasoning,
            next_action: evaluation.intent === 'high' && evaluation.budget_match === 'yes' 
                ? 'propose_appointment' 
                : 'follow_up'
        });

    } catch (error) {
        console.error('Error evaluating lead:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});