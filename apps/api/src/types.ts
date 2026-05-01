export interface JobApplication {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  role_type: string;
  portal: string;
  job_url: string | null;
  location: string | null;
  applied_at: string;
  status: string;
  raw_data: Record<string, unknown> | null;
  raw_text: string | null;
  confidence: number | null;
  needs_review: boolean;
  gmail_message_id: string | null;
  created_at: string;
}
