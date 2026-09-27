export type UserRole = 'citizen' | 'officer' | 'admin';

export interface Profile {
  id: string; // Auth UUID matching auth.users
  full_name: string;
  phone: string;
  role: UserRole;
  district_id?: string | null;
  language_preference: 'en' | 'hi' | 'as';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface District {
  id: string;
  name: string;
  state_name: string;
  code: string;
  center_lat: number;
  center_lng: number;
  created_at: string;
}

export interface Incident {
  id: string;
  district_id: string;
  village_id?: string | null;
  road_id?: string | null;
  reported_by?: string | null;
  incident_type: string;
  description: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'cleared' | 'monitoring';
  source_type: 'citizen' | 'officer' | 'sensor' | 'model';
  latitude: number;
  longitude: number;
  media_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface CitizenReport {
  id: string;
  reporter_id: string;
  incident_id?: string | null;
  district_id: string;
  title: string;
  description: string;
  media_urls: string[];
  latitude: number;
  longitude: number;
  report_status: 'pending_verification' | 'verified' | 'rejected' | 'duplicate';
  offline_created_at?: string | null;
  synced_at?: string | null;
  client_temp_id?: string | null;
  dedupe_hash?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  district_id: string;
  title: string;
  message: string;
  severity: 'info' | 'advisory' | 'warning' | 'emergency';
  language_code: string;
  is_active: boolean;
  issued_by?: string | null;
  starts_at: string;
  expires_at?: string | null;
  created_at: string;
}

export interface RoadStatus {
  id: string;
  district_id: string;
  road_name: string;
  road_code?: string;
  status: 'open' | 'at_risk' | 'blocked';
  risk_level: 'low' | 'moderate' | 'high' | 'severe';
  updated_at: string;
}

export interface RiskAssessment {
  id: string;
  district_id: string;
  village_id?: string | null;
  road_id?: string | null;
  risk_score: number; // 0 - 100
  risk_level: 'low' | 'moderate' | 'high' | 'severe';
  reasoning: string;
  model_version: string;
  assessed_at: string;
}

export interface SyncLog {
  id: string;
  user_id: string;
  entity_type: string;
  action_type: string;
  sync_status: 'pending' | 'completed' | 'failed';
  retry_count: number;
  last_error?: string | null;
  created_at: string;
}
