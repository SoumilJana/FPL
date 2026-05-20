"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Team, Match, GroupTeam, GroupStanding, OverallStanding,
  TournamentState, QualificationStatus, MatchUpdatePayload, GroupLabel
} from '@/types/tournament';

interface TournamentContextType {
  // Data
  teams: Team[];
  matches: Match[];
  groupTeams: GroupTeam[];
  groupStandings: GroupStanding[];
  overallStandings: OverallStanding[];
  tournamentState: TournamentState | null;
  qualificationStatus: QualificationStatus[];

  // Admin
  isAdmin: boolean;
  loginAdmin: (username: string, password: string) => boolean;
  logoutAdmin: () => void;

  // Actions
  updateMatchResult: (matchId: string, payload: MatchUpdatePayload) => Promise<void>;
  generateMainQualifierFixtures: () => Promise<void>;
  generateSemiFinalsFixtures: (wildcardTeamId?: string) => Promise<void>;
  generateFinalFixture: () => Promise<void>;

  // State
  loading: boolean;
  error: string | null;

  // Helpers
  getTeamName: (id: string | null) => string;
  getTeamGroup: (id: string) => GroupLabel | null;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [groupTeams, setGroupTeams] = useState<GroupTeam[]>([]);
  const [groupStandings, setGroupStandings] = useState<GroupStanding[]>([]);
  const [overallStandings, setOverallStandings] = useState<OverallStanding[]>([]);
  const [tournamentState, setTournamentState] = useState<TournamentState | null>(null);
  const [qualificationStatus, setQualificationStatus] = useState<QualificationStatus[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --------------- Data Fetching ---------------

  const fetchAll = useCallback(async () => {
    try {
      const [
        { data: teamsData },
        { data: matchesData },
        { data: groupTeamsData },
        { data: groupStandingsData },
        { data: overallStandingsData },
        { data: stateData },
        { data: qualData },
      ] = await Promise.all([
        supabase.from('teams').select('*').order('name'),
        supabase.from('matches').select('*').order('match_order'),
        supabase.from('group_teams').select('*'),
        supabase.from('group_standings').select('*').order('group_id').order('group_rank'),
        supabase.from('overall_standings').select('*').order('points', { ascending: false }),
        supabase.from('tournament_state').select('*'),
        supabase.from('qualification_status').select('*'),
      ]);

      let finalGroupStandings = groupStandingsData || [];
      let finalOverallStandings = overallStandingsData || [];

      if (teamsData && groupTeamsData) {
        const groupTeamIds = finalGroupStandings.map(s => s.team_id);
        const missingGroupTeams = groupTeamsData.filter(gt => !groupTeamIds.includes(gt.team_id));
        
        const paddedMissingGroupStandings = missingGroupTeams.map(gt => {
          const team = teamsData.find(t => t.id === gt.team_id);
          return {
            group_id: gt.group_id,
            team_id: gt.team_id,
            team_name: team?.name || 'Unknown',
            logo_url: team?.logo_url || null,
            played: 0, wins: 0, draws: 0, losses: 0,
            goals_for: 0, goals_against: 0, goal_difference: 0,
            red_cards: 0, points: 0, group_rank: 99
          };
        });

        finalGroupStandings = [...finalGroupStandings, ...paddedMissingGroupStandings].sort((a, b) => {
          if (a.group_id !== b.group_id) return a.group_id.localeCompare(b.group_id);
          return a.group_rank - b.group_rank;
        });

        const overallTeamIds = finalOverallStandings.map(s => s.team_id);
        const missingOverallTeams = teamsData.filter(t => !overallTeamIds.includes(t.id));

        const paddedMissingOverallStandings = missingOverallTeams.map(t => ({
            team_id: t.id,
            team_name: t.name,
            logo_url: t.logo_url,
            played: 0, wins: 0, draws: 0, losses: 0,
            goals_for: 0, goals_against: 0, goal_difference: 0,
            red_cards: 0, points: 0
        }));

        finalOverallStandings = [...finalOverallStandings, ...paddedMissingOverallStandings].sort((a, b) => b.points - a.points);
      }

      if (teamsData) setTeams(teamsData);
      if (matchesData) setMatches(matchesData);
      if (groupTeamsData) setGroupTeams(groupTeamsData);
      setGroupStandings(finalGroupStandings);
      setOverallStandings(finalOverallStandings);
      if (stateData && stateData.length > 0) setTournamentState(stateData[0]);
      if (qualData) setQualificationStatus(qualData);

      setError(null);
    } catch (err) {
      setError('Failed to load tournament data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // --------------- Initial Load + Realtime ---------------

  useEffect(() => {
    fetchAll();

    // Subscribe to match changes for real-time updates
    const channel = supabase
      .channel('fpl-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        // Re-fetch everything when any match changes — views will have recomputed
        fetchAll();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  // --------------- Admin Auth ---------------

  useEffect(() => {
    const admin = localStorage.getItem('fpl_admin');
    if (admin === 'true') setIsAdmin(true);
  }, []);

  const loginAdmin = (username: string, password: string) => {
    const validUser = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin';
    const validPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    if (username === validUser && password === validPass) {
      setIsAdmin(true);
      localStorage.setItem('fpl_admin', 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem('fpl_admin');
  };

  // --------------- Admin Actions ---------------

  const updateMatchResult = async (matchId: string, payload: MatchUpdatePayload) => {
    const { error: err } = await supabase
      .from('matches')
      .update({
        team_a_score: payload.team_a_score,
        team_b_score: payload.team_b_score,
        mom: payload.mom,
        red_card_team_id: payload.red_card_team_id,
        notes: payload.notes,
        penalty_shootout_winner_id: payload.penalty_shootout_winner_id,
      })
      .eq('id', matchId);

    if (err) {
      console.error('Failed to update match:', err);
      setError(`Failed to update match: ${err.message}`);
      return;
    }

    // Refetch everything — the DB trigger will have recomputed winner/status,
    // and the views will reflect the new standings.
    await fetchAll();
  };

  // Generate Main Qualifier fixtures (A1 vs B2, B1 vs C2, C1 vs A2)
  const generateMainQualifierFixtures = async () => {
    // Get group standings (already sorted by rank from DB view)
    const groupA = groupStandings.filter(s => s.group_id === 'A');
    const groupB = groupStandings.filter(s => s.group_id === 'B');
    const groupC = groupStandings.filter(s => s.group_id === 'C');

    const a1 = groupA.find(s => s.group_rank === 1)?.team_id;
    const a2 = groupA.find(s => s.group_rank === 2)?.team_id;
    const b1 = groupB.find(s => s.group_rank === 1)?.team_id;
    const b2 = groupB.find(s => s.group_rank === 2)?.team_id;
    const c1 = groupC.find(s => s.group_rank === 1)?.team_id;
    const c2 = groupC.find(s => s.group_rank === 2)?.team_id;

    if (!a1 || !a2 || !b1 || !b2 || !c1 || !c2) {
      setError('Cannot generate MQ fixtures: group standings incomplete');
      return;
    }

    const mqMatches = matches.filter(m => m.stage === 'MAIN_QUALIFIERS').sort((a, b) => a.match_order - b.match_order);
    if (mqMatches.length !== 3) return;

    // MQ1: A1 vs B2 | MQ2: B1 vs C2 | MQ3: C1 vs A2
    const updates = [
      { id: mqMatches[0].id, team_a_id: a1, team_b_id: b2 },
      { id: mqMatches[1].id, team_a_id: b1, team_b_id: c2 },
      { id: mqMatches[2].id, team_a_id: c1, team_b_id: a2 },
    ];

    for (const upd of updates) {
      const { error: err } = await supabase
        .from('matches')
        .update({ team_a_id: upd.team_a_id, team_b_id: upd.team_b_id })
        .eq('id', upd.id);
      if (err) {
        setError(`Failed to generate MQ fixture: ${err.message}`);
        return;
      }
    }

    await fetchAll();
  };

  // Generate Semi-Final fixtures
  // SF1: Best Winner vs 3rd Winner | SF2: 2nd Winner vs Wildcard
  const generateSemiFinalsFixtures = async (overrideWildcardId?: string) => {
    const mqMatches = matches.filter(m => m.stage === 'MAIN_QUALIFIERS' && m.status === 'COMPLETED');
    if (mqMatches.length !== 3) return;

    // Winners: teams who won their MQ match
    const winnerIds = mqMatches.map(m => m.winner_id!).filter(Boolean);
    // Losers: teams who lost their MQ match
    const loserIds = mqMatches.map(m => {
      if (m.winner_id === m.team_a_id) return m.team_b_id!;
      return m.team_a_id!;
    });

    // Sort winners by overall standings to get best/2nd/3rd
    const sortedWinners = winnerIds
      .map(id => overallStandings.find(s => s.team_id === id))
      .filter(Boolean)
      .sort((a, b) => {
        if (b!.points !== a!.points) return b!.points - a!.points;
        if (b!.goal_difference !== a!.goal_difference) return b!.goal_difference - a!.goal_difference;
        return b!.goals_for - a!.goals_for;
      })
      .map(s => s!.team_id);

    // Wildcard: Best loser (or admin override)
    let wildcardId: string;
    if (overrideWildcardId) {
      wildcardId = overrideWildcardId;
    } else {
      const sortedLosers = loserIds
        .map(id => overallStandings.find(s => s.team_id === id))
        .filter(Boolean)
        .sort((a, b) => {
          if (b!.goal_difference !== a!.goal_difference) return b!.goal_difference - a!.goal_difference;
          return b!.goals_for - a!.goals_for;
        });
      wildcardId = sortedLosers[0]!.team_id;
    }

    const sfMatches = matches.filter(m => m.stage === 'SEMI_FINALS').sort((a, b) => a.match_order - b.match_order);
    if (sfMatches.length !== 2) return;

    // SF1: Best Winner vs 3rd Winner
    // SF2: 2nd Winner vs Wildcard
    const updates = [
      { id: sfMatches[0].id, team_a_id: sortedWinners[0], team_b_id: sortedWinners[2] },
      { id: sfMatches[1].id, team_a_id: sortedWinners[1], team_b_id: wildcardId },
    ];

    for (const upd of updates) {
      const { error: err } = await supabase
        .from('matches')
        .update({ team_a_id: upd.team_a_id, team_b_id: upd.team_b_id })
        .eq('id', upd.id);
      if (err) {
        setError(`Failed to generate SF fixture: ${err.message}`);
        return;
      }
    }

    await fetchAll();
  };

  // Generate Final fixture from SF winners
  const generateFinalFixture = async () => {
    const sfMatches = matches.filter(m => m.stage === 'SEMI_FINALS' && m.status === 'COMPLETED');
    if (sfMatches.length !== 2) return;

    const sf1Winner = sfMatches.find(m => m.match_order === 13)?.winner_id;
    const sf2Winner = sfMatches.find(m => m.match_order === 14)?.winner_id;

    if (!sf1Winner || !sf2Winner) return;

    const finalMatch = matches.find(m => m.stage === 'FINAL');
    if (!finalMatch) return;

    const { error: err } = await supabase
      .from('matches')
      .update({ team_a_id: sf1Winner, team_b_id: sf2Winner })
      .eq('id', finalMatch.id);

    if (err) {
      setError(`Failed to generate Final fixture: ${err.message}`);
      return;
    }

    await fetchAll();
  };

  // --------------- Helpers ---------------

  const getTeamName = (id: string | null): string => {
    if (!id) return 'TBD';
    return teams.find(t => t.id === id)?.name || 'Unknown';
  };

  const getTeamGroup = (id: string): GroupLabel | null => {
    return groupTeams.find(gt => gt.team_id === id)?.group_id || null;
  };

  return (
    <TournamentContext.Provider value={{
      teams, matches, groupTeams, groupStandings, overallStandings,
      tournamentState, qualificationStatus,
      isAdmin, loginAdmin, logoutAdmin,
      updateMatchResult, generateMainQualifierFixtures, generateSemiFinalsFixtures, generateFinalFixture,
      loading, error,
      getTeamName, getTeamGroup,
    }}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
