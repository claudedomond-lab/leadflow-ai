import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const appointmentTypes = {
  dealer: ["test_drive", "consultation", "follow_up_call"],
  real_estate: ["showing", "consultation", "follow_up_call"],
  local_services: ["service_appointment", "consultation", "follow_up_call"]
};

const typeLabels = {
  test_drive: "Test Drive",
  showing: "Property Showing",
  consultation: "Consultation",
  service_appointment: "Service Appointment",
  follow_up_call: "Follow-up Call"
};

export default function ScheduleModal({ lead, open, onClose, onScheduled }) {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState("10:00");
  const [type, setType] = useState("");
  const [duration, setDuration] = useState("60");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const availableTypes = appointmentTypes[lead?.vertical] || appointmentTypes.local_services;

  const handleSchedule = async () => {
    if (!type || !date) return;

    setLoading(true);
    
    const [hours, minutes] = time.split(":");
    const scheduledDate = new Date(date);
    scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const appointment = await base44.entities.Appointment.create({
      lead_id: lead.id,
      lead_name: lead.name,
      type,
      scheduled_date: scheduledDate.toISOString(),
      duration_minutes: parseInt(duration),
      location,
      notes,
      vertical: lead.vertical,
      status: "scheduled"
    });

    await base44.entities.Lead.update(lead.id, {
      status: "appointment_scheduled",
      last_contact_date: new Date().toISOString()
    });

    await base44.entities.Conversation.create({
      lead_id: lead.id,
      role: "ai",
      message: `Great news! I've scheduled your ${typeLabels[type]} for ${format(scheduledDate, "EEEE, MMMM d")} at ${format(scheduledDate, "h:mm a")}. ${location ? `Location: ${location}.` : ""} Looking forward to seeing you!`,
      action_type: "book_appointment",
      ai_reasoning: "Appointment booked successfully"
    });

    setLoading(false);
    onScheduled(appointment);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Appointment for {lead?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Appointment Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {typeLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location (optional)</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location..."
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or notes..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSchedule} 
            disabled={loading || !type}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Schedule Appointment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}