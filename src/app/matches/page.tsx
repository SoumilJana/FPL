"use client";

import { useTournament } from "@/context/TournamentContext";
import MatchCard from "@/components/match-card";
import { Stage } from "@/types/tournament";
import { Loader2, Zap, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function MatchesPage() {
  const {
    matches, tournamentState, isAdmin, loading, error,
    generateMainQualifierFixtures, generateSemiFinalsFixtures, generateFinalFixture,
    overallStandings
  } = useTournament();
  const [generating, setGenerating] = useState<string | null>(null);

  // Wildcard override state
  const [showWildcardPicker, setShowWildcardPicker] = useState(false);

  const stages: { key: Stage; label: string }[] = [
    { key: 'ROUND_QUALIFIERS', label: 'Round Qualifiers' },
    { key: 'MAIN_QUALIFIERS', label: 'Main Qualifiers' },
    { key: 'SEMI_FINALS', label: 'Semi Finals' },
    { key: 'FINAL', label: 'Final' },
  ];

  const handleGenerateMQ = async () => {
    setGenerating('mq');
    await generateMainQualifierFixtures();
    setGenerating(null);
  };

  const handleGenerateSF = async (wildcardOverrideId?: string) => {
    setGenerating('sf');
    await generateSemiFinalsFixtures(wildcardOverrideId);
    setShowWildcardPicker(false);
    setGenerating(null);
  };

  const handleGenerateFinal = async () => {
    setGenerating('final');
    await generateFinalFixture();
    setGenerating(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  // Determine MQ losers for wildcard picker
  const mqMatches = matches.filter(m => m.stage === 'MAIN_QUALIFIERS' && m.status === 'COMPLETED');
  const mqLosers = mqMatches.map(m => {
    if (m.winner_id === m.team_a_id) return m.team_b_id;
    return m.team_a_id;
  }).filter(Boolean);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Match Center</h1>
        <p className="text-slate-400 mt-2">View and manage all tournament fixtures and results.</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center space-x-3 text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {stages.map((stage) => {
        const stageMatches = matches.filter(m => m.stage === stage.key).sort((a, b) => a.match_order - b.match_order);
        if (stageMatches.length === 0) return null;

        const isLocked = stageMatches.every(m => m.team_a_id === null && m.team_b_id === null);

        // Stage progression buttons (admin only)
        let progressionButton = null;
        if (isAdmin && tournamentState) {
          // "Generate MQ Fixtures" — shown when RQ complete and MQ teams not yet assigned
          if (stage.key === 'MAIN_QUALIFIERS' && tournamentState.rq_complete && isLocked) {
            progressionButton = (
              <button
                onClick={handleGenerateMQ}
                disabled={generating === 'mq'}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {generating === 'mq' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>Generate MQ Fixtures</span>
              </button>
            );
          }
          // "Generate SF Fixtures" — shown when MQ complete and SF teams not yet assigned
          if (stage.key === 'SEMI_FINALS' && tournamentState.mq_complete && isLocked) {
            progressionButton = (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleGenerateSF()}
                    disabled={generating === 'sf'}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {generating === 'sf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    <span>Auto Generate SF</span>
                  </button>
                  <button
                    onClick={() => setShowWildcardPicker(!showWildcardPicker)}
                    className="flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <span>Override Wildcard</span>
                  </button>
                </div>
                {showWildcardPicker && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">Select Wildcard (Penalty Shootout Winner)</p>
                    <div className="flex flex-wrap gap-2">
                      {mqLosers.map(id => (
                        <button
                          key={id}
                          onClick={() => handleGenerateSF(id!)}
                          className="px-4 py-2 bg-slate-800 hover:bg-amber-600 text-white rounded-lg text-sm transition-colors border border-slate-700"
                        >
                          {overallStandings.find(s => s.team_id === id)?.team_name || id}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }
          // "Generate Final" — shown when SF complete and Final teams not yet assigned
          if (stage.key === 'FINAL' && tournamentState.sf_complete && isLocked) {
            progressionButton = (
              <button
                onClick={handleGenerateFinal}
                disabled={generating === 'final'}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {generating === 'final' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>Generate Final Fixture</span>
              </button>
            );
          }
        }

        return (
          <div key={stage.key} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-3">
                <span>{stage.label}</span>
                {isLocked && <span className="text-xs font-normal text-slate-500 bg-slate-900 px-2 py-1 rounded">LOCKED</span>}
              </h2>
              {progressionButton}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stageMatches.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
