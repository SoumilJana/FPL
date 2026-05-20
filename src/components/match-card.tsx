"use client";

import { useState } from "react";
import { Match } from "@/types/tournament";
import { useTournament } from "@/context/TournamentContext";
import { cn } from "@/lib/utils";
import { ShieldAlert, User, MessageSquare, Loader2 } from "lucide-react";

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  const { isAdmin, updateMatchResult, getTeamName } = useTournament();

  const teamAName = getTeamName(match.team_a_id);
  const teamBName = getTeamName(match.team_b_id);

  const [scoreA, setScoreA] = useState(match.team_a_score?.toString() || "");
  const [scoreB, setScoreB] = useState(match.team_b_score?.toString() || "");
  const [mom, setMom] = useState(match.mom || "");
  const [redCardTeamId, setRedCardTeamId] = useState(match.red_card_team_id || "");
  const [notes, setNotes] = useState(match.notes || "");
  const [shootoutWinnerId, setShootoutWinnerId] = useState(match.penalty_shootout_winner_id || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateMatchResult(match.id, {
      team_a_score: scoreA === "" ? null : parseInt(scoreA, 10),
      team_b_score: scoreB === "" ? null : parseInt(scoreB, 10),
      mom: mom || null,
      red_card_team_id: redCardTeamId || null,
      notes: notes || null,
      penalty_shootout_winner_id: shootoutWinnerId || null,
    });
    setSaving(false);
  };

  const isLocked = !match.team_a_id || !match.team_b_id;
  const isKnockoutTie = match.stage !== 'ROUND_QUALIFIERS' && scoreA !== "" && scoreB !== "" && scoreA === scoreB;

  const stageLabel = match.stage.replace(/_/g, ' ');

  return (
    <div className={cn(
      "bg-slate-900 border rounded-xl overflow-hidden shadow-lg transition-colors",
      match.status === 'COMPLETED' ? "border-emerald-500/30" : "border-slate-800",
      isLocked && "opacity-50"
    )}>
      <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-400">
        <span>{stageLabel} {match.group_id ? `- Group ${match.group_id}` : ''}</span>
        <span className={cn(
          "px-2 py-1 rounded-md",
          match.status === 'COMPLETED' ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-300"
        )}>
          {match.status}
        </span>
      </div>

      <div className="p-4">
        {isLocked ? (
          <div className="text-center py-6 text-slate-500 italic">
            Teams to be determined
          </div>
        ) : (
          <div className="flex items-center justify-between space-x-2 sm:space-x-4">
            <div className="flex-1 text-right font-bold text-sm sm:text-lg text-slate-200 truncate">
              {teamAName}
            </div>

            {!isAdmin ? (
              <div className="flex items-center space-x-3 bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 shrink-0">
                <span className="text-2xl font-black text-white">{match.team_a_score ?? '-'}</span>
                <span className="text-slate-600 font-bold">:</span>
                <span className="text-2xl font-black text-white">{match.team_b_score ?? '-'}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 shrink-0">
                <input
                  type="number"
                  min="0"
                  value={scoreA}
                  onChange={e => setScoreA(e.target.value)}
                  className="w-14 bg-slate-950 border border-slate-700 rounded text-center text-xl font-bold py-1 text-white focus:border-emerald-500 outline-none"
                />
                <span className="text-slate-500 font-bold">:</span>
                <input
                  type="number"
                  min="0"
                  value={scoreB}
                  onChange={e => setScoreB(e.target.value)}
                  className="w-14 bg-slate-950 border border-slate-700 rounded text-center text-xl font-bold py-1 text-white focus:border-emerald-500 outline-none"
                />
              </div>
            )}

            <div className="flex-1 text-left font-bold text-sm sm:text-lg text-slate-200 truncate">
              {teamBName}
            </div>
          </div>
        )}

        {/* Public match info */}
        {match.status === 'COMPLETED' && !isAdmin && (
          <div className="mt-4 pt-4 border-t border-slate-800/50 flex flex-wrap gap-3 text-sm">
            {match.mom && (
              <div className="flex items-center space-x-2 text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                <User className="w-4 h-4 shrink-0" />
                <span><span className="text-amber-500/70 text-xs uppercase tracking-wider mr-1">MoM:</span> {match.mom}</span>
              </div>
            )}
            {match.red_card_team_id && (
              <div className="flex items-center space-x-2 text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span><span className="text-rose-500/70 text-xs uppercase tracking-wider mr-1">Red Card:</span> {getTeamName(match.red_card_team_id)}</span>
              </div>
            )}
            {match.penalty_shootout_winner_id && (
              <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-full">
                <span className="font-semibold">Penalty Shootout Winner: {getTeamName(match.penalty_shootout_winner_id)}</span>
              </div>
            )}
            {match.notes && (
              <div className="w-full text-slate-400 flex items-start space-x-2 mt-1 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="italic">{match.notes}</span>
              </div>
            )}
          </div>
        )}

        {/* Admin Controls */}
        {isAdmin && !isLocked && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Man of the Match</label>
                <input
                  type="text"
                  value={mom}
                  onChange={e => setMom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:border-emerald-500 outline-none"
                  placeholder="Player Name"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Red Card (Penalty -1 Pt)</label>
                <select
                  value={redCardTeamId}
                  onChange={e => setRedCardTeamId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:border-rose-500 outline-none appearance-none"
                >
                  <option value="">None</option>
                  {match.team_a_id && <option value={match.team_a_id}>{teamAName}</option>}
                  {match.team_b_id && <option value={match.team_b_id}>{teamBName}</option>}
                </select>
              </div>
            </div>

            {isKnockoutTie && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
                <label className="block text-xs text-rose-400 font-bold mb-1 uppercase tracking-wider">Penalty Shootout Winner</label>
                <select
                  value={shootoutWinnerId}
                  onChange={e => setShootoutWinnerId(e.target.value)}
                  className="w-full bg-slate-950 border border-rose-500/50 rounded px-3 py-1.5 text-sm text-white focus:border-rose-500 outline-none appearance-none"
                >
                  <option value="">Select Winner...</option>
                  {match.team_a_id && <option value={match.team_a_id}>{teamAName}</option>}
                  {match.team_b_id && <option value={match.team_b_id}>{teamBName}</option>}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1">Match Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:border-emerald-500 outline-none min-h-[60px]"
                placeholder="Optional notes or highlights..."
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{saving ? 'Saving...' : 'Save Result'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
