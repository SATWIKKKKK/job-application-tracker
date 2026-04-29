export type Plan = 'free' | 'pro';
export type PlanInterval = 'monthly' | 'quarterly' | 'yearly';
export type ApplicationStatus = 'Applied' | 'Viewed' | 'Shortlisted' | 'Rejected';

export interface User {
  id: string;
  email: string;
  name: string | null;
  google_sheet_id: string | null;
  google_refresh_token?: string | null;
  plan: Plan;
  plan_expires_at: string | null;
  created_at: string;
}

export interface Portal {
  id: string;
  user_id: string;
  portal_name: string;
  is_enabled: boolean;
  created_at: string;
}

export interface JobApplication {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  portal: string;
  job_url: string | null;
  location: string | null;
  applied_at: string;
  status: ApplicationStatus;
  raw_data: Record<string, unknown> | null;
  created_at: string;
}

export interface LogApplicationBody {
  job_title: string;
  company: string;
  portal: string;
  job_url?: string;
  location?: string;
  applied_at?: string;
}

export interface PaginatedApplications {
  data: JobApplication[];
  page: number;
  page_size: number;
  total: number;
}
