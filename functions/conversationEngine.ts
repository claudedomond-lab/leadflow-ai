import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Conversation Engine - Natural language processing, intent detection, decision-making
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { lead_id, incoming_message } = body;

        // Get lead and conversation history
        const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
        const conversations = await base44.asServiceRole.entities.Conversation.filter({ lead_id });
        const config = await base44.asServiceRole.entities.VerticalConfig.filter({ vertical: lead.vertical });
        
        // Build conversation context
        const conversationHistory = conversations
            .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
            .slice(-10)
            .map(c => `${c.role}: ${c.message}`)
            .join('\n');

        // AI Decision Prompt
        const prompt = `You are an expert lead conversion AI for a ${lead.vertical} business.

Lead Profile:
- Name: ${lead.name}
- Status: ${lead.status}
- Intent Score: ${lead.intent_score}/100
- Priority: ${lead.priority}
- Timeline: ${lead.timeline || 'unknown'}
- Interest: ${lead.vertical_data?.vehicle_interest || 'not specified'}

Recent Conversation:
${conversationHistory}

Lead's Latest Message:
"${incoming_message}"

Your Task:
1. Detect the lead's intent (interested/price_shopping/not_ready/objection/ready_to_book)
2. Determine best response strategy (engage/qualify/close/push_appointment/handle_objection/escalate)
3. Craft a natural, conversational response
4. Decide next action

Tone: ${config[0]?.tone || 'friendly'} but direct

Return JSON:
{
  "intent_detected": "interested|price_shopping|not_ready|objection|ready_to_book|negotiating",
  "sentiment": "positive|neutral|negative",
  "urgency": "high|medium|low",
  "strategy": "engage|qualify|close|push_appointment|handle_objection|escalate",
  "response_message": "Your natural response here",
  "next_action": "book_appointment|follow_up|escalate|qualify_more|none",
  "intent_score_adjustment": 5,
  "reasoning": "Brief explanation"
}`;

        const aiDecision = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    intent_detected: { type: "string" },
                    sentiment: { type: "string" },
                    urgency: { type: "string" },
                    strategy: { type: "string" },
                    response_message: { type: "string" },
                    next_action: { type: "string" },
                    intent_score_adjustment: { type: "number" },
                    reasoning: { type: "string" }
                }
            }
        });

        // Log AI response
        await base44.asServiceRole.entities.Conversation.create({
            lead_id,
            role: 'ai',
            message: aiDecision.response_message,
            action_type: 'message',
            ai_reasoning: aiDecision.reasoning,
            channel: 'sms'
        });

        // Update intent score
        const newIntentScore = Math.max(0, Math.min(100, 
            (lead.intent_score || 50) + aiDecision.intent_score_adjustment
        ));

        await base44.asServiceRole.entities.Lead.update(lead_id, {
            intent_score: newIntentScore,
            last_contact_date: new Date().toISOString()
        });

        // Execute next action
        let actionResult = null;
        if (aiDecision.next_action === 'book_appointment') {
            actionResult = await base44.asServiceRole.functions.invoke('proposeAppointment', { lead_id });
        } else if (aiDecision.next_action === 'escalate') {
            actionResult = await base44.asServiceRole.functions.invoke('escalateLead', { 
                lead_id, 
                reason: aiDecision.reasoning 
            });
        }

        // Track outcome for learning
        await base44.asServiceRole.entities.Lead.update(lead_id, {
            vertical_data: {
                ...(lead.vertical_data || {}),
                conversation_outcomes: [
                    ...((lead.vertical_data?.conversation_outcomes || [])),
                    {
                        timestamp: new Date().toISOString(),
                        intent: aiDecision.intent_detected,
                        sentiment: aiDecision.sentiment,
                        strategy_used: aiDecision.strategy,
                        intent_score_after: newIntentScore
                    }
                ].slice(-20) // Keep last 20 outcomes
            }
        });

        return Response.json({
            intent_detected: aiDecision.intent_detected,
            sentiment: aiDecision.sentiment,
            response_sent: aiDecision.response_message,
            next_action: aiDecision.next_action,
            intent_score: newIntentScore,
            action_result: actionResult?.data
        });

    } catch (error) {
        console.error('Conversation engine error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});