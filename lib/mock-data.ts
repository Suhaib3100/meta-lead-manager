export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  labels: string[];
  notes: Array<string | { 
    id?: string;
    text?: string; 
    content?: string;
    timestamp?: string; 
    createdAt?: string;
    user?: string;
    userName?: string;
  }>;
  created_at: string;
  form_name?: string;
  page?: string;
  timeline?: Array<{
    action: string;
    timestamp: string;
    user: string;
  }>;
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

export const mockLeads: Lead[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    source: "facebook",
    status: "new",
    labels: ["Hot", "VIP"],
    notes: [
      "Initial contact made",
      { text: "Follow-up scheduled for next week", timestamp: "2024-01-15T10:00:00Z", user: "Admin" }
    ],
    created_at: "2024-01-10T09:00:00Z",
    form_name: "Lead Generation Form",
    page: "Homepage",
    timeline: [
      { action: "Lead created", timestamp: "2024-01-10T09:00:00Z", user: "System" },
      { action: "Note added", timestamp: "2024-01-10T10:00:00Z", user: "Admin" }
    ],
    form_data: {
      "what_service_are_you_interested_in?": "web-development"
    }
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+0987654321",
    source: "facebook",
    status: "Contacted",
    labels: ["Qualified"],
    notes: [
      "Interested in digital marketing services",
      { text: "Demo scheduled for Friday", timestamp: "2024-01-16T14:00:00Z", user: "Sales Team" }
    ],
    created_at: "2024-01-12T11:00:00Z",
    form_name: "Lead Generation Form",
    page: "Services",
    timeline: [
      { action: "Lead created", timestamp: "2024-01-12T11:00:00Z", user: "System" },
      { action: "Status changed to Contacted", timestamp: "2024-01-12T12:00:00Z", user: "Sales Team" }
    ],
    form_data: {
      "what_service_are_you_interested_in?": "digital-marketing"
    }
  }
];
