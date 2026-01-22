import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Filter, 
  Save,
  Loader2,
  Calendar,
  TrendingUp
} from "lucide-react";

export default function LeadSearch() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

  const [filters, setFilters] = useState({
    keyword: '',
    status: [],
    source: [],
    priority: [],
    date_from: '',
    date_to: '',
    intent_score_min: '',
    intent_score_max: '',
    fuzzy: true
  });

  const [saveSearch, setSaveSearch] = useState({
    enabled: false,
    name: ''
  });

  const statusOptions = ['new', 'contacted', 'qualifying', 'qualified', 'appointment_scheduled', 'converted', 'lost', 'escalated'];
  const sourceOptions = ['website', 'facebook', 'google', 'referral', 'phone', 'adf_email', 'csv_import', 'api'];
  const priorityOptions = ['low', 'medium', 'high'];

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('searchLeads', {
        ...filters,
        save_search: saveSearch.enabled,
        search_name: saveSearch.name
      });
      setResults(response.data);
    } catch (error) {
      alert('Search failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayFilter = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Advanced Lead Search</h1>
          <p className="text-slate-600">Find leads with fuzzy matching, filters, and saved searches</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <Card className="lg:col-span-1 border-0 shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Keyword */}
                <div>
                  <Label>Keyword Search</Label>
                  <Input 
                    placeholder="Name, email, VIN..."
                    value={filters.keyword}
                    onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox 
                      checked={filters.fuzzy}
                      onCheckedChange={(checked) => setFilters({ ...filters, fuzzy: checked })}
                    />
                    <span className="text-xs text-slate-600">Fuzzy matching (typos)</span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <Label className="mb-2 block">Status</Label>
                  <div className="space-y-2">
                    {statusOptions.map(status => (
                      <div key={status} className="flex items-center gap-2">
                        <Checkbox 
                          checked={filters.status.includes(status)}
                          onCheckedChange={() => toggleArrayFilter('status', status)}
                        />
                        <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Source */}
                <div>
                  <Label className="mb-2 block">Source</Label>
                  <div className="space-y-2">
                    {sourceOptions.map(source => (
                      <div key={source} className="flex items-center gap-2">
                        <Checkbox 
                          checked={filters.source.includes(source)}
                          onCheckedChange={() => toggleArrayFilter('source', source)}
                        />
                        <span className="text-sm capitalize">{source.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <Label className="mb-2 block">Priority</Label>
                  <div className="space-y-2">
                    {priorityOptions.map(priority => (
                      <div key={priority} className="flex items-center gap-2">
                        <Checkbox 
                          checked={filters.priority.includes(priority)}
                          onCheckedChange={() => toggleArrayFilter('priority', priority)}
                        />
                        <span className="text-sm capitalize">{priority}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <Label>Date Range</Label>
                  <div className="space-y-2">
                    <Input 
                      type="date"
                      value={filters.date_from}
                      onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                    />
                    <Input 
                      type="date"
                      value={filters.date_to}
                      onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                    />
                  </div>
                </div>

                {/* Intent Score */}
                <div>
                  <Label>Intent Score Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      type="number"
                      placeholder="Min"
                      value={filters.intent_score_min}
                      onChange={(e) => setFilters({ ...filters, intent_score_min: e.target.value })}
                    />
                    <Input 
                      type="number"
                      placeholder="Max"
                      value={filters.intent_score_max}
                      onChange={(e) => setFilters({ ...filters, intent_score_max: e.target.value })}
                    />
                  </div>
                </div>

                {/* Save Search */}
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox 
                      checked={saveSearch.enabled}
                      onCheckedChange={(checked) => setSaveSearch({ ...saveSearch, enabled: checked })}
                    />
                    <Label>Save this search</Label>
                  </div>
                  {saveSearch.enabled && (
                    <Input 
                      placeholder="Search name..."
                      value={saveSearch.name}
                      onChange={(e) => setSaveSearch({ ...saveSearch, name: e.target.value })}
                    />
                  )}
                </div>

                <Button 
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                  Search
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {!results ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Configure filters and click Search to find leads</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Search Results ({results.total_results})</span>
                    {results.saved && (
                      <Badge variant="secondary">
                        <Save className="w-3 h-3 mr-1" />
                        Search Saved
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results.results.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No leads found matching your criteria</p>
                  ) : (
                    <div className="space-y-4">
                      {results.results.map((lead) => (
                        <Card key={lead.id} className="bg-slate-50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-slate-900">{lead.name}</h3>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-slate-600">
                                  <div>
                                    <span className="font-medium">Email:</span> {lead.email || 'N/A'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Phone:</span> {lead.phone || 'N/A'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Source:</span> {lead.source}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">Intent:</span> 
                                    <TrendingUp className="w-3 h-3" />
                                    {lead.intent_score || 0}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                <Badge variant={
                                  lead.status === 'converted' ? 'default' :
                                  lead.status === 'lost' ? 'destructive' :
                                  'secondary'
                                }>
                                  {lead.status}
                                </Badge>
                                <Badge variant="outline">{lead.priority}</Badge>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(lead.created_date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}