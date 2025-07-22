export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  form_name: string
  page: string
  status: "New" | "Contacted" | "Follow-Up" | "Demo Scheduled" | "Converted" | "Lost"
  labels: string[]
  created_at: string
  notes: Array<{
    text: string
    timestamp: string
  }>
  timeline: Array<{
    action: string
    timestamp: string
    user: string
  }>
  next_follow_up?: string
}

export interface KanbanColumn {
  id: string
  title: string
  color: string
}

export const mockLeads: Lead[] = [
  {
    id: "lead_001",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    form_name: "Website Lead Form",
    page: "Pronexus.in",
    status: "Follow-Up",
    labels: ["High Priority", "Hot"],
    created_at: "2025-07-22T08:00:00Z",
    notes: [
      {
        text: "Interested in demo, prefers afternoon meetings. Mentioned budget of $50k annually.",
        timestamp: "2025-07-22T10:00:00Z",
      },
    ],
    timeline: [
      {
        action: "Lead created from Website Lead Form",
        timestamp: "2025-07-22T08:00:00Z",
        user: "System",
      },
      {
        action: "Status changed to Follow-Up",
        timestamp: "2025-07-22T09:30:00Z",
        user: "Sarah Johnson",
      },
      {
        action: "Note added about demo interest",
        timestamp: "2025-07-22T10:00:00Z",
        user: "Sarah Johnson",
      },
    ],
    next_follow_up: "2025-07-24T14:00:00Z",
  },
  {
    id: "lead_002",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    phone: "+1987654321",
    form_name: "Contact Us Form",
    page: "Pronexus.in/contact",
    status: "New",
    labels: ["Qualified"],
    created_at: "2025-07-23T09:15:00Z",
    notes: [],
    timeline: [
      {
        action: "Lead created from Contact Us Form",
        timestamp: "2025-07-23T09:15:00Z",
        user: "System",
      },
    ],
    next_follow_up: "2025-07-25T10:00:00Z",
  },
  {
    id: "lead_003",
    name: "Michael Chen",
    email: "m.chen@techcorp.com",
    phone: "+1555123456",
    form_name: "Product Demo Request",
    page: "Pronexus.in/demo",
    status: "Demo Scheduled",
    labels: ["High Priority", "Qualified", "VIP"],
    created_at: "2025-07-21T14:30:00Z",
    notes: [
      {
        text: "Demo scheduled for Friday 2 PM. CTO of 500+ employee company.",
        timestamp: "2025-07-22T11:30:00Z",
      },
      {
        text: "Sent calendar invite and demo materials. Very interested in enterprise features.",
        timestamp: "2025-07-22T11:45:00Z",
      },
    ],
    timeline: [
      {
        action: "Lead created from Product Demo Request",
        timestamp: "2025-07-21T14:30:00Z",
        user: "System",
      },
      {
        action: "Status changed to Demo Scheduled",
        timestamp: "2025-07-22T11:00:00Z",
        user: "Mike Wilson",
      },
      {
        action: "VIP label added",
        timestamp: "2025-07-22T11:15:00Z",
        user: "Mike Wilson",
      },
    ],
    next_follow_up: "2025-07-26T14:00:00Z",
  },
  {
    id: "lead_004",
    name: "Emily Rodriguez",
    email: "emily.r@startup.io",
    phone: "+1444555666",
    form_name: "Newsletter Signup",
    page: "Pronexus.in/blog",
    status: "Contacted",
    labels: ["Cold"],
    created_at: "2025-07-20T16:45:00Z",
    notes: [
      {
        text: "Initial contact made via email. Startup founder, small team.",
        timestamp: "2025-07-21T09:00:00Z",
      },
    ],
    timeline: [
      {
        action: "Lead created from Newsletter Signup",
        timestamp: "2025-07-20T16:45:00Z",
        user: "System",
      },
      {
        action: "Status changed to Contacted",
        timestamp: "2025-07-21T09:00:00Z",
        user: "Lisa Chen",
      },
    ],
  },
  {
    id: "lead_005",
    name: "David Wilson",
    email: "david.wilson@enterprise.com",
    phone: "+1777888999",
    form_name: "Enterprise Inquiry",
    page: "Pronexus.in/enterprise",
    status: "Converted",
    labels: ["High Priority", "Qualified", "VIP"],
    created_at: "2025-07-18T11:20:00Z",
    notes: [
      {
        text: "Signed contract for annual plan worth $120k. Fortune 500 company.",
        timestamp: "2025-07-23T15:30:00Z",
      },
      {
        text: "Onboarding scheduled for next week. Assigned to premium support.",
        timestamp: "2025-07-23T15:45:00Z",
      },
    ],
    timeline: [
      {
        action: "Lead created from Enterprise Inquiry",
        timestamp: "2025-07-18T11:20:00Z",
        user: "System",
      },
      {
        action: "Status changed to Demo Scheduled",
        timestamp: "2025-07-19T10:00:00Z",
        user: "Alex Thompson",
      },
      {
        action: "Status changed to Converted",
        timestamp: "2025-07-23T15:30:00Z",
        user: "Alex Thompson",
      },
    ],
  },
]
