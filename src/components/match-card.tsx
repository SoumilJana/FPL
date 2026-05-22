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
  const { isAdmin, updateMatchResult, getTeamName, correctMatchResult } = useTournament();

  const teamAName = getTeamName(match.team_a_id);
  const teamBName = getTeamName(match.team_b_id);

  const [scoreA, setScoreA] = useState(match.team_a_score?.toString() || "");
  const [scoreB, setScoreB] = useState(match.team_b_score?.toString() || "");
  const [mom, setMom] = useState(match.mom || "");
  const [redCardTeamId, setRedCardTeamId] = useState(match.red_card_team_id || "");
  const [notes, setNotes] = useState(match.notes || "");
  const [shootoutWinnerId, setShootoutWinnerId] = useState(match.penalty_shootout_winner_id || "");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // When scores change, clear any stale penalty winner and error
  const handleScoreAChange = (val: string) => {
    setScoreA(val);
    setShootoutWinnerId("");
    setSaveError(null);
  };
  const handleScoreBChange = (val: string) => {
    setScoreB(val);
    setShootoutWinnerId("");
    setSaveError(null);
  };

  // Effective scores: blank field = 0 (one team scored nothing)
  // Both blank = nothing entered yet → treated as null → stays SCHEDULED
  const bothBlank = scoreA === "" && scoreB === "";
  const effectiveA = bothBlank ? null : (scoreA === "" ? 0 : parseInt(scoreA, 10));
  const effectiveB = bothBlank ? null : (scoreB === "" ? 0 : parseInt(scoreB, 10));

  const isKnockoutStage = match.stage !== 'ROUND_QUALIFIERS';
  // Knockout draw: non-RQ, scores exist, and they are equal
  const isKnockoutDraw = isKnockoutStage && !bothBlank && effectiveA === effectiveB;

  const handleSave = async () => {
    setSaveError(null);

    // Hard block: knockout draw must have a penalty winner before saving
    if (isKnockoutDraw && !shootoutWinnerId) {
      setSaveError("Knockout draw — you must select a Penalty Shootout Winner before saving.");
      return;
    }

    setSaving(true);
    await updateMatchResult(match.id, {
      team_a_score: effectiveA,
      team_b_score: effectiveB,
      mom: mom || null,
      red_card_team_id: redCardTeamId || null,
      notes: notes || null,
      // Only send penalty winner for genuine knockout draws; otherwise clear it
      penalty_shootout_winner_id: (isKnockoutDraw && shootoutWinnerId) ? shootoutWinnerId : null,
    });
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleCorrect = async () => {
    if (confirm("Are you sure? This will reset this match's score AND wipe any downstream fixtures (Semi Finals/Final) so you can regenerate them cleanly.")) {
      setSaving(true);
      await correctMatchResult(match.id);
      setSaving(false);
    }
  };

  const isLocked = !match.team_a_id || !match.team_b_id;
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
                  onChange={e => handleScoreAChange(e.target.value)}
                  className="w-14 bg-slate-950 border border-slate-700 rounded text-center text-xl font-bold py-1 text-white focus:border-emerald-500 outline-none"
                />
                <span className="text-slate-500 font-bold">:</span>
                <input
                  type="number"
                  min="0"
                  value={scoreB}
                  onChange={e => handleScoreBChange(e.target.value)}
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
                <label className="block text-xs text-slate-400 mb-1">Red Card</label>
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

            {/* Knockout draw — penalty winner required */}
            {isKnockoutDraw && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 space-y-2">
                <label className="block text-xs text-rose-400 font-bold uppercase tracking-wider">
                  Penalty Shootout Winner <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-rose-300/70">
                  Scores are equal — a penalty winner must be selected to advance a team.
                </p>
                <select
                  value={shootoutWinnerId}
                  onChange={e => { setShootoutWinnerId(e.target.value); setSaveError(null); }}
                  className={cn(
                    "w-full bg-slate-950 rounded px-3 py-1.5 text-sm text-white outline-none appearance-none border",
                    saveError ? "border-rose-500" : "border-rose-500/50 focus:border-rose-500"
                  )}
                >
                  <option value="">— Select Penalty Winner —</option>
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

            {/* Save error banner */}
            {saveError && (
              <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/40 text-rose-400 text-xs rounded-lg px-3 py-2">
                <span className="shrink-0 mt-0.5">⚠</span>
                <span>{saveError}</span>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || saveSuccess}
              className={cn(
                "w-full font-medium py-2 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2",
                saveSuccess
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white"
              )}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saveSuccess && !saving ? <span className="text-lg leading-none mr-1">✓</span> : null}
              <span>
                {saveSuccess ? 'Saved successfully!' : (match.status === 'COMPLETED' ? 'Update Result' : 'Save Result')}
              </span>
            </button>

            {match.status === 'COMPLETED' && isKnockoutStage && (
              <button
                onClick={handleCorrect}
                disabled={saving}
                className="w-full bg-amber-600/20 hover:bg-amber-600 text-amber-500 hover:text-white border border-amber-600/30 disabled:opacity-50 disabled:cursor-not-allowed font-medium py-2 rounded-lg transition-colors text-sm flex items-center justify-center"
              >
                <span>Correct Result & Reset Downstream</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
