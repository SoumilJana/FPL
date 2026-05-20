"use client";

import { useTournament } from "@/context/TournamentContext";
import { GroupStandingsTable, OverallStandingsTable } from "@/components/standings-table";
import { Trophy, Activity, Users, Loader2, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { groupStandings, overallStandings, tournamentState, loading, error } = useTournament();

  const groupAStandings = groupStandings.filter(s => s.group_id === 'A');
  const groupBStandings = groupStandings.filter(s => s.group_id === 'B');
  const groupCStandings = groupStandings.filter(s => s.group_id === 'C');

  const totalMatchesPlayed = tournamentState
    ? (tournamentState.rq_completed + tournamentState.mq_completed + tournamentState.sf_completed + tournamentState.final_completed)
    : 0;
  const leadingTeam = overallStandings.length > 0 ? overallStandings[0].team_name : '-';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center space-x-3 text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center space-x-4 shadow-lg">
          <div className="bg-emerald-500/20 p-3 rounded-lg">
            <Trophy className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Total Matches</p>
            <p className="text-2xl font-bold text-slate-100">{totalMatchesPlayed} <span className="text-sm text-slate-500 font-normal">/ 15</span></p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center space-x-4 shadow-lg">
          <div className="bg-blue-500/20 p-3 rounded-lg">
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Leading Team</p>
            <p className="text-2xl font-bold text-slate-100 truncate max-w-[200px]" title={leadingTeam}>{leadingTeam}</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center space-x-4 shadow-lg">
          <div className="bg-purple-500/20 p-3 rounded-lg">
            <Users className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Teams Participating</p>
            <p className="text-2xl font-bold text-slate-100">9</p>
          </div>
        </div>
      </div>

      {/* Overall Table */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center">
          <span className="bg-slate-800 px-3 py-1.5 rounded-lg mr-3 text-sm">Tournament</span>
          Overall Standings
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Cumulative performance across all stages. Used for wildcard comparison and tournament-wide rankings.
        </p>
        <OverallStandingsTable standings={overallStandings} />
      </div>

      {/* Group Tables */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center">
          <span className="bg-slate-800 px-3 py-1.5 rounded-lg mr-3 text-sm">Group Stage</span>
          Round Qualifiers
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GroupStandingsTable title="Group A" standings={groupAStandings} />
          <GroupStandingsTable title="Group B" standings={groupBStandings} />
          <GroupStandingsTable title="Group C" standings={groupCStandings} />
        </div>
      </div>

    </div>
  );
}
