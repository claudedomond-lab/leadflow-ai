import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppointmentCard from "../components/appointments/AppointmentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Search, Loader2, CalendarDays } from "lucide-react";
import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";

export default function Appointments() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("scheduled_date", 100)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Appointment.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries(["appointments"])
  });

  const handleStatusChange = (id, status) => {
    updateMutation.mutate({ id, status });
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    const matchesSearch = !searchQuery ||
      apt.lead_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Group appointments by date
  const groupedAppointments = filteredAppointments.reduce((groups, apt) => {
    const date = parseISO(apt.scheduled_date);
    let groupKey;
    
    if (isToday(date)) {
      groupKey = "Today";
    } else if (isTomorrow(date)) {
      groupKey = "Tomorrow";
    } else if (isThisWeek(date)) {
      groupKey = format(date, "EEEE");
    } else {
      groupKey = format(date, "MMMM d, yyyy");
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(apt);
    return groups;
  }, {});

  // Stats
  const todayCount = appointments.filter(a => isToday(parseISO(a.scheduled_date))).length;
  const upcomingCount = appointments.filter(a => 
    (a.status === "scheduled" || a.status === "confirmed") && 
    parseISO(a.scheduled_date) >= new Date()
  ).length;
  const completedCount = appointments.filter(a => a.status === "completed").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Appointments</h1>
          <p className="text-slate-500 mt-1">Manage scheduled appointments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <p className="text-3xl font-semibold text-slate-900">{todayCount}</p>
            <p className="text-sm text-slate-500">Today</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <p className="text-3xl font-semibold text-slate-900">{upcomingCount}</p>
            <p className="text-sm text-slate-500">Upcoming</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <p className="text-3xl font-semibold text-slate-900">{completedCount}</p>
            <p className="text-sm text-slate-500">Completed</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search appointments..."
                className="pl-10 border-slate-200"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : Object.keys(groupedAppointments).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="font-medium text-slate-700 mb-2">No appointments found</h3>
            <p className="text-slate-500">Appointments will appear here when scheduled</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedAppointments).map(([date, apts]) => (
              <div key={date}>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  {date}
                  <span className="text-sm font-normal text-slate-500">({apts.length})</span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {apts.map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}