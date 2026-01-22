import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Webhook as WebhookIcon, 
  Copy, 
  Check, 
  Play,
  Code,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

export default function Webhook() {
  const [testData, setTestData] = useState({
    name: "John Smith",
    phone: "(555) 987-6543",
    email: "john.smith@email.com",
    lead_source: "Facebook",
    vehicle_interest: "Honda CR-V 2024",
    time_submitted: new Date().toISOString().slice(0, 16)
  });
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Get webhook URL (replace with your actual app URL)
  const webhookUrl = `${window.location.origin}/api/receiveIncomingLead`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await base44.functions.invoke('receiveIncomingLead', testData);
      setResult({
        success: true,
        data: response.data
      });
      toast.success("Test lead submitted successfully!");
    } catch (error) {
      setResult({
        success: false,
        error: error.message
      });
      toast.error("Test failed: " + error.message);
    } finally {
      setTesting(false);
    }
  };

  const curlExample = `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Smith",
    "phone": "(555) 123-4567",
    "email": "john@email.com",
    "lead_source": "Facebook",
    "vehicle_interest": "Honda CR-V",
    "time_submitted": "2025-01-20 14:30"
  }'`;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
              <WebhookIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Lead Intake Webhook</h1>
          </div>
          <p className="text-slate-500">
            Automatically receive and process incoming leads from any source
          </p>
        </div>

        {/* Webhook URL */}
        <Card className="p-6 bg-white border-0 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Webhook Endpoint</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy URL"}
            </Button>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm break-all">
            {webhookUrl}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            POST requests to this endpoint with lead data
          </p>
        </Card>

        {/* Test Lead Submission */}
        <Card className="p-6 bg-white border-0 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Play className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Test Lead Submission</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={testData.name}
                  onChange={(e) => setTestData({ ...testData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={testData.phone}
                  onChange={(e) => setTestData({ ...testData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={testData.email}
                onChange={(e) => setTestData({ ...testData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lead Source</Label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  value={testData.lead_source}
                  onChange={(e) => setTestData({ ...testData, lead_source: e.target.value })}
                >
                  <option value="Facebook">Facebook</option>
                  <option value="Google">Google</option>
                  <option value="Autotrader">Autotrader</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Time Submitted</Label>
                <Input
                  type="datetime-local"
                  value={testData.time_submitted}
                  onChange={(e) => setTestData({ ...testData, time_submitted: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vehicle Interest</Label>
              <Input
                value={testData.vehicle_interest}
                onChange={(e) => setTestData({ ...testData, vehicle_interest: e.target.value })}
                placeholder="e.g., Honda CR-V 2024"
              />
            </div>

            <Button 
              onClick={handleTest}
              disabled={testing}
              className="w-full bg-slate-900 hover:bg-slate-800"
            >
              {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Submit Test Lead
            </Button>

            {result && (
              <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`font-medium mb-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                  {result.success ? '✅ Success' : '❌ Error'}
                </p>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(result.success ? result.data : { error: result.error }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Card>

        {/* JSON Schema */}
        <Card className="p-6 bg-white border-0 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Code className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Expected JSON Format</h2>
          </div>
          <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-sm overflow-x-auto">
{`{
  "name": "<Full Name>",          // Required
  "phone": "<Phone Number>",      // Optional
  "email": "<Email>",             // Optional
  "lead_source": "<Source>",      // Facebook|Google|Autotrader
  "vehicle_interest": "<Vehicle>", // Optional
  "time_submitted": "<DateTime>"  // YYYY-MM-DD HH:MM
}`}
          </pre>
        </Card>

        {/* cURL Example */}
        <Card className="p-6 bg-white border-0 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">cURL Example</h2>
          <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto">
            {curlExample}
          </pre>
        </Card>

        {/* Flow Diagram */}
        <Card className="p-6 bg-white border-0 shadow-sm mt-6">
          <h2 className="font-semibold text-slate-900 mb-4">Automated Flow</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-slate-900">Lead Received</p>
                <p className="text-sm text-slate-500">Webhook creates lead in database</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-slate-900">AI Evaluation</p>
                <p className="text-sm text-slate-500">Scores intent, budget match, timeline, priority</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-slate-900">Greeting Sent</p>
                <p className="text-sm text-slate-500">AI sends personalized greeting via SMS</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium text-slate-900">Appointment or Follow-up</p>
                <p className="text-sm text-slate-500">High-intent leads get appointment slots; others enter follow-up sequence</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}