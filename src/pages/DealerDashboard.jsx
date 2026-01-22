import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  DollarSign,
  Users,
  Zap,
  Download,
  Mail,
  Loader2
} from "lucide-react";
import { format, subDays } from "date-fns";

export default function DealerDashboard() {
  const [period, setPeriod] = useState('weekly');
  const [sending, setSending] = useState(false);

  const { data: report, isLoading } = useQuery({
    queryKey: ['dealer-report', period],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateDealerReport', { period });
      return response.data;
    }
  });

  const handleEmailReport = async () => {
    setSending(true);
    try {
      await base44.functions.invoke('sendDealerReport', {
        dealer_email: 'dealer@example.com', // Replace with actual dealer email
        period
      });
      alert('Report sent successfully!');
    } catch (error) {
      alert('Failed to send report: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">AI Performance Dashboard</h1>
            <p className="text-slate-500 mt-1">{report.period}</p>
          </div>
          <div className="flex gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium"
            >
              <option value="weekly">Last 7 Days</option>
              <option value="monthly">Last 30 Days</option>
            </select>
            <Button
              onClick={handleEmailReport}
              disabled={sending}
              variant="outline"
              className="gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Email Report
            </Button>
          </div>
        </div>

        {/* Executive Summary */}
        <Card className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white mb-8 border-0">
          <h2 className="text-xl font-semibold mb-3">📊 Summary</h2>
          <p className="text-blue-50 leading-relaxed">{report.executive_summary}</p>
        </Card>

        {/* ROI Highlight */}
        <Card className="p-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white mb-8 border-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-emerald-100 text-sm mb-1">Estimated Revenue</p>
              <p className="text-3xl font-bold">{report.value_delivered.estimated_revenue}</p>
            </div>
            <div>
              <p className="text-emerald-100 text-sm mb-1">Time Saved</p>
              <p className="text-3xl font-bold">{report.value_delivered.time_saved_hours}h</p>
            </div>
            <div>
              <p className="text-emerald-100 text-sm mb-1">ROI</p>
              <p className="text-3xl font-bold">{report.value_delivered.estimated_roi}</p>
            </div>
            <div>
              <p className="text-emerald-100 text-sm mb-1">Recovered Leads</p>
              <p className="text-3xl font-bold">{report.value_delivered.recovered_leads}</p>
            </div>
          </div>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-8 h-8 text-blue-500" />
              <span className="text-xs font-medium text-slate-500">TOTAL</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{report.metrics.leads_handled}</p>
            <p className="text-sm text-slate-500 mt-1">Leads Handled</p>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="w-8 h-8 text-purple-500" />
              <span className="text-xs font-medium text-slate-500">BOOKED</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{report.metrics.appointments_booked}</p>
            <p className="text-sm text-slate-500 mt-1">Appointments</p>
            <p className="text-xs text-emerald-600 mt-1">↑ {report.metrics.appointment_rate} rate</p>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-8 h-8 text-emerald-500" />
              <span className="text-xs font-medium text-slate-500">CLOSED</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{report.metrics.deals_closed}</p>
            <p className="text-sm text-slate-500 mt-1">Deals Closed</p>
            <p className="text-xs text-emerald-600 mt-1">{report.metrics.conversion_rate} conversion</p>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Clock className="w-8 h-8 text-orange-500" />
              <span className="text-xs font-medium text-slate-500">RESPONSE</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">&lt;30s</p>
            <p className="text-sm text-slate-500 mt-1">Avg Response Time</p>
            <p className="text-xs text-blue-600 mt-1">Instant engagement</p>
          </Card>
        </div>

        {/* AI Performance & Lead Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-white border-0 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900">AI Automation</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Automation Rate</span>
                <span className="text-2xl font-bold text-blue-600">{report.ai_performance.automation_rate}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: report.ai_performance.automation_rate }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <p className="text-sm text-slate-500">AI Handled</p>
                  <p className="text-2xl font-semibold text-slate-900">{report.ai_performance.leads_handled_by_ai}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Human Escalations</p>
                  <p className="text-2xl font-semibold text-slate-900">{report.ai_performance.escalated_to_human}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Messages Sent</p>
                  <p className="text-2xl font-semibold text-slate-900">{report.ai_performance.messages_sent}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Response Rate</p>
                  <p className="text-2xl font-semibold text-slate-900">{report.ai_performance.response_rate}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Lead Source Performance</h2>
            <div className="space-y-3">
              {report.lead_sources.map((source, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900 capitalize">{source.source}</span>
                    <span className="text-sm font-semibold text-emerald-600">{source.conversion_rate}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Leads</p>
                      <p className="font-semibold text-slate-900">{source.total_leads}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Appointments</p>
                      <p className="font-semibold text-slate-900">{source.appointments}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Converted</p>
                      <p className="font-semibold text-slate-900">{source.converted}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Additional Info */}
        <Card className="p-6 bg-slate-900 text-white border-0">
          <h2 className="text-lg font-semibold mb-3">💡 What This Means</h2>
          <ul className="space-y-2 text-slate-200">
            <li>✅ Your AI is responding to leads in under 30 seconds - faster than any human team</li>
            <li>✅ {report.ai_performance.automation_rate} of leads are handled without sales team involvement</li>
            <li>✅ Recovered {report.value_delivered.recovered_leads} leads that would have been lost</li>
            <li>✅ Saved your team {report.value_delivered.time_saved_hours} hours of manual follow-ups</li>
            <li>✅ Generated an estimated {report.value_delivered.estimated_revenue} in revenue</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}