import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Loader2,
  Copy,
  Play,
  Plus
} from "lucide-react";

export default function MasterAdmin() {
  const [loading, setLoading] = useState(false);
  const [dailyReport, setDailyReport] = useState(null);
  const [showScaleForm, setShowScaleForm] = useState(false);
  const [scaleResult, setScaleResult] = useState(null);

  const [scaleForm, setScaleForm] = useState({
    source_dealer_id: '',
    new_dealer_name: '',
    new_location: '',
    new_phone: '',
    new_email: '',
    test_phone: '',
    new_escalation_contacts: [{ name: '', email: '', phone: '', role: 'Sales Manager' }]
  });

  const { data: dealers } = useQuery({
    queryKey: ['active-dealers'],
    queryFn: async () => {
      const response = await base44.entities.DealerConfig.filter({ setup_status: 'active' });
      return response;
    }
  });

  const runDailyOps = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('masterAdminDailyOps', {});
      setDailyReport(response.data);
    } catch (error) {
      alert('Error running daily ops: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScaleDealer = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('scaleDealerCopy', scaleForm);
      setScaleResult(response.data);
      setShowScaleForm(false);
    } catch (error) {
      alert('Error scaling dealer: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🎛️ Master Admin Control Center</h1>
          <p className="text-slate-400">Monitor and scale FlowOps AI across all dealers</p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Daily Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm mb-4">
                Run daily monitoring for all active dealers: check leads, execute follow-ups, handle escalations
              </p>
              <Button 
                onClick={runDailyOps}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                Run Daily Ops
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Copy className="w-5 h-5 text-green-400" />
                Scale New Dealer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm mb-4">
                Add a new dealer by copying an existing configuration and customizing it
              </p>
              <Button 
                onClick={() => setShowScaleForm(!showScaleForm)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Dealer
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Scale Form */}
        {showScaleForm && (
          <Card className="bg-slate-800 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Scale New Dealer Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Source Dealer ID (to copy from)</Label>
                <select
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                  value={scaleForm.source_dealer_id}
                  onChange={(e) => setScaleForm({ ...scaleForm, source_dealer_id: e.target.value })}
                >
                  <option value="">Select a dealer to copy...</option>
                  {dealers?.map(d => (
                    <option key={d.dealer_id} value={d.dealer_id}>
                      {d.dealer_name} ({d.dealer_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">New Dealer Name *</Label>
                  <Input 
                    value={scaleForm.new_dealer_name}
                    onChange={(e) => setScaleForm({ ...scaleForm, new_dealer_name: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="XYZ Auto Group"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Location *</Label>
                  <Input 
                    value={scaleForm.new_location}
                    onChange={(e) => setScaleForm({ ...scaleForm, new_location: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="456 Oak St, City, ST"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Phone *</Label>
                  <Input 
                    value={scaleForm.new_phone}
                    onChange={(e) => setScaleForm({ ...scaleForm, new_phone: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="(555) 987-6543"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Email *</Label>
                  <Input 
                    value={scaleForm.new_email}
                    onChange={(e) => setScaleForm({ ...scaleForm, new_email: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="contact@xyzauto.com"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Test Phone (optional)</Label>
                <Input 
                  value={scaleForm.test_phone}
                  onChange={(e) => setScaleForm({ ...scaleForm, test_phone: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleScaleDealer}
                  disabled={loading || !scaleForm.source_dealer_id || !scaleForm.new_dealer_name}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create & Test Dealer
                </Button>
                <Button 
                  onClick={() => setShowScaleForm(false)}
                  variant="outline"
                  className="border-slate-600 text-slate-300"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scale Result */}
        {scaleResult && (
          <Card className="bg-gradient-to-r from-green-900 to-green-800 border-green-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">✅ New Dealer Added</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-green-100">
                <p><strong>Dealer ID:</strong> {scaleResult.new_dealer_id}</p>
                <p><strong>Name:</strong> {scaleResult.dealer_name}</p>
                <p><strong>Status:</strong> {scaleResult.test_status}</p>
                <p><strong>Notes:</strong> {scaleResult.internal_notes}</p>
              </div>
              <pre className="mt-4 p-3 bg-slate-900 rounded-lg text-xs overflow-auto">
                {JSON.stringify(scaleResult, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Daily Report */}
        {dailyReport && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-900 to-blue-800 border-blue-700">
              <CardHeader>
                <CardTitle className="text-white">📊 Daily Operations Report - {dailyReport.date}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-100">{dailyReport.overall_internal_notes}</p>
              </CardContent>
            </Card>

            {/* Active Dealers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dailyReport.active_dealers.map((dealer, idx) => (
                <Card key={idx} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">{dealer.dealer_name}</CardTitle>
                    <p className="text-xs text-slate-400">{dealer.dealer_id}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Leads</span>
                        <span className="text-white font-semibold">{dealer.total_leads}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Responses</span>
                        <span className="text-green-400 font-semibold">{dealer.responses_sent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Appointments</span>
                        <span className="text-blue-400 font-semibold">{dealer.appointments_booked}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Escalations</span>
                        <span className="text-orange-400 font-semibold">{dealer.escalations}</span>
                      </div>
                      
                      <div className="pt-3 border-t border-slate-700">
                        <p className="text-xs text-slate-300">
                          {dealer.internal_notes.includes('⚠️') || dealer.internal_notes.includes('🔥') ? (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-yellow-400" />
                              {dealer.internal_notes}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-400" />
                              {dealer.internal_notes}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* JSON Output */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Raw JSON Output</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-slate-900 rounded-lg text-xs text-green-400 overflow-auto max-h-96">
                  {JSON.stringify(dailyReport, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}