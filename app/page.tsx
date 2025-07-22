"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LayoutGrid,
  List,
  Search,
  Users,
  Clock,
  Settings,
  Facebook,
  Download,
  Target,
  Timer,
  BarChart3,
  Filter,
  Loader2,
} from "lucide-react"
import { KanbanView } from "@/components/kanban-view"
import { ListView } from "@/components/list-view"
import { LeadDrawer } from "@/components/lead-drawer"
import { LabelManagementModal } from "@/components/label-management-modal"
import { ColumnVisibilityModal } from "@/components/column-visibility-modal"
import { mockLeads, type Lead, type KanbanColumn } from "@/lib/mock-data"
import { useRealtimeStore } from "@/lib/realtime-store"
import { useToast } from "@/hooks/use-toast"
import { RealtimeIndicator } from "@/components/realtime-indicator"

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

interface FacebookLead extends Lead {
  source: 'facebook';
  pageId: string;
  formId: string;
}

export default function CRMDashboard() {
  const [activeView, setActiveView] = useState<"kanban" | "list">("kanban")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [labelFilter, setLabelFilter] = useState<string>("all")
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [showLabelManagement, setShowLabelManagement] = useState(false)
  const [showColumnVisibility, setShowColumnVisibility] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([])

  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([
    { id: "New", title: "New", color: "border-blue-500/20" },
    { id: "Contacted", title: "Contacted", color: "border-yellow-500/20" },
    { id: "Follow-Up", title: "Follow-Up", color: "border-orange-500/20" },
    { id: "Demo Scheduled", title: "Demo Scheduled", color: "border-purple-500/20" },
    { id: "Converted", title: "Converted", color: "border-green-500/20" },
    { id: "Lost", title: "Lost", color: "border-gray-500/20" },
  ])

  // Realtime store
  const { leads, setLeads, moveLeadRealtime, updateLead: updateLeadRealtime, simulateActivity } = useRealtimeStore()
  const { toast } = useToast()

  // Initialize leads and start simulation
  useEffect(() => {
    setLeads(mockLeads)
    simulateActivity()
    fetchFacebookPages()
  }, [setLeads, simulateActivity])

  const fetchFacebookPages = async () => {
    try {
      const response = await fetch('/api/leads/fb-pages', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
        }
      });
      const data = await response.json();
      if (data.pages) {
        setFacebookPages(data.pages);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch Facebook pages',
        variant: 'destructive',
      });
    }
  };

  const syncFacebookLeads = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/leads/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
        }
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Leads synced successfully',
        });
        // Refresh leads after sync
        const leadsResponse = await fetch('/api/leads/fb-leads', {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
          }
        });
        const leadsData = await leadsResponse.json();
        if (leadsData.leads) {
          setLeads([...leads, ...leadsData.leads]);
        }
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

  // Enhanced Analytics calculations
  const totalLeads = leads.length
  const convertedLeads = leads.filter((lead) => lead.status === "Converted").length
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
  const followUpsDue = leads.filter((lead) => {
    if (!lead.next_follow_up) return false
    const today = new Date()
    const followUpDate = new Date(lead.next_follow_up)
    return followUpDate.toDateString() === today.toDateString()
  }).length

  // Filter leads based on search and filters
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery)

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter
    const matchesLabel = labelFilter === "all" || lead.labels.some((label) => label === labelFilter)

    return matchesSearch && matchesStatus && matchesLabel
  })

  const updateLeadStatus = (leadId: string, newStatus: string) => {
    const lead = leads.find((l) => l.id === leadId)
    if (lead && lead.status !== newStatus) {
      moveLeadRealtime(leadId, lead.status, newStatus)
      toast({
        title: "Status Updated",
        description: `Lead moved to ${newStatus}`,
      })
    }
  }

  const updateLead = (updatedLead: Lead) => {
    updateLeadRealtime(updatedLead, `Updated ${updatedLead.name}`)
  }

  const bulkUpdateStatus = (leadIds: string[], newStatus: string) => {
    leadIds.forEach((leadId) => {
      const lead = leads.find((l) => l.id === leadId)
      if (lead) {
        moveLeadRealtime(leadId, lead.status, newStatus)
      }
    })

    toast({
      title: "Bulk Update Complete",
      description: `${leadIds.length} leads updated to ${newStatus}`,
    })

    setSelectedLeads([])
  }

  const addKanbanColumn = (title: string) => {
    const newColumn: KanbanColumn = {
      id: title,
      title,
      color: "border-gray-500/20",
    }
    setKanbanColumns([...kanbanColumns, newColumn])
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-white">Lead Management</h1>
                  <p className="text-sm text-slate-400">Manage and track your leads efficiently</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-8">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-400 font-medium">Live Updates</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={syncFacebookLeads}
                disabled={isSyncing}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
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
              <Button
                variant="outline"
                onClick={() => setShowLabelManagement(true)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
              >
                <Settings className="w-4 h-4 mr-2" />
                Labels
              </Button>
              <Button className="bg-white text-black hover:bg-slate-100">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Total Leads</p>
                  <p className="text-3xl font-bold text-white">{totalLeads}</p>
                  <p className="text-xs text-slate-500 mt-1">+12% from last month</p>
                </div>
                <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Facebook Pages</p>
                  <p className="text-3xl font-bold text-white">{facebookPages.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Connected pages</p>
                </div>
                <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center">
                  <Facebook className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Follow-ups Due</p>
                  <p className="text-3xl font-bold text-white">{followUpsDue}</p>
                  <p className="text-xs text-slate-500 mt-1">Due today</p>
                </div>
                <div className="w-12 h-12 bg-orange-600/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Conversion Rate</p>
                  <p className="text-3xl font-bold text-white">{conversionRate.toFixed(1)}%</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {convertedLeads} of {totalLeads} converted
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-600/10 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4 flex-1 w-full lg:w-auto">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="all">All Status</SelectItem>
                    {kanbanColumns.map((column) => (
                      <SelectItem key={column.id} value={column.id}>
                        {column.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={labelFilter} onValueChange={setLabelFilter}>
                  <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="All Labels" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="all">All Labels</SelectItem>
                    <SelectItem value="Hot">Hot</SelectItem>
                    <SelectItem value="Cold">Cold</SelectItem>
                    <SelectItem value="High Priority">High Priority</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="Demo">Demo</SelectItem>
                  </SelectContent>
                </Select>

                {activeView === "list" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowColumnVisibility(true)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Columns
                  </Button>
                )}
              </div>

              {/* Bulk Actions */}
              {selectedLeads.length > 0 && (
                <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                  <span className="text-sm text-slate-300 font-medium">{selectedLeads.length} selected</span>
                  <div className="w-px h-4 bg-slate-600" />
                  <Select onValueChange={(value) => bulkUpdateStatus(selectedLeads, value)}>
                    <SelectTrigger className="w-32 h-8 bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="Move to..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {kanbanColumns.map((column) => (
                        <SelectItem key={column.id} value={column.id}>
                          {column.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedLeads([])}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Clear
                  </Button>
                </div>
              )}

              {/* View Toggle */}
              <div className="flex items-center bg-slate-800 rounded-lg p-1">
                <Button
                  variant={activeView === "kanban" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveView("kanban")}
                  className={
                    activeView === "kanban"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "text-slate-400 hover:text-white hover:bg-slate-700"
                  }
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Kanban
                </Button>
                <Button
                  variant={activeView === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveView("list")}
                  className={
                    activeView === "list"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "text-slate-400 hover:text-white hover:bg-slate-700"
                  }
                >
                  <List className="w-4 h-4 mr-2" />
                  List
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="min-h-[600px]">
          {activeView === "kanban" ? (
            <KanbanView
              leads={filteredLeads}
              onLeadClick={setSelectedLead}
              onStatusChange={updateLeadStatus}
              columns={kanbanColumns}
              onAddColumn={addKanbanColumn}
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

      <RealtimeIndicator />

      {/* Modals and Drawers */}
      <LeadDrawer
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={updateLead}
      />

      <LabelManagementModal isOpen={showLabelManagement} onClose={() => setShowLabelManagement(false)} />

      <ColumnVisibilityModal isOpen={showColumnVisibility} onClose={() => setShowColumnVisibility(false)} />
    </div>
  )
}
