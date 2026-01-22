import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, CheckCircle, AlertCircle, FileUp } from "lucide-react";

export default function CSVImportModal({ open, onClose, dealerId }) {
  const [step, setStep] = useState('upload'); // upload, mapping, validation, importing
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [importResults, setImportResults] = useState(null);

  const [fieldMapping, setFieldMapping] = useState({
    name: '',
    email: '',
    phone: '',
    priority: '',
    vehicle_year: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_vin: ''
  });

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);

    try {
      // Upload file
      const { data } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      setFileUrl(data.file_url);

      // Parse CSV headers
      const text = await selectedFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      setCsvHeaders(headers);

      setStep('mapping');
    } catch (error) {
      alert('File upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDryRun = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('bulkImportLeads', {
        file_url: fileUrl,
        field_mapping: fieldMapping,
        dealer_id: dealerId,
        dry_run: true
      });
      setValidationResults(response.data.validation);
      setStep('validation');
    } catch (error) {
      alert('Validation failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActualImport = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('bulkImportLeads', {
        file_url: fileUrl,
        field_mapping: fieldMapping,
        dealer_id: dealerId,
        dry_run: false
      });
      setImportResults(response.data);
      setStep('complete');
    } catch (error) {
      alert('Import failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep('upload');
    setFile(null);
    setFileUrl('');
    setCsvHeaders([]);
    setValidationResults(null);
    setImportResults(null);
    setFieldMapping({
      name: '', email: '', phone: '', priority: '',
      vehicle_year: '', vehicle_make: '', vehicle_model: '', vehicle_vin: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) { resetModal(); onClose(); } }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk CSV Import</DialogTitle>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
              <FileUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <Label htmlFor="csv-file" className="cursor-pointer">
                <div className="text-lg font-medium text-slate-900 mb-2">
                  Click to upload CSV file
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  Or drag and drop your file here
                </p>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Select CSV File
                </Button>
              </Label>
            </div>
          </div>
        )}

        {/* Mapping Step */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Map your CSV columns to lead fields. CSV Headers: <strong>{csvHeaders.join(', ')}</strong>
            </p>

            <div className="grid grid-cols-2 gap-4">
              {Object.keys(fieldMapping).map((field) => (
                <div key={field}>
                  <Label className="capitalize">{field.replace('_', ' ')} *</Label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    value={fieldMapping[field]}
                    onChange={(e) => setFieldMapping({ ...fieldMapping, [field]: e.target.value })}
                  >
                    <option value="">-- Select Column --</option>
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep('upload')} variant="outline">Back</Button>
              <Button 
                onClick={handleDryRun}
                disabled={loading || !fieldMapping.name || !fieldMapping.email || !fieldMapping.phone}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Validate Data
              </Button>
            </div>
          </div>
        )}

        {/* Validation Step */}
        {step === 'validation' && validationResults && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900">{validationResults.total_rows}</p>
                  <p className="text-sm text-slate-500">Total Rows</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{validationResults.valid_rows}</p>
                  <p className="text-sm text-slate-500">Valid</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{validationResults.invalid_rows}</p>
                  <p className="text-sm text-slate-500">Invalid</p>
                </CardContent>
              </Card>
            </div>

            {validationResults.errors.length > 0 && (
              <div>
                <h3 className="font-semibold text-red-900 mb-2">Validation Errors (First 10):</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {validationResults.errors.slice(0, 10).map((error, idx) => (
                    <Card key={idx} className="bg-red-50">
                      <CardContent className="p-3">
                        <p className="text-sm font-medium">Row {error.row}: {error.errors.join(', ')}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {validationResults.sample_data.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Sample Valid Data:</h3>
                <div className="space-y-2">
                  {validationResults.sample_data.slice(0, 3).map((lead, idx) => (
                    <Card key={idx} className="bg-slate-50">
                      <CardContent className="p-3">
                        <p className="text-sm"><strong>Name:</strong> {lead.name}</p>
                        <p className="text-sm"><strong>Email:</strong> {lead.email}</p>
                        <p className="text-sm"><strong>Phone:</strong> {lead.phone}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setStep('mapping')} variant="outline">Back</Button>
              <Button 
                onClick={handleActualImport}
                disabled={loading || validationResults.valid_rows === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Import {validationResults.valid_rows} Leads
              </Button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && importResults && (
          <div className="space-y-4 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
            <h3 className="text-2xl font-bold text-slate-900">Import Complete!</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-green-600">{importResults.imported}</p>
                  <p className="text-sm text-slate-500">Imported</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-yellow-600">{importResults.duplicates}</p>
                  <p className="text-sm text-slate-500">Duplicates</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-red-600">{importResults.skipped}</p>
                  <p className="text-sm text-slate-500">Skipped</p>
                </CardContent>
              </Card>
            </div>

            <Button onClick={() => { resetModal(); onClose(); }} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}