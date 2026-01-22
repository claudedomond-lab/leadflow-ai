import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings as SettingsIcon, 
  Building2, 
  MessageSquare, 
  Clock,
  Save,
  Loader2,
  Plus,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dealer");

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["vertical-configs"],
    queryFn: () => base44.entities.VerticalConfig.list()
  });

  const [formData, setFormData] = useState({
    dealer: {
      business_name: "",
      greeting_message: "Hi! Thanks for reaching out. I'm here to help you find your perfect vehicle. What type of car are you interested in?",
      qualification_questions: ["What vehicle are you interested in?", "Do you have a trade-in?", "What's your budget range?", "When would you like to schedule a test drive?"],
      appointment_types: ["test_drive", "consultation"],
      business_hours: { start: "09:00", end: "18:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
      tone: "friendly",
      is_active: true
    },
    real_estate: {
      business_name: "",
      greeting_message: "Hello! Thank you for your interest. I'd love to help you find your ideal property. Are you looking to buy or rent?",
      qualification_questions: ["What's your preferred location?", "What's your price range?", "What's your timeline?", "Are you pre-approved for a mortgage?"],
      appointment_types: ["showing", "consultation"],
      business_hours: { start: "09:00", end: "18:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
      tone: "professional",
      is_active: true
    },
    local_services: {
      business_name: "",
      greeting_message: "Hi there! Thanks for contacting us. How can we help you today?",
      qualification_questions: ["What service do you need?", "Is this urgent?", "What's your location?"],
      appointment_types: ["service_appointment", "consultation"],
      business_hours: { start: "08:00", end: "17:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
      tone: "friendly",
      is_active: true
    }
  });

  useEffect(() => {
    if (configs.length > 0) {
      const newFormData = { ...formData };
      configs.forEach(config => {
        if (config.vertical && newFormData[config.vertical]) {
          newFormData[config.vertical] = {
            ...newFormData[config.vertical],
            ...config,
            qualification_questions: config.qualification_questions || newFormData[config.vertical].qualification_questions,
            appointment_types: config.appointment_types || newFormData[config.vertical].appointment_types,
            business_hours: config.business_hours || newFormData[config.vertical].business_hours
          };
        }
      });
      setFormData(newFormData);
    }
  }, [configs]);

  const saveMutation = useMutation({
    mutationFn: async (vertical) => {
      const data = formData[vertical];
      const existing = configs.find(c => c.vertical === vertical);
      
      if (existing) {
        return base44.entities.VerticalConfig.update(existing.id, { ...data, vertical });
      } else {
        return base44.entities.VerticalConfig.create({ ...data, vertical });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["vertical-configs"]);
      toast.success("Settings saved successfully");
    }
  });

  const handleSave = () => {
    saveMutation.mutate(activeTab);
  };

  const updateFormField = (vertical, field, value) => {
    setFormData(prev => ({
      ...prev,
      [vertical]: {
        ...prev[vertical],
        [field]: value
      }
    }));
  };

  const addQuestion = (vertical) => {
    setFormData(prev => ({
      ...prev,
      [vertical]: {
        ...prev[vertical],
        qualification_questions: [...prev[vertical].qualification_questions, ""]
      }
    }));
  };

  const updateQuestion = (vertical, index, value) => {
    setFormData(prev => ({
      ...prev,
      [vertical]: {
        ...prev[vertical],
        qualification_questions: prev[vertical].qualification_questions.map((q, i) => 
          i === index ? value : q
        )
      }
    }));
  };

  const removeQuestion = (vertical, index) => {
    setFormData(prev => ({
      ...prev,
      [vertical]: {
        ...prev[vertical],
        qualification_questions: prev[vertical].qualification_questions.filter((_, i) => i !== index)
      }
    }));
  };

  const currentData = formData[activeTab];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Configure AI behavior for each vertical</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dealer">Dealer</TabsTrigger>
            <TabsTrigger value="real_estate">Real Estate</TabsTrigger>
            <TabsTrigger value="local_services">Local Services</TabsTrigger>
          </TabsList>

          {["dealer", "real_estate", "local_services"].map((vertical) => (
            <TabsContent key={vertical} value={vertical}>
              <div className="space-y-6">
                {/* Basic Settings */}
                <Card className="p-6 bg-white border-0 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Building2 className="w-5 h-5 text-slate-400" />
                    <h2 className="font-semibold text-slate-900">Basic Settings</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Active</Label>
                        <p className="text-sm text-slate-500">Enable AI for this vertical</p>
                      </div>
                      <Switch
                        checked={formData[vertical].is_active}
                        onCheckedChange={(checked) => updateFormField(vertical, "is_active", checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Business Name</Label>
                      <Input
                        value={formData[vertical].business_name}
                        onChange={(e) => updateFormField(vertical, "business_name", e.target.value)}
                        placeholder="Enter business name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tone</Label>
                      <Select 
                        value={formData[vertical].tone} 
                        onValueChange={(v) => updateFormField(vertical, "tone", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formal">Formal</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>

                {/* Greeting Message */}
                <Card className="p-6 bg-white border-0 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <MessageSquare className="w-5 h-5 text-slate-400" />
                    <h2 className="font-semibold text-slate-900">Greeting Message</h2>
                  </div>

                  <Textarea
                    value={formData[vertical].greeting_message}
                    onChange={(e) => updateFormField(vertical, "greeting_message", e.target.value)}
                    placeholder="Enter greeting message..."
                    rows={4}
                  />
                </Card>

                {/* Qualification Questions */}
                <Card className="p-6 bg-white border-0 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <SettingsIcon className="w-5 h-5 text-slate-400" />
                      <h2 className="font-semibold text-slate-900">Qualification Questions</h2>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => addQuestion(vertical)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formData[vertical].qualification_questions.map((question, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={question}
                          onChange={(e) => updateQuestion(vertical, idx, e.target.value)}
                          placeholder={`Question ${idx + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(vertical, idx)}
                        >
                          <Trash2 className="w-4 h-4 text-slate-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Business Hours */}
                <Card className="p-6 bg-white border-0 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <h2 className="font-semibold text-slate-900">Business Hours</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={formData[vertical].business_hours.start}
                        onChange={(e) => updateFormField(vertical, "business_hours", {
                          ...formData[vertical].business_hours,
                          start: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={formData[vertical].business_hours.end}
                        onChange={(e) => updateFormField(vertical, "business_hours", {
                          ...formData[vertical].business_hours,
                          end: e.target.value
                        })}
                      />
                    </div>
                  </div>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="bg-slate-900 hover:bg-slate-800"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Settings
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}