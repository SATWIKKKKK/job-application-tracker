export type Plan = 'free' | 'pro';
export type PlanType = 'monthly' | 'quarterly' | 'yearly';
export type ApplicationStatus =
  | 'Applied'
  | 'Saved'
  | 'Shortlisted'
  | 'Rejected'
  | 'Accepted'
  | 'In Progress'
  | 'Interview'
  | 'Offer'
  | 'Unknown';
export type RoleType = 'Full Time' | 'Part Time' | 'Internship' | 'Contract' | 'Stipend Based';

export interface User {
  id: string;
  email: string;
  name: string | null;
  google_sheet_id: string | null;
  gmail_connected: boolean;
  initial_scan_completed: boolean;
  initial_scan_found_count: number;
  plan: Plan;
  plan_type: PlanType | null;
  plan_started_at: string | null;
  plan_expires_at: string | null;
  days_remaining?: number | null;
  created_at: string;
}

export interface JobApplication {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  role_type: RoleType;
  portal: string;
  job_url: string | null;
  location: string | null;
  applied_at: string;
  status: ApplicationStatus;
  raw_data: Record<string, unknown> | null;
  raw_text: string | null;
  confidence: number | null;
  needs_review: boolean;
  gmail_message_id: string | null;
  created_at: string;
}
