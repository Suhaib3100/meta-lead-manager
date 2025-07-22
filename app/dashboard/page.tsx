'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LeadDetailsModal } from '@/components/lead-details-modal';
import { Loader2 } from 'lucide-react';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  formId: string;
  pageId: string;
  status: string;
  notes: string[];
  tags: string[];
  receivedAt: string;
}

export default function DashboardPage() {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      fetchLeads(selectedPage);
    }
  }, [selectedPage]);

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/leads/fb-pages', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
        }
      });
      const data = await response.json();
      if (data.pages) {
        setPages(data.pages);
        if (data.pages.length > 0) {
          setSelectedPage(data.pages[0].id);
        }
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

  const syncLeads = async () => {
    setIsLoading(true);
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
        if (selectedPage) {
          fetchLeads(selectedPage);
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
    setIsLoading(false);
  };

  const fetchLeads = async (pageId: string) => {
    setIsLoadingLeads(true);
    try {
      const response = await fetch(`/api/leads/fb-leads?page_id=${pageId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.leads) {
        setLeads(data.leads);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leads',
        variant: 'destructive',
      });
      setLeads([]);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  const handleLeadUpdate = async (leadId: string, updateData: any) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update lead');
      }

      // Refresh leads after update
      fetchLeads(selectedPage);
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Lead Management</h1>
        <Button 
          onClick={syncLeads} 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            'Sync Leads'
          )}
        </Button>
      </div>

      <Tabs defaultValue="leads" className="w-full">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="pages">Facebook Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <select
                  value={selectedPage}
                  onChange={(e) => setSelectedPage(e.target.value)}
                  className="p-2 border rounded"
                  disabled={isLoadingLeads}
                >
                  {pages.map(page => (
                    <option key={page.id} value={page.id}>
                      {page.name}
                    </option>
                  ))}
                </select>
              </div>

              {isLoadingLeads ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : leads.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map(lead => (
                      <TableRow key={lead.id}>
                        <TableCell>{lead.name}</TableCell>
                        <TableCell>{lead.email}</TableCell>
                        <TableCell>{lead.phone}</TableCell>
                        <TableCell>{lead.status}</TableCell>
                        <TableCell>{lead.tags?.join(', ')}</TableCell>
                        <TableCell>
                          {new Date(lead.receivedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsModalOpen(true);
                            }}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No leads found for this page
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pages">
          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page Name</TableHead>
                  <TableHead>Page ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map(page => (
                  <TableRow key={page.id}>
                    <TableCell>{page.name}</TableCell>
                    <TableCell>{page.id}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedPage(page.id)}
                        disabled={isLoadingLeads}
                      >
                        {isLoadingLeads && selectedPage === page.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'View Leads'
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <LeadDetailsModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLead(null);
        }}
        onUpdate={handleLeadUpdate}
      />
    </div>
  );
} 