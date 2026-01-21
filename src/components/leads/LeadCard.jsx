import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeadStatusBadge, PriorityBadge, VerticalBadge } from "../dashboard/LeadStatusBadge";
import IntentScore from "../dashboard/IntentScore";
import { User, Phone, Mail, Clock, MessageSquare, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function LeadCard({ lead, onViewConversation, onSchedule }) {
  return (
    <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{lead.name}</h3>
            <p className="text-sm text-slate-500">{lead.source}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <VerticalBadge vertical={lead.vertical} />
          <LeadStatusBadge status={lead.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        {lead.email && (
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="w-4 h-4 text-slate-400" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.last_contact_date && (
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{format(new Date(lead.last_contact_date), "MMM d, h:mm a")}</span>
          </div>
        )}
        {lead.intent_score !== undefined && (
          <div className="flex items-center gap-2">
            <IntentScore score={lead.intent_score} />
          </div>
        )}
      </div>

      {lead.notes && (
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{lead.notes}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={lead.priority} />
          {lead.follow_up_day > 0 && (
            <span className="text-xs text-slate-500">Follow-up Day {lead.follow_up_day}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onViewConversation(lead)}
            className="text-slate-600 hover:text-slate-900"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Chat
          </Button>
          <Button 
            size="sm"
            onClick={() => onSchedule(lead)}
            className="bg-slate-900 hover:bg-slate-800"
          >
            <Calendar className="w-4 h-4 mr-1" />
            Schedule
          </Button>
        </div>
      </div>
    </Card>
  );
}