"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LayoutGrid,
  List,
  Search,
  Settings,
  Facebook,
  Download,
  Loader2,
  BarChart3,
} from "lucide-react"
import { KanbanView } from "@/components/kanban-view"
import { ListView } from "@/components/list-view"
import { LeadDrawer } from "@/components/lead-drawer"
import { useToast } from "@/hooks/use-toast"

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  labels: string[];
  notes: Array<string | { text: string; timestamp: string }>;
  created_at: string;
  form_name?: string;
  page?: string;
  timeline?: any[];
  form_id?: string;
  submitted_at?: string;
  form_data?: {
    [key: string]: string;
  };
  next_follow_up?: string;
}

export default function CRMDashboard() {
  const [activeView, setActiveView] = useState<"kanban" | "list">("kanban")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [labelFilter, setLabelFilter] = useState<string>("all")
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    initializeData()
  }, [])

  const initializeData = async () => {
    setIsLoading(true)
    await Promise.all([
      fetchFacebookPages(),
      fetchLeads()
    ])
    setIsLoading(false)
  }

  const fetchFacebookPages = async () => {
    try {
      const response = await fetch('/api/leads/fb-pages', {
        headers: {
          'Authorization': `Bearer test-token`
        }
      });
      const data = await response.json();
      if (data.pages) {
        setFacebookPages(data.pages);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  };

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads', {
        headers: {
          'Authorization': `Bearer test-token`
        }
      });
      const data = await response.json();
      if (data.leads) {
        setLeads(data.leads);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const syncFacebookLeads = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/leads/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer test-token`
        }
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Leads synced successfully',
        });
        // Refresh leads after sync
        await fetchLeads();
      }
    } catch (error) {
      console.error('Error syncing leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync leads',
        variant: 'destructive',
      });
    }
    setIsSyncing(false);
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer test-token`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setLeads(prev => prev.map(lead => 
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        ));
        
        toast({
          title: 'Status Updated',
          description: `Lead moved to ${newStatus}`,
        });
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lead status',
        variant: 'destructive',
      });
    }
  };

  const updateLead = async (updatedLead: Lead) => {
    try {
      const response = await fetch(`/api/leads/${updatedLead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer test-token`
        },
        body: JSON.stringify({
          status: updatedLead.status,
          notes: updatedLead.notes,
          tags: updatedLead.labels
        })
      });

      if (response.ok) {
        // Update local state
        setLeads(prev => prev.map(lead => 
          lead.id === updatedLead.id ? updatedLead : lead
        ));
        
        toast({
          title: 'Lead Updated',
          description: `${updatedLead.name} has been updated`,
        });
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lead',
        variant: 'destructive',
      });
    }
  };

  const bulkUpdateStatus = async (leadIds: string[], newStatus: string) => {
    try {
      const promises = leadIds.map(leadId => 
        fetch(`/api/leads/${leadId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer test-token`
          },
          body: JSON.stringify({ status: newStatus })
        })
      );

      await Promise.all(promises);

      // Update local state
      setLeads(prev => prev.map(lead => 
        leadIds.includes(lead.id) ? { ...lead, status: newStatus } : lead
      ));

      toast({
        title: 'Bulk Update Complete',
        description: `${leadIds.length} leads updated to ${newStatus}`,
      });

      setSelectedLeads([]);
    } catch (error) {
      console.error('Error bulk updating leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to bulk update leads',
        variant: 'destructive',
      });
    }
  };

  // Analytics calculations
  const totalLeads = leads.length;
  const convertedLeads = leads.filter(lead => lead.status === "Converted").length;
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
  const followUpsDue = leads.filter(lead => {
    // Add your follow-up due logic here
    return false;
  }).length;

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.phone && lead.phone.includes(searchQuery));

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesLabel = labelFilter === "all" || lead.labels.some(label => label === labelFilter);

    return matchesSearch && matchesStatus && matchesLabel;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] text-white flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading leads...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Lead Management</h1>
            <p className="text-sm text-gray-400">Manage and track your leads efficiently</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-400">Live Updates</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={syncFacebookLeads}
            disabled={isSyncing}
            className="bg-transparent"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Facebook className="w-4 h-4 mr-2" />
                Sync Facebook
              </>
            )}
          </Button>
          <Button variant="outline" className="bg-transparent">
            <Settings className="w-4 h-4 mr-2" />
            Labels
          </Button>
          <Button variant="default" className="bg-white text-black hover:bg-gray-100">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-4 gap-6 p-6">
        <div className="bg-[#1C1D21] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Leads</p>
              <p className="text-3xl font-bold mt-1">{totalLeads}</p>
              <p className="text-xs text-gray-500 mt-1">+12% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1C1D21] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Facebook Pages</p>
              <p className="text-3xl font-bold mt-1">{facebookPages.length}</p>
              <p className="text-xs text-gray-500 mt-1">Connected pages</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1C1D21] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Follow-ups Due</p>
              <p className="text-3xl font-bold mt-1">{followUpsDue}</p>
              <p className="text-xs text-gray-500 mt-1">Due today</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1C1D21] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Conversion Rate</p>
              <p className="text-3xl font-bold mt-1">{conversionRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {convertedLeads} of {totalLeads} converted
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6">
        <div className="bg-[#1C1D21] rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#0A0B0F] border-gray-800"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0A0B0F] border border-gray-800 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-Up">Follow-Up</option>
                <option value="Demo Scheduled">Demo Scheduled</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>

              <select
                value={labelFilter}
                onChange={(e) => setLabelFilter(e.target.value)}
                className="bg-[#0A0B0F] border border-gray-800 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Labels</option>
                <option value="Hot">Hot</option>
                <option value="Cold">Cold</option>
                <option value="High Priority">High Priority</option>
                <option value="Qualified">Qualified</option>
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedLeads.length > 0 && (
              <div className="flex items-center gap-3 bg-[#1C1D21] px-4 py-2 rounded-lg border border-gray-800 mr-4">
                <span className="text-sm text-gray-300 font-medium">{selectedLeads.length} selected</span>
                <div className="w-px h-4 bg-gray-600" />
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      bulkUpdateStatus(selectedLeads, e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-[#0A0B0F] border border-gray-800 rounded-md px-2 py-1 text-sm"
                >
                  <option value="">Move to...</option>
                  <option value="new">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Follow-Up">Follow-Up</option>
                  <option value="Demo Scheduled">Demo Scheduled</option>
                  <option value="Converted">Converted</option>
                  <option value="Lost">Lost</option>
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedLeads([])}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Clear
                </Button>
              </div>
            )}

            <div className="flex items-center bg-[#0A0B0F] rounded-lg p-1">
              <Button
                variant={activeView === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveView("kanban")}
                className={activeView === "kanban" ? "bg-blue-600" : ""}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Kanban
              </Button>
              <Button
                variant={activeView === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveView("list")}
                className={activeView === "list" ? "bg-blue-600" : ""}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>
          </div>
        </div>

        {/* Leads View */}
        <div className="min-h-[600px]">
          {activeView === "kanban" ? (
            <KanbanView
              leads={filteredLeads}
              onLeadClick={setSelectedLead}
              onStatusChange={updateLeadStatus}
              columns={[
                { id: "new", title: "New", color: "border-blue-500/20" },
                { id: "Contacted", title: "Contacted", color: "border-yellow-500/20" },
                { id: "Follow-Up", title: "Follow-Up", color: "border-orange-500/20" },
                { id: "Demo Scheduled", title: "Demo Scheduled", color: "border-purple-500/20" },
                { id: "Converted", title: "Converted", color: "border-green-500/20" },
                { id: "Lost", title: "Lost", color: "border-gray-500/20" },
              ]}
              onAddColumn={() => {}}
            />
          ) : (
            <ListView
              leads={filteredLeads}
              onLeadClick={setSelectedLead}
              onStatusChange={updateLeadStatus}
              selectedLeads={selectedLeads}
              onSelectLeads={setSelectedLeads}
              onUpdateLead={updateLead}
            />
          )}
        </div>
      </div>

      {/* Lead Details Drawer */}
      <LeadDrawer
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={updateLead}
      />
    </div>
  )
}
