export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  labels: string[];
  notes: string[];
  created_at: string;
  form_name?: string;
  page?: string;
  timeline?: any[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
}

export const mockLeads: Lead[] = [];
