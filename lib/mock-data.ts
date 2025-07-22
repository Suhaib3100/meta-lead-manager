export interface Lead {
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
  rawData?: any;
  form_id?: string;
  page_id?: string;
  campaign_id?: string;
  next_follow_up?: string;
  submitted_at?: string;
  form_data?: {
    [key: string]: string;
  };
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
}

export const mockLeads: Lead[] = [];
