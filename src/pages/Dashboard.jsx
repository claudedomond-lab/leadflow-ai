import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import MetricCard from "../components/dashboard/MetricCard";
import LeadCard from "../components/leads/LeadCard";
import ConversationPanel from "../components/leads/ConversationPanel";
import ScheduleModal from "../components/appointments/ScheduleModal";
import NewLeadModal from "../components/leads/NewLeadModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Plus, 
  Search,
  Filter,
  Loader2
} from "lucide-react";

export default function Dashboard() {
  const [selectedLead, setSelectedLead] = useState(null);
  const [showConversation, setShowConversation] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showNewLead, setShowNewLead] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [verticalFilter, setVerticalFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: leads = [], isLoading: leadsLoading, refetch: refetchLeads } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 100)
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("-scheduled_date", 50)
  });

  // Calculate metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === "new").length;
  const scheduledAppointments = appointments.filter(a => a.status === "scheduled" || a.status === "confirmed").length;
  const convertedLeads = leads.filter(l => l.status === "converted").length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;
  const avgIntentScore = leads.length > 0 
    ? (leads.reduce((sum, l) => sum + (l.intent_score || 0), 0) / leads.length).toFixed(0)
    : 0;

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesVertical = verticalFilter === "all" || lead.vertical === verticalFilter;
    const matchesSearch = !searchQuery || 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery);
    return matchesStatus && matchesVertical && matchesSearch;
  });

  const handleViewConversation = (lead) => {
    setSelectedLead(lead);
    setShowConversation(true);
  };

  const handleSchedule = (lead) => {
    setSelectedLead(lead);
    setShowSchedule(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Lead Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage leads and track conversions</p>
          </div>
          <Button 
            onClick={() => setShowNewLead(true)}
            className="bg-slate-900 hover:bg-slate-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total Leads"
            value={totalLeads}
            subtitle={`${newLeads} new`}
            icon={Users}
            trend="+12%"
            trendUp
          />
          <MetricCard
            title="Appointments"
            value={scheduledAppointments}
            subtitle="Scheduled"
            icon={Calendar}
          />
          <MetricCard
            title="Conversion Rate"
            value={`${conversionRate}%`}
            subtitle={`${convertedLeads} converted`}
            icon={TrendingUp}
            trend="+5%"
            trendUp
          />
          <MetricCard
            title="Avg Intent Score"
            value={avgIntentScore}
            subtitle="Out of 100"
            icon={Clock}
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads..."
                className="pl-10 border-slate-200"
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualifying">Qualifying</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="appointment_scheduled">Scheduled</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={verticalFilter} onValueChange={setVerticalFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Vertical" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verticals</SelectItem>
                  <SelectItem value="dealer">Dealer</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="local_services">Local Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Leads Grid */}
        {leadsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="font-medium text-slate-700 mb-2">No leads found</h3>
            <p className="text-slate-500 mb-4">Add your first lead to get started</p>
            <Button onClick={() => setShowNewLead(true)} className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onViewConversation={handleViewConversation}
                onSchedule={handleSchedule}
              />
            ))}
          </div>
        )}
      </div>

      {/* Conversation Panel */}
      {showConversation && selectedLead && (
        <ConversationPanel
          lead={selectedLead}
          onClose={() => {
            setShowConversation(false);
            setSelectedLead(null);
          }}
        />
      )}

      {/* Schedule Modal */}
      <ScheduleModal
        lead={selectedLead}
        open={showSchedule}
        onClose={() => {
          setShowSchedule(false);
          setSelectedLead(null);
        }}
        onScheduled={() => refetchLeads()}
      />

      {/* New Lead Modal */}
      <NewLeadModal
        open={showNewLead}
        onClose={() => setShowNewLead(false)}
        onCreated={() => refetchLeads()}
      />
    </div>
  );
}