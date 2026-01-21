import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  new: { label: "New", className: "bg-blue-50 text-blue-700 border-blue-200" },
  contacted: { label: "Contacted", className: "bg-slate-50 text-slate-700 border-slate-200" },
  qualifying: { label: "Qualifying", className: "bg-amber-50 text-amber-700 border-amber-200" },
  qualified: { label: "Qualified", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  appointment_scheduled: { label: "Appointment", className: "bg-purple-50 text-purple-700 border-purple-200" },
  converted: { label: "Converted", className: "bg-green-50 text-green-700 border-green-200" },
  lost: { label: "Lost", className: "bg-rose-50 text-rose-700 border-rose-200" },
  escalated: { label: "Escalated", className: "bg-orange-50 text-orange-700 border-orange-200" }
};

const priorityConfig = {
  low: { label: "Low", className: "bg-slate-50 text-slate-600 border-slate-200" },
  medium: { label: "Medium", className: "bg-amber-50 text-amber-600 border-amber-200" },
  high: { label: "High", className: "bg-rose-50 text-rose-600 border-rose-200" }
};

export function LeadStatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.new;
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}

export function PriorityBadge({ priority }) {
  const config = priorityConfig[priority] || priorityConfig.medium;
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}

export function VerticalBadge({ vertical }) {
  const verticalLabels = {
    dealer: "Dealer",
    real_estate: "Real Estate",
    local_services: "Services"
  };
  return (
    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-medium">
      {verticalLabels[vertical] || vertical}
    </Badge>
  );
}