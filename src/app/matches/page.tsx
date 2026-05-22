"use client";

import { useTournament, GroupOverrides } from "@/context/TournamentContext";
import MatchCard from "@/components/match-card";
import { Stage } from "@/types/tournament";
import { Loader2, Zap, AlertCircle, Filter } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type MatchFilter = 'ALL' | 'RQ' | 'KNOCKOUTS' | 'PENDING';

export default function MatchesPage() {
  const {
    matches, tournamentState, isAdmin, loading, error,
    generateMainQualifierFixtures, generateMainQualifierFixturesWithOverrides,
    generateSemiFinalsFixtures, generateFinalFixture,
    resetTournament,
    overallStandings, groupStandings, getGroupTies
  } = useTournament();
  const [generating, setGenerating] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [filter, setFilter] = useState<MatchFilter>('ALL');

  // Wildcard override state
  const [showWildcardPicker, setShowWildcardPicker] = useState(false);

  // Group override state
  const [showGroupOverride, setShowGroupOverride] = useState(false);
  const [groupOverrides, setGroupOverrides] = useState<GroupOverrides>({
    A: {}, B: {}, C: {}
  });

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

  const handleGenerateMQOverrides = async () => {
    setGenerating('mq');
    await generateMainQualifierFixturesWithOverrides(groupOverrides);
    setShowGroupOverride(false);
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

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset the entire tournament? This will erase all scores and generated fixtures.")) {
      setIsResetting(true);
      await resetTournament();
      setIsResetting(false);
    }
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
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Match Center</h1>
          <p className="text-slate-400 mt-2">View and manage all tournament fixtures and results.</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white border border-red-600/30 rounded-lg transition-colors text-sm font-medium"
          >
            {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
            <span className="hidden sm:inline">Reset Data</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
        <div className="flex items-center pl-2 pr-4 text-slate-500">
          <Filter className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        <button
          onClick={() => setFilter('ALL')}
          className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border", filter === 'ALL' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800")}
        >
          All
        </button>
        <button
          onClick={() => setFilter('RQ')}
          className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border", filter === 'RQ' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800")}
        >
          Group Stage
        </button>
        <button
          onClick={() => setFilter('KNOCKOUTS')}
          className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border", filter === 'KNOCKOUTS' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800")}
        >
          Knockouts
        </button>
        <button
          onClick={() => setFilter('PENDING')}
          className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border", filter === 'PENDING' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800")}
        >
          Pending Only
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center space-x-3 text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {stages.map((stage) => {
        let stageMatches = matches.filter(m => m.stage === stage.key).sort((a, b) => a.match_order - b.match_order);
        
        // Apply filters
        if (filter === 'RQ' && stage.key !== 'ROUND_QUALIFIERS') return null;
        if (filter === 'KNOCKOUTS' && stage.key === 'ROUND_QUALIFIERS') return null;
        if (filter === 'PENDING') {
          stageMatches = stageMatches.filter(m => m.status !== 'COMPLETED');
        }

        if (stageMatches.length === 0) return null;

        const isLocked = stageMatches.every(m => m.team_a_id === null && m.team_b_id === null);

        // Stage progression buttons (admin only)
        let progressionButton = null;
        if (isAdmin && tournamentState) {
          if (stage.key === 'MAIN_QUALIFIERS' && tournamentState.rq_complete && isLocked) {
            const ties = getGroupTies();
            const hasTies = ties.length > 0;

            progressionButton = (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleGenerateMQ}
                    disabled={generating === 'mq' || hasTies}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {generating === 'mq' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    <span>Auto Generate MQ</span>
                  </button>
                  {hasTies && (
                    <button
                      onClick={() => setShowGroupOverride(!showGroupOverride)}
                      className="flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <span>Override Group Selections</span>
                    </button>
                  )}
                </div>

                {hasTies && showGroupOverride && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-4">
                    <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Select Teams Advancing from Tied Groups</p>
                    
                    {(['A', 'B', 'C'] as const).map((groupId) => {
                      const teamsInGroup = groupStandings.filter(s => s.group_id === groupId);
                      return (
                        <div key={groupId} className="space-y-2 border-t border-amber-500/20 pt-2 first:border-0 first:pt-0">
                          <span className="text-sm font-bold text-slate-300">Group {groupId}</span>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <select
                              value={groupOverrides[groupId]?.rank1 || ''}
                              onChange={e => setGroupOverrides(prev => ({ ...prev, [groupId]: { ...prev[groupId], rank1: e.target.value } }))}
                              className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:border-amber-500 flex-1"
                            >
                              <option value="">-- Select Rank 1 --</option>
                              {teamsInGroup.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
                            </select>
                            <select
                              value={groupOverrides[groupId]?.rank2 || ''}
                              onChange={e => setGroupOverrides(prev => ({ ...prev, [groupId]: { ...prev[groupId], rank2: e.target.value } }))}
                              className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:border-amber-500 flex-1"
                            >
                              <option value="">-- Select Rank 2 --</option>
                              {teamsInGroup.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
                            </select>
                          </div>
                        </div>
                      )
                    })}
                    
                    <button
                      onClick={handleGenerateMQOverrides}
                      disabled={generating === 'mq'}
                      className="mt-2 w-full px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Generate MQ with Selected Teams
                    </button>
                  </div>
                )}
              </div>
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
