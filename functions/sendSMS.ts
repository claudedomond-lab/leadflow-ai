import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { to, message, from } = await req.json();

        if (!to || !message || !from) {
            return Response.json({ 
                error: 'Missing required fields: to, message, from' 
            }, { status: 400 });
        }

        // Send SMS via Twilio
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    To: to,
                    From: from,
                    Body: message,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return Response.json({ 
                error: 'Failed to send SMS', 
                details: data 
            }, { status: response.status });
        }

        return Response.json({
            success: true,
            messageSid: data.sid,
            status: data.status,
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});