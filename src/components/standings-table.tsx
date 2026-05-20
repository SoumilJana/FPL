import React from 'react';
import { GroupStanding, OverallStanding } from '@/types/tournament';
import { cn } from '@/lib/utils';

// Group table variant
interface GroupTableProps {
  standings: GroupStanding[];
  title?: string;
}

export function GroupStandingsTable({ standings, title }: GroupTableProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {title && (
        <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700/50">
          <h3 className="font-semibold text-emerald-400">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs uppercase bg-slate-950/50 text-slate-400">
            <tr>
              <th className="px-4 py-3">Pos</th>
              <th className="px-4 py-3 w-full">Team</th>
              <th className="px-3 py-3 text-center">P</th>
              <th className="px-3 py-3 text-center">W</th>
              <th className="px-3 py-3 text-center">D</th>
              <th className="px-3 py-3 text-center">L</th>
              <th className="px-3 py-3 text-center hidden sm:table-cell">GF</th>
              <th className="px-3 py-3 text-center hidden sm:table-cell">GA</th>
              <th className="px-3 py-3 text-center font-bold">GD</th>
              <th className="px-3 py-3 text-center hidden sm:table-cell">RC</th>
              <th className="px-4 py-3 text-center text-emerald-400 font-bold">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {standings.map((stat) => {
              const isQualified = stat.group_rank <= 2;
              const isEliminated = stat.group_rank === 3;

              return (
                <tr
                  key={stat.team_id}
                  className={cn(
                    "hover:bg-slate-800/50 transition-colors",
                    isQualified && "border-l-4 border-l-emerald-500 bg-emerald-500/5",
                    isEliminated && "border-l-4 border-l-rose-500/50 opacity-75"
                  )}
                >
                  <td className="px-4 py-3 font-medium text-slate-500">{stat.group_rank}</td>
                  <td className="px-4 py-3 font-semibold text-slate-200">{stat.team_name}</td>
                  <td className="px-3 py-3 text-center text-slate-400">{stat.played}</td>
                  <td className="px-3 py-3 text-center text-slate-400">{stat.wins}</td>
                  <td className="px-3 py-3 text-center text-slate-400">{stat.draws}</td>
                  <td className="px-3 py-3 text-center text-slate-400">{stat.losses}</td>
                  <td className="px-3 py-3 text-center text-slate-400 hidden sm:table-cell">{stat.goals_for}</td>
                  <td className="px-3 py-3 text-center text-slate-400 hidden sm:table-cell">{stat.goals_against}</td>
                  <td className="px-3 py-3 text-center font-bold text-slate-300">
                    {stat.goal_difference > 0 ? `+${stat.goal_difference}` : stat.goal_difference}
                  </td>
                  <td className="px-3 py-3 text-center text-rose-400 hidden sm:table-cell">{stat.red_cards}</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-400">{stat.points}</td>
                </tr>
              );
            })}
            {standings.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-slate-500">No matches played yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Overall table variant
interface OverallTableProps {
  standings: OverallStanding[];
  title?: string;
}

export function OverallStandingsTable({ standings, title }: OverallTableProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {title && (
        <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700/50">
          <h3 className="font-semibold text-emerald-400">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs uppercase bg-slate-950/50 text-slate-400">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3 w-full">Team</th>
              <th className="px-3 py-3 text-center">P</th>
              <th className="px-3 py-3 text-center">W</th>
              <th className="px-3 py-3 text-center">D</th>
              <th className="px-3 py-3 text-center">L</th>
              <th className="px-3 py-3 text-center hidden sm:table-cell">GF</th>
              <th className="px-3 py-3 text-center hidden sm:table-cell">GA</th>
              <th className="px-3 py-3 text-center font-bold">GD</th>
              <th className="px-3 py-3 text-center hidden sm:table-cell">RC</th>
              <th className="px-4 py-3 text-center text-emerald-400 font-bold">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {standings.map((stat, i) => {
              const isQualified = i < 6; // Top 6 qualify for MQ
              const isEliminated = i >= 6; // Bottom 3 are eliminated

              return (
                <tr 
                  key={stat.team_id} 
                  className={cn(
                    "hover:bg-slate-800/50 transition-colors",
                    isQualified && "border-l-4 border-l-emerald-500 bg-emerald-500/5",
                    isEliminated && "border-l-4 border-l-rose-500/50 opacity-75"
                  )}
                >
                  <td className="px-4 py-3 font-medium text-slate-500">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-slate-200">{stat.team_name}</td>
                  <td className="px-3 py-3 text-center text-slate-400">{stat.played}</td>
                  <td className="px-3 py-3 text-center text-slate-400">{stat.wins}</td>
                  <td className="px-3 py-3 text-center text-slate-400">{stat.draws}</td>
                  <td className="px-3 py-3 text-center text-slate-400">{stat.losses}</td>
                  <td className="px-3 py-3 text-center text-slate-400 hidden sm:table-cell">{stat.goals_for}</td>
                  <td className="px-3 py-3 text-center text-slate-400 hidden sm:table-cell">{stat.goals_against}</td>
                  <td className="px-3 py-3 text-center font-bold text-slate-300">
                    {stat.goal_difference > 0 ? `+${stat.goal_difference}` : stat.goal_difference}
                  </td>
                  <td className="px-3 py-3 text-center text-rose-400 hidden sm:table-cell">{stat.red_cards}</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-400">{stat.points}</td>
                </tr>
              );
            })}
            {standings.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-slate-500">No matches played yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
