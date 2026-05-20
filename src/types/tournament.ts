// ============================================================
// Types matching the Supabase PostgreSQL schema exactly
// ============================================================

export type Stage =
  | 'ROUND_QUALIFIERS'
  | 'MAIN_QUALIFIERS'
  | 'SEMI_FINALS'
  | 'FINAL';

export type MatchStatus = 'SCHEDULED' | 'COMPLETED';
export type GroupLabel = 'A' | 'B' | 'C';

// ---- Row types matching database tables ----

export interface Team {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
}

export interface Group {
  id: GroupLabel;
  name: string;
}

export interface GroupTeam {
  team_id: string;
  group_id: GroupLabel;
}

export interface Match {
  id: string;
  stage: Stage;
  group_id: GroupLabel | null;
  team_a_id: string | null;
  team_b_id: string | null;
  team_a_score: number | null;
  team_b_score: number | null;
  mom: string | null;
  red_card_team_id: string | null;
  status: MatchStatus;
  notes: string | null;
  winner_id: string | null;
  penalty_shootout_winner_id: string | null;
  match_order: number;
  created_at: string;
  updated_at: string;
}

// ---- View types matching computed views ----

export interface GroupStanding {
  group_id: GroupLabel;
  team_id: string;
  team_name: string;
  logo_url: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  red_cards: number;
  points: number;
  group_rank: number;
}

export interface OverallStanding {
  team_id: string;
  team_name: string;
  logo_url: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  red_cards: number;
  points: number;
}

export interface TournamentState {
  rq_total: number;
  rq_completed: number;
  rq_complete: boolean;
  mq_total: number;
  mq_completed: number;
  mq_complete: boolean;
  sf_total: number;
  sf_completed: number;
  sf_complete: boolean;
  final_total: number;
  final_completed: number;
  final_complete: boolean;
}

export interface QualificationStatus {
  team_id: string;
  team_name: string;
  group_id: GroupLabel | null;
  group_rank: number | null;
  rq_status: 'QUALIFIED' | 'ELIMINATED' | 'PENDING';
  in_main_qualifiers: boolean;
  won_main_qualifier: boolean;
  is_wildcard: boolean;
  in_semi_finals: boolean;
  in_final: boolean;
  is_champion: boolean;
}

// ---- Match update payload for admin writes ----

export interface MatchUpdatePayload {
  team_a_score: number | null;
  team_b_score: number | null;
  mom: string | null;
  red_card_team_id: string | null;
  notes: string | null;
  penalty_shootout_winner_id: string | null;
}
