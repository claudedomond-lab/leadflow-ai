import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusColors = {
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-slate-50 text-slate-700 border-slate-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  no_show: "bg-amber-50 text-amber-700 border-amber-200"
};

const typeLabels = {
  test_drive: "Test Drive",
  showing: "Property Showing",
  consultation: "Consultation",
  service_appointment: "Service Appt.",
  follow_up_call: "Follow-up Call"
};

export default function AppointmentCard({ appointment, onStatusChange }) {
  const appointmentDate = new Date(appointment.scheduled_date);
  const isToday = new Date().toDateString() === appointmentDate.toDateString();
  const isPast = appointmentDate < new Date();

  return (
    <Card className={cn(
      "p-4 bg-white border-0 shadow-sm hover:shadow-md transition-all",
      isToday && "ring-2 ring-blue-100"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("font-medium", statusColors[appointment.status])}>
            {appointment.status}
          </Badge>
          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
            {typeLabels[appointment.type] || appointment.type}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onStatusChange(appointment.id, "confirmed")}>
              Mark Confirmed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(appointment.id, "completed")}>
              Mark Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(appointment.id, "cancelled")}>
              Cancel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(appointment.id, "no_show")}>
              Mark No-Show
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-900">
          <User className="w-4 h-4 text-slate-400" />
          <span className="font-medium">{appointment.lead_name}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-sm">
            {isToday ? "Today" : format(appointmentDate, "EEE, MMM d")}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-600">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-sm">
            {format(appointmentDate, "h:mm a")} · {appointment.duration_minutes} min
          </span>
        </div>

        {appointment.location && (
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="text-sm truncate">{appointment.location}</span>
          </div>
        )}
      </div>

      {appointment.notes && (
        <p className="mt-3 text-sm text-slate-500 line-clamp-2 pt-3 border-t border-slate-100">
          {appointment.notes}
        </p>
      )}
    </Card>
  );
}