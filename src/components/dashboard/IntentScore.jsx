import { cn } from "@/lib/utils";

export default function IntentScore({ score }) {
  const getColor = () => {
    if (score >= 70) return "text-emerald-600 bg-emerald-50";
    if (score >= 40) return "text-amber-600 bg-amber-50";
    return "text-slate-500 bg-slate-50";
  };

  const getLabel = () => {
    if (score >= 70) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn("px-2 py-1 rounded-md text-xs font-semibold", getColor())}>
        {score}
      </div>
      <span className="text-xs text-slate-500">{getLabel()}</span>
    </div>
  );
}