import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import MetricCard from "../components/dashboard/MetricCard";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock,
  Target,
  MessageSquare,
  Loader2
} from "lucide-react";
import { format, subDays, startOfDay, isAfter } from "date-fns";

const COLORS = ["#0f172a", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("7");

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["leads-analytics"],
    queryFn: () => base44.entities.Lead.list("-created_date", 500)
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["appointments-analytics"],
    queryFn: () => base44.entities.Appointment.list("-scheduled_date", 500)
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["conversations-analytics"],
    queryFn: () => base44.entities.Conversation.list("-created_date", 1000)
  });

  const isLoading = leadsLoading || appointmentsLoading || conversationsLoading;

  // Filter by time range
  const startDate = startOfDay(subDays(new Date(), parseInt(timeRange)));
  const filteredLeads = leads.filter(l => isAfter(new Date(l.created_date), startDate));
  const filteredAppointments = appointments.filter(a => isAfter(new Date(a.created_date), startDate));
  const filteredConversations = conversations.filter(c => isAfter(new Date(c.created_date), startDate));

  // Calculate metrics
  const totalLeads = filteredLeads.length;
  const appointmentsBooked = filteredAppointments.length;
  const conversionRate = totalLeads > 0 
    ? ((filteredLeads.filter(l => l.status === "converted").length / totalLeads) * 100).toFixed(1)
    : 0;
  const avgResponseTime = "< 1 min"; // AI responds instantly
  const aiMessages = filteredConversations.filter(c => c.role === "ai").length;

  // Status distribution
  const statusData = Object.entries(
    filteredLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ 
    name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), 
    value 
  }));

  // Vertical distribution
  const verticalData = Object.entries(
    filteredLeads.reduce((acc, lead) => {
      const v = lead.vertical === "real_estate" ? "Real Estate" 
        : lead.vertical === "local_services" ? "Services" 
        : "Dealer";
      acc[v] = (acc[v] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Daily leads trend
  const dailyData = [];
  for (let i = parseInt(timeRange) - 1; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const dayStr = format(day, "yyyy-MM-dd");
    const dayLeads = filteredLeads.filter(l => 
      format(new Date(l.created_date), "yyyy-MM-dd") === dayStr
    ).length;
    const dayAppointments = filteredAppointments.filter(a => 
      format(new Date(a.created_date), "yyyy-MM-dd") === dayStr
    ).length;
    dailyData.push({
      date: format(day, "MMM d"),
      leads: dayLeads,
      appointments: dayAppointments
    });
  }

  // Source distribution
  const sourceData = Object.entries(
    filteredLeads.reduce((acc, lead) => {
      const s = lead.source || "other";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ 
    name: name.charAt(0).toUpperCase() + name.slice(1), 
    value 
  })).sort((a, b) => b.value - a.value);

  // Intent score distribution
  const intentBuckets = { "High (70-100)": 0, "Medium (40-69)": 0, "Low (0-39)": 0 };
  filteredLeads.forEach(lead => {
    const score = lead.intent_score || 0;
    if (score >= 70) intentBuckets["High (70-100)"]++;
    else if (score >= 40) intentBuckets["Medium (40-69)"]++;
    else intentBuckets["Low (0-39)"]++;
  });
  const intentData = Object.entries(intentBuckets).map(([name, value]) => ({ name, value }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
            <p className="text-slate-500 mt-1">Track performance and insights</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <MetricCard
            title="Leads Handled"
            value={totalLeads}
            icon={Users}
          />
          <MetricCard
            title="Appointments"
            value={appointmentsBooked}
            icon={Calendar}
          />
          <MetricCard
            title="Conversion Rate"
            value={`${conversionRate}%`}
            icon={Target}
          />
          <MetricCard
            title="AI Messages"
            value={aiMessages}
            icon={MessageSquare}
          />
          <MetricCard
            title="Avg Response"
            value={avgResponseTime}
            icon={Clock}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Daily Trend */}
          <Card className="p-6 bg-white border-0 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Daily Activity</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#0f172a" 
                  strokeWidth={2}
                  dot={{ fill: "#0f172a" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Status Distribution */}
          <Card className="p-6 bg-white border-0 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Lead Status</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Sources */}
          <Card className="p-6 bg-white border-0 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Lead Sources</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#94a3b8" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f172a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Vertical Distribution */}
          <Card className="p-6 bg-white border-0 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">By Vertical</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={verticalData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {verticalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Intent Score Distribution */}
          <Card className="p-6 bg-white border-0 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Intent Score</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={intentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {intentData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? "#10b981" : index === 1 ? "#f59e0b" : "#94a3b8"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}