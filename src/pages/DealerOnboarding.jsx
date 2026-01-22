import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle2, 
  Circle, 
  Loader2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  Zap,
  TestTube
} from "lucide-react";

export default function DealerOnboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  
  const [formData, setFormData] = useState({
    dealer_name: '',
    location: '',
    phone: '',
    email: '',
    business_hours: {
      monday: '9:00 AM - 7:00 PM',
      tuesday: '9:00 AM - 7:00 PM',
      wednesday: '9:00 AM - 7:00 PM',
      thursday: '9:00 AM - 7:00 PM',
      friday: '9:00 AM - 7:00 PM',
      saturday: '9:00 AM - 6:00 PM',
      sunday: 'Closed'
    },
    escalation_contacts: [{ name: '', email: '', phone: '', role: 'Sales Manager' }],
    lead_sources: [{ source_name: '', source_type: 'webhook', webhook_url: '' }],
    inventory_data: { source: 'manual', vehicle_count: 0 },
    internal_notes: '',
    test_phone: ''
  });

  const steps = [
    { num: 1, title: 'Dealer Details', icon: Building2 },
    { num: 2, title: 'Escalation Contacts', icon: Users },
    { num: 3, title: 'Lead Sources', icon: Zap },
    { num: 4, title: 'Calendar Setup', icon: Calendar },
    { num: 5, title: 'Test & Validate', icon: TestTube }
  ];

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedForm = (parent, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: prev[parent].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      escalation_contacts: [...prev.escalation_contacts, { name: '', email: '', phone: '', role: '' }]
    }));
  };

  const addLeadSource = () => {
    setFormData(prev => ({
      ...prev,
      lead_sources: [...prev.lead_sources, { source_name: '', source_type: 'webhook', webhook_url: '' }]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('onboardDealer', formData);
      setFormData(prev => ({ ...prev, dealer_id: response.data.dealer_id }));
      setStep(5);
    } catch (error) {
      alert('Error saving configuration: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('testDealerSetup', {
        dealer_id: formData.dealer_id,
        test_phone: formData.test_phone
      });
      setTestResults(response.data);
    } catch (error) {
      alert('Error running tests: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dealer Onboarding</h1>
          <p className="text-slate-600">Configure your AI-powered lead conversion system</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step > s.num ? 'bg-green-500 text-white' :
                  step === s.num ? 'bg-blue-600 text-white' :
                  'bg-slate-200 text-slate-400'
                }`}>
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                <p className="text-xs mt-2 text-slate-600 text-center">{s.title}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-1 flex-1 mx-2 ${step > s.num ? 'bg-green-500' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const StepIcon = steps[step - 1].icon;
                return StepIcon ? <StepIcon className="w-5 h-5" /> : null;
              })()}
              Step {step}: {steps[step - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            
            {/* Step 1: Dealer Details */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Dealer Name *</Label>
                  <Input 
                    value={formData.dealer_name}
                    onChange={(e) => updateForm('dealer_name', e.target.value)}
                    placeholder="ABC Motors"
                  />
                </div>
                <div>
                  <Label>Location *</Label>
                  <Input 
                    value={formData.location}
                    onChange={(e) => updateForm('location', e.target.value)}
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone *</Label>
                    <Input 
                      value={formData.phone}
                      onChange={(e) => updateForm('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input 
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateForm('email', e.target.value)}
                      placeholder="contact@dealer.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Escalation Contacts */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">
                  Add contacts who should receive hot lead notifications
                </p>
                {formData.escalation_contacts.map((contact, idx) => (
                  <Card key={idx} className="p-4 bg-slate-50">
                    <div className="grid grid-cols-2 gap-3">
                      <Input 
                        placeholder="Name"
                        value={contact.name}
                        onChange={(e) => updateNestedForm('escalation_contacts', idx, 'name', e.target.value)}
                      />
                      <Input 
                        placeholder="Role"
                        value={contact.role}
                        onChange={(e) => updateNestedForm('escalation_contacts', idx, 'role', e.target.value)}
                      />
                      <Input 
                        placeholder="Email"
                        value={contact.email}
                        onChange={(e) => updateNestedForm('escalation_contacts', idx, 'email', e.target.value)}
                      />
                      <Input 
                        placeholder="Phone"
                        value={contact.phone}
                        onChange={(e) => updateNestedForm('escalation_contacts', idx, 'phone', e.target.value)}
                      />
                    </div>
                  </Card>
                ))}
                <Button onClick={addContact} variant="outline" className="w-full">
                  + Add Contact
                </Button>
              </div>
            )}

            {/* Step 3: Lead Sources */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">
                  Configure where your leads come from (CRM, forms, etc.)
                </p>
                {formData.lead_sources.map((source, idx) => (
                  <Card key={idx} className="p-4 bg-slate-50">
                    <div className="space-y-3">
                      <Input 
                        placeholder="Source Name (e.g., Salesforce, Facebook Ads)"
                        value={source.source_name}
                        onChange={(e) => updateNestedForm('lead_sources', idx, 'source_name', e.target.value)}
                      />
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        value={source.source_type}
                        onChange={(e) => updateNestedForm('lead_sources', idx, 'source_type', e.target.value)}
                      >
                        <option value="webhook">Webhook</option>
                        <option value="api">API</option>
                        <option value="form">Web Form</option>
                        <option value="crm">CRM Integration</option>
                      </select>
                      <Input 
                        placeholder="Webhook URL (will be provided after setup)"
                        value={source.webhook_url}
                        onChange={(e) => updateNestedForm('lead_sources', idx, 'webhook_url', e.target.value)}
                      />
                    </div>
                  </Card>
                ))}
                <Button onClick={addLeadSource} variant="outline" className="w-full">
                  + Add Lead Source
                </Button>
              </div>
            )}

            {/* Step 4: Calendar Setup */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <Label>Business Hours</Label>
                  <p className="text-xs text-slate-500 mb-3">When can customers book appointments?</p>
                  {Object.entries(formData.business_hours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-3 mb-2">
                      <span className="w-24 text-sm capitalize">{day}</span>
                      <Input 
                        value={hours}
                        onChange={(e) => updateForm('business_hours', {
                          ...formData.business_hours,
                          [day]: e.target.value
                        })}
                        placeholder="9:00 AM - 5:00 PM"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <Label>Internal Notes (Optional)</Label>
                  <Textarea 
                    value={formData.internal_notes}
                    onChange={(e) => updateForm('internal_notes', e.target.value)}
                    placeholder="Any special instructions or notes about this dealer..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Test & Validate */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">✅ Configuration Saved</h3>
                  <p className="text-sm text-blue-700">
                    Dealer ID: <code className="bg-blue-100 px-2 py-1 rounded">{formData.dealer_id}</code>
                  </p>
                </div>

                <div>
                  <Label>Test Phone Number (Optional)</Label>
                  <Input 
                    value={formData.test_phone}
                    onChange={(e) => updateForm('test_phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    We'll send a test SMS to validate the system
                  </p>
                </div>

                <Button 
                  onClick={handleTest} 
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Run Validation Tests
                </Button>

                {testResults && (
                  <Card className="mt-6 border-2 border-green-500">
                    <CardHeader className="bg-green-50">
                      <CardTitle className="text-green-900">Test Results</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>SMS Test</span>
                          <span className={testResults.test_results.sms_test === 'success' ? 'text-green-600' : 'text-red-600'}>
                            {testResults.test_results.sms_test}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Calendar Test</span>
                          <span className={testResults.test_results.calendar_test === 'success' ? 'text-green-600' : 'text-red-600'}>
                            {testResults.test_results.calendar_test}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Webhook Test</span>
                          <span className="text-slate-600">{testResults.test_results.webhook_test}</span>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-semibold mb-2">Output JSON:</h4>
                        <pre className="text-xs bg-white p-3 rounded border overflow-auto">
                          {JSON.stringify(testResults.output, null, 2)}
                        </pre>
                      </div>

                      {testResults.all_tests_passed && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-900 font-semibold">
                            🎉 All tests passed! Dealer is ready to go live.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              {step > 1 && step < 5 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Previous
                </Button>
              )}
              {step < 4 && (
                <Button 
                  onClick={() => setStep(step + 1)}
                  className="ml-auto"
                  disabled={
                    (step === 1 && (!formData.dealer_name || !formData.phone || !formData.email))
                  }
                >
                  Next
                </Button>
              )}
              {step === 4 && (
                <Button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="ml-auto bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save & Continue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}