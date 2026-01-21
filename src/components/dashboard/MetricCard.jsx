import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, trendUp, className }) {
  return (
    <Card className={cn("p-6 bg-white border-0 shadow-sm hover:shadow-md transition-shadow", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trendUp ? "text-emerald-600" : "text-rose-600"
            )}>
              <span>{trendUp ? "↑" : "↓"}</span>
              <span>{trend}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-slate-50">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
        )}
      </div>
    </Card>
  );
}