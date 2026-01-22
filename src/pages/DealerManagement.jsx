import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Building2, 
  Eye, 
  Power, 
  BarChart3,
  AlertCircle,
  CheckCircle,
  Search,
  Upload
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import CSVImportModal from "../components/leads/CSVImportModal";

export default function DealerManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [impersonating, setImpersonating] = useState(null);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState(null);
  const queryClient = useQueryClient();

  const { data: dealers, isLoading } = useQuery({
    queryKey: ['all-dealers'],
    queryFn: async () => {
      return await base44.entities.DealerConfig.list('-created_date', 500);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ dealerId, newStatus }) => {
      const dealer = dealers.find(d => d.id === dealerId);
      return await base44.entities.DealerConfig.update(dealerId, {
        setup_status: newStatus
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-dealers'] });
    }
  });

  const filteredDealers = dealers?.filter(d => 
    !searchQuery || 
    d.dealer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.dealer_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.location?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const stats = {
    total: dealers?.length || 0,
    active: dealers?.filter(d => d.setup_status === 'active').length || 0,
    testing: dealers?.filter(d => d.setup_status === 'testing').length || 0,
    inactive: dealers?.filter(d => d.setup_status === 'incomplete').length || 0
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Global Dealer Management</h1>
          <p className="text-slate-600">Multi-tenant dealer administration and monitoring</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Dealers</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Active</p>
                  <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Testing</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.testing}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Inactive</p>
                  <p className="text-3xl font-bold text-slate-400">{stats.inactive}</p>
                </div>
                <Power className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search dealers by name, ID, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Impersonation Banner */}
        {impersonating && (
          <Card className="bg-orange-50 border-orange-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-semibold text-orange-900">Impersonating: {impersonating.dealer_name}</p>
                    <p className="text-sm text-orange-700">Viewing dashboard as this dealer</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setImpersonating(null)}
                  variant="outline"
                  className="border-orange-300"
                >
                  Exit Impersonation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dealers Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>All Dealers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-slate-500 py-8">Loading dealers...</p>
            ) : filteredDealers.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No dealers found</p>
            ) : (
              <div className="space-y-4">
                {filteredDealers.map((dealer) => (
                  <Card key={dealer.id} className="bg-slate-50 border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">{dealer.dealer_name}</h3>
                            <Badge variant={
                              dealer.setup_status === 'active' ? 'default' :
                              dealer.setup_status === 'testing' ? 'secondary' :
                              'outline'
                            }>
                              {dealer.setup_status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                            <div>
                              <span className="font-medium">ID:</span> {dealer.dealer_id}
                            </div>
                            <div>
                              <span className="font-medium">Location:</span> {dealer.location || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Phone:</span> {dealer.phone || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Leads:</span> {dealer.lead_sources?.length || 0} sources
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* CSV Import */}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedDealerId(dealer.dealer_id);
                              setCsvModalOpen(true);
                            }}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Import CSV
                          </Button>

                          {/* Status Toggle */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Active</span>
                            <Switch 
                              checked={dealer.setup_status === 'active'}
                              onCheckedChange={(checked) => {
                                toggleStatusMutation.mutate({
                                  dealerId: dealer.id,
                                  newStatus: checked ? 'active' : 'incomplete'
                                });
                              }}
                            />
                          </div>

                          {/* Impersonate */}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setImpersonating(dealer)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Impersonate
                          </Button>

                          {/* View Stats */}
                          <Link to={createPageUrl('DealerDashboard')}>
                            <Button variant="outline" size="sm">
                              <BarChart3 className="w-4 h-4 mr-2" />
                              View Stats
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}