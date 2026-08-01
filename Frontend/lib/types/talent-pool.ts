export type TalentPoolStatus = 'IN_POOL' | 'INVITED';

export interface TalentPoolCandidate {
  user_id: string;
  full_name: string;
  university?: string;
  year?: string;
  primary_skills?: string[];
  avatar_url?: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
}

export interface TalentPoolEntry {
  pool_id: string;
  candidate: TalentPoolCandidate;
  highest_score: number;
  challenges_taken: string[];
  status: TalentPoolStatus;
  added_at: string;
}

export interface AddToTalentPoolRequest {
  user_id: string;
}

export interface RecentActivity {
  id: string;
  candidate_name: string;
  action: string;
  timestamp: string;
  type: 'status_change' | 'added_to_pool' | 'invited' | 'challenge_completed';
}
