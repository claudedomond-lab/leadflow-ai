import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Email Weekly/Monthly Report to Dealer
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { dealer_email, period = 'weekly' } = body;

        // Generate report
        const reportResponse = await base44.asServiceRole.functions.invoke('generateDealerReport', { period });
        const report = reportResponse.data;

        // Format email
        const subject = period === 'weekly' 
            ? '📊 Your Weekly AI Performance Report'
            : '📊 Your Monthly AI Performance Report';

        const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e293b; color: white; padding: 20px; text-align: center; }
        .metric-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 10px 0; }
        .metric-value { font-size: 32px; font-weight: bold; color: #1e293b; }
        .metric-label { font-size: 14px; color: #64748b; }
        .section { margin: 20px 0; }
        .highlight { background: #10b981; color: white; padding: 15px; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background: #e2e8f0; padding: 10px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 AI Performance Report</h1>
            <p>${report.period}</p>
        </div>

        <div class="section">
            <p>${report.executive_summary}</p>
        </div>

        <div class="highlight">
            <h2 style="margin-top: 0;">💰 Value Delivered</h2>
            <p>Estimated Revenue: <strong>${report.value_delivered.estimated_revenue}</strong></p>
            <p>Time Saved: <strong>${report.value_delivered.time_saved_hours} hours</strong></p>
            <p>ROI: <strong>${report.value_delivered.estimated_roi}</strong></p>
        </div>

        <div class="section">
            <h2>📈 Key Metrics</h2>
            <div class="metric-box">
                <div class="metric-value">${report.metrics.leads_handled}</div>
                <div class="metric-label">Leads Handled by AI</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${report.metrics.appointments_booked}</div>
                <div class="metric-label">Appointments Booked</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${report.metrics.deals_closed}</div>
                <div class="metric-label">Deals Closed</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${report.metrics.avg_response_time}</div>
                <div class="metric-label">Average Response Time</div>
            </div>
        </div>

        <div class="section">
            <h2>🎯 Lead Source Performance</h2>
            <table>
                <thead>
                    <tr>
                        <th>Source</th>
                        <th>Leads</th>
                        <th>Appointments</th>
                        <th>Conversion Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.lead_sources.map(source => `
                        <tr>
                            <td>${source.source}</td>
                            <td>${source.total_leads}</td>
                            <td>${source.appointments}</td>
                            <td>${source.conversion_rate}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>🤖 AI Automation</h2>
            <p><strong>${report.ai_performance.automation_rate}</strong> of leads handled automatically</p>
            <p><strong>${report.ai_performance.messages_sent}</strong> messages sent</p>
            <p><strong>${report.ai_performance.escalated_to_human}</strong> leads escalated to your team</p>
        </div>

        <div class="section" style="background: #f1f5f9; padding: 15px; border-radius: 8px;">
            <p style="margin: 0;">Questions about your report? Reply to this email or log in to your dashboard.</p>
        </div>
    </div>
</body>
</html>
        `.trim();

        // Send email
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: dealer_email,
            subject,
            body: emailBody
        });

        return Response.json({
            success: true,
            report_sent: true,
            period,
            recipient: dealer_email
        });

    } catch (error) {
        console.error('Send report error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});