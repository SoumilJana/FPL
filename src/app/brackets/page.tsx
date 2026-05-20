"use client";

import { useTournament } from "@/context/TournamentContext";
import { Match, QualificationStatus } from "@/types/tournament";
import { cn } from "@/lib/utils";
import { Loader2, Crown, Trophy } from "lucide-react";

export default function BracketsPage() {
  const { matches, getTeamName, qualificationStatus, loading } = useTournament();

  const mqMatches = matches.filter(m => m.stage === 'MAIN_QUALIFIERS').sort((a, b) => a.match_order - b.match_order);
  const sfMatches = matches.filter(m => m.stage === 'SEMI_FINALS').sort((a, b) => a.match_order - b.match_order);
  const finalMatch = matches.find(m => m.stage === 'FINAL');
  const champion = qualificationStatus.find(q => q.is_champion);

  const BracketNode = ({ match, title }: { match?: Match; title?: string }) => {
    if (!match) return <div className="w-60 sm:w-64 h-24" />;

    const isCompleted = match.status === 'COMPLETED';
    const aWon = isCompleted && match.winner_id === match.team_a_id;
    const bWon = isCompleted && match.winner_id === match.team_b_id;

    return (
      <div className="w-60 sm:w-64 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col relative z-10">
        {title && (
          <div className="bg-slate-950 px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
            {title}
          </div>
        )}
        <div className={cn("flex justify-between items-center px-4 py-2.5 border-b border-slate-800", aWon && "bg-emerald-500/10")}>
          <span className={cn(
            "font-semibold truncate text-sm",
            aWon ? "text-emerald-400" : "text-slate-300",
            !match.team_a_id && "text-slate-600 italic"
          )}>
            {getTeamName(match.team_a_id)}
          </span>
          <span className="font-bold text-white ml-2">{match.team_a_score ?? '-'}</span>
        </div>
        <div className={cn("flex justify-between items-center px-4 py-2.5", bWon && "bg-emerald-500/10")}>
          <span className={cn(
            "font-semibold truncate text-sm",
            bWon ? "text-emerald-400" : "text-slate-300",
            !match.team_b_id && "text-slate-600 italic"
          )}>
            {getTeamName(match.team_b_id)}
          </span>
          <span className="font-bold text-white ml-2">{match.team_b_score ?? '-'}</span>
        </div>
        {match.penalty_shootout_winner_id && (
          <div className="bg-amber-500/10 px-3 py-1 text-[10px] font-bold text-amber-400 text-center border-t border-slate-800">
            PKs: {getTeamName(match.penalty_shootout_winner_id)}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Tournament Bracket</h1>
        <p className="text-slate-400 mt-2">Visual progression from Main Qualifiers to the Championship Final.</p>
      </div>

      {/* Qualification Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {qualificationStatus.filter(q => q.is_wildcard).map(q => (
          <div key={q.team_id} className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Crown className="w-3 h-3" />
            Wildcard: {q.team_name}
          </div>
        ))}
      </div>

      {/* Bracket Layout */}
      <div className="overflow-x-auto pb-8">
        <div className="min-w-[850px] flex justify-center items-start gap-8 lg:gap-12 py-6 relative">

          {/* Main Qualifiers Column */}
          <div className="flex flex-col gap-12 relative z-10">
            <h3 className="text-center font-bold text-emerald-400 mb-2 uppercase tracking-wider text-xs sm:text-sm">Main Qualifiers</h3>
            {mqMatches.map((m, i) => (
              <BracketNode key={m.id} match={m} title={`MQ ${i + 1}`} />
            ))}
          </div>

          {/* Semi Finals Column */}
          <div className="flex flex-col gap-20 pt-16 relative z-10">
            <h3 className="text-center font-bold text-emerald-400 mb-2 uppercase tracking-wider text-xs sm:text-sm">Semi Finals</h3>
            <BracketNode match={sfMatches[0]} title="SF 1 · Best vs 3rd" />
            <BracketNode match={sfMatches[1]} title="SF 2 · 2nd vs Wildcard" />
          </div>

          {/* Final Column */}
          <div className="flex flex-col items-center pt-32 relative z-10">
            <h3 className="text-center font-bold text-amber-400 mb-4 uppercase tracking-wider text-xs sm:text-sm">Final</h3>
            <BracketNode match={finalMatch} title="Grand Final" />

            {champion && (
              <div className="mt-8 text-center">
                <div className="inline-block bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/50 rounded-2xl px-8 py-5 shadow-[0_0_40px_rgba(245,158,11,0.25)]">
                  <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <span className="block text-amber-500 text-xs font-bold uppercase tracking-widest mb-1">Tournament Champion</span>
                  <span className="text-2xl font-black text-white">{champion.team_name}</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
