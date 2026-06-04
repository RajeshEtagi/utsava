"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Trash2,
  Trophy,
  Users,
  Plus,
  CheckCircle,
  Star,
  Medal,
  Pencil,
  X,
  UserPlus,
  BarChart3,
  FileText,
} from "lucide-react";

const STATUS_CONFIG = {
  draft:     { label: "Draft",     dot: "bg-gray-400",  text: "text-gray-400"  },
  active:    { label: "Active",    dot: "bg-green-400", text: "text-green-400" },
  completed: { label: "Completed", dot: "bg-blue-400",  text: "text-blue-400"  },
};

export default function ScorecardManager({ scorecardId, onDelete }) {
  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading]     = useState(true);

  // Add participant form
  const [showAdd, setShowAdd]           = useState(false);
  const [newName, setNewName]           = useState("");
  const [newScores, setNewScores]       = useState({});
  const [addingParticipant, setAddingP] = useState(false);

  // Inline score editing
  const [editIdx, setEditIdx]   = useState(null);
  const [editScores, setEditScores] = useState({});
  const [saving, setSaving]     = useState(false);

  // Status change
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => { fetchScorecard(); }, [scorecardId]);

  const fetchScorecard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scorecards/${scorecardId}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setScorecard(await res.json());
    } catch (e) {
      toast.error(e.message || "Failed to load scorecard");
    } finally {
      setLoading(false);
    }
  };

  /* ── Add participant ── */
  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error("Name is required");
      return;
    }
    setAddingP(true);
    try {
      const scores = scorecard.categories.map((c) => ({
        categoryName: c.name,
        score: parseFloat(newScores[c.name]) || 0,
      }));
      const res = await fetch(`/api/scorecards/${scorecardId}/participants`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantName: newName, scores }),
      });
      if (!res.ok) throw new Error("Failed to add participant");
      setScorecard(await res.json());
      setNewName(""); setNewScores({});
      setShowAdd(false);
      toast.success("Participant added!");
    } catch (e) {
      toast.error("Failed to add participant");
    } finally {
      setAddingP(false);
    }
  };

  /* ── Add score (delta added to current) ── */
  const handleAddScore = async () => {
    setSaving(true);
    try {
      const participant = scorecard.participants[editIdx];
      let hasErrors = false;
      const errorMessages = [];
      
      const scores = scorecard.categories.map((c) => {
        const current = participant.scores.find((s) => s.categoryName === c.name)?.score ?? 0;
        const delta = parseFloat(editScores[c.name]) || 0;
        let newScore = current + delta;
        
        // Validate max score
        if (c.hasMaxScore && newScore > c.maxScore) {
          hasErrors = true;
          errorMessages.push(`${c.name} would exceed max score (${c.maxScore})`);
          newScore = c.maxScore;
        }
        
        // Only apply floor if negative marking is disabled
        if (!c.negativeMarking) {
          if (newScore < 0) {
            hasErrors = true;
            errorMessages.push(`${c.name} cannot go below 0`);
            newScore = 0;
          }
        }
        
        return { categoryName: c.name, score: newScore };
      });
      
      if (hasErrors) {
        toast.error(errorMessages.join(" | "));
        setSaving(false);
        return;
      }
      
      const res = await fetch(`/api/scorecards/${scorecardId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantIndex: editIdx, scores }),
      });
      if (!res.ok) throw new Error("Failed to add score");
      setScorecard(await res.json());
      setEditIdx(null);
      setEditScores({});
      toast.success("Score added!");
    } catch (e) {
      toast.error(e.message || "Failed to add score");
    } finally {
      setSaving(false);
    }
  };

  /* ── Deduct score (delta subtracted from current) ── */
  const handleDeductScore = async () => {
    setSaving(true);
    try {
      const participant = scorecard.participants[editIdx];
      let hasErrors = false;
      const errorMessages = [];
      
      const scores = scorecard.categories.map((c) => {
        const current = participant.scores.find((s) => s.categoryName === c.name)?.score ?? 0;
        const delta = parseFloat(editScores[c.name]) || 0;
        let newScore = current - delta;
        
        // Only apply floor if negative marking is disabled
        if (!c.negativeMarking) {
          if (newScore < 0) {
            hasErrors = true;
            errorMessages.push(`${c.name} cannot go below 0`);
            newScore = 0;
          }
        }
        
        return { categoryName: c.name, score: newScore };
      });
      
      if (hasErrors) {
        toast.error(errorMessages.join(" | "));
        setSaving(false);
        return;
      }
      
      const res = await fetch(`/api/scorecards/${scorecardId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantIndex: editIdx, scores }),
      });
      if (!res.ok) throw new Error("Failed to deduct score");
      setScorecard(await res.json());
      setEditIdx(null);
      setEditScores({});
      toast.success("Score deducted!");
    } catch (e) {
      toast.error(e.message || "Failed to deduct score");
    } finally {
      setSaving(false);
    }
  };

  /* ── Status ── */
  const handleStatus = async (s) => {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/scorecards/${scorecardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      });
      if (!res.ok) throw new Error();
      setScorecard(await res.json());
      toast.success(`Scorecard marked as ${s}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!confirm("Delete this scorecard? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/scorecards/${scorecardId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Scorecard deleted");
      onDelete();
    } catch {
      toast.error("Failed to delete");
    }
  };

  /* ── Loading / empty ── */
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading scorecard…</p>
      </div>
    );

  if (!scorecard)
    return <div className="text-center py-16 text-muted-foreground">Scorecard not found</div>;

  const maxTotal   = scorecard.categories.reduce(
    (s, c) => s + (c.hasMaxScore ? c.maxScore : 0),
    0,
  );
  const statusCfg  = STATUS_CONFIG[scorecard.status] || STATUS_CONFIG.draft;
  const RANK_BADGE = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6">

      {/* ══════════ HEADER ══════════ */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/25 via-indigo-900/15 to-transparent p-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          {/* Left */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold">{scorecard.title}</h2>
              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 ${statusCfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            </div>
            {scorecard.description && (
              <p className="text-sm text-muted-foreground mb-3">{scorecard.description}</p>
            )}
            {/* Category chips */}
            <div className="flex flex-wrap gap-1.5">
              {scorecard.categories.map((c, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium">
                  {c.name}
                  {c.hasMaxScore && (
                    <span className="text-muted-foreground"> / {c.maxScore}</span>
                  )}
                </span>
              ))}
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400">
                Total: {maxTotal} pts
              </span>
            </div>
          </div>
          {/* Right — actions */}
          <div className="flex gap-2 shrink-0 flex-wrap">
            {scorecard.status === "draft" && (
              <Button size="sm" onClick={() => handleStatus("active")} disabled={statusLoading}
                className="bg-green-600 hover:bg-green-700 text-white gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Activate
              </Button>
            )}
            {scorecard.status === "active" && (
              <Button size="sm" onClick={() => handleStatus("completed")} disabled={statusLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
                <Trophy className="w-3.5 h-3.5" /> Mark Complete
              </Button>
            )}
            <Button size="sm" variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ══════════ HOW IT WORKS (when no participants) ══════════ */}
      {scorecard.participants.length === 0 && !showAdd && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: UserPlus,  step: "1", title: "Add Participants", desc: "Click 'Add Participant' below and enter their name" },
            { icon: Star,      step: "2", title: "Enter Scores",     desc: "Click the ✏️ icon next to any participant to score them per category" },
            { icon: BarChart3, step: "3", title: "View Leaderboard", desc: "Rankings update automatically after every score change" },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="rounded-xl border border-white/10 bg-white/2 p-4 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm font-bold flex items-center justify-center shrink-0">
                {step}
              </div>
              <div>
                <p className="text-sm font-semibold mb-0.5">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════ PARTICIPANTS / LEADERBOARD ══════════ */}
      <Card className="border-white/10 overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Medal className="w-5 h-5 text-yellow-400" />
            <span className="font-semibold">
              Leaderboard
              {scorecard.participants.length > 0 && (
                <span className="ml-2 text-xs bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md text-muted-foreground">
                  {scorecard.participants.length} participants
                </span>
              )}
            </span>
          </div>
          <Button size="sm" onClick={() => { setShowAdd(true); setEditIdx(null); }}
            className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white h-8">
            <Plus className="w-3.5 h-3.5" /> Add Participant
          </Button>
        </div>

        {/* ── Add participant form (inline) ── */}
        {showAdd && (
          <div className="border-b border-white/10 bg-purple-500/5 px-5 py-5">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-4 h-4 text-purple-400" />
              <span className="font-medium text-sm">New Participant</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Full Name *</label>
                <Input placeholder="e.g. Ravi Kumar" value={newName}
                  onChange={(e) => setNewName(e.target.value)} className="h-9" />
              </div>
            </div>

            {/* Per-category score inputs */}
            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-2 block">
                Scores <span className="text-muted-foreground/60">(you can leave as 0 and edit later)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {scorecard.categories.map((c) => (
                  <div key={c.name} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-2">
                    <span className="text-xs text-muted-foreground truncate flex-1">{c.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number" min="0" max={c.maxScore} placeholder="0"
                        value={newScores[c.name] || ""}
                        onChange={(e) => setNewScores((p) => ({ ...p, [c.name]: e.target.value }))}
                        className="w-14 bg-transparent text-right text-sm font-semibold focus:outline-none"
                      />
                      <span className="text-xs text-muted-foreground">/{c.maxScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); setNewName(""); setNewScores({}); }}>
                <X className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={addingParticipant}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-1">
                {addingParticipant
                  ? <><span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> Adding…</>
                  : <><UserPlus className="w-3.5 h-3.5" /> Add Participant</>}
              </Button>
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {scorecard.participants.length === 0 && !showAdd ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No participants yet — click <strong>Add Participant</strong> above to get started</p>
          </div>
        ) : scorecard.participants.length > 0 ? (
          <div className="divide-y divide-white/5">
            {(() => {
              // Calculate the denominator for percentage
              const maxParticipantScore = Math.max(...scorecard.participants.map(part => part.totalScore || 0), 1);
              const denominator = maxTotal > 0 ? maxTotal : maxParticipantScore;
              
              return scorecard.participants.map((p, idx) => {
                const rank  = p.rank || idx + 1;
                const pct   = Math.round((p.totalScore / denominator) * 100);
                const isEdit = editIdx === idx;

                return (
                <div key={idx} className={`px-5 py-4 transition-colors ${isEdit ? "bg-purple-500/5" : "hover:bg-white/2"}`}>
                  <div className="flex items-start gap-3">
                    {/* Rank badge */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 font-bold
                      ${rank === 1 ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                        rank === 2 ? "bg-gray-400/20 text-gray-300 border border-gray-400/30" :
                        rank === 3 ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                        "bg-white/5 text-muted-foreground border border-white/10"}`}>
                      {rank <= 3 ? RANK_BADGE[rank - 1] : rank}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-sm">{p.name}</p>
                        </div>
                        {/* Total score + progress */}
                        <div className="text-right shrink-0">
                          <p className={`text-lg font-bold ${pct >= 80 ? "text-green-400" : pct >= 50 ? "text-yellow-400" : "text-muted-foreground"}`}>
                            {p.totalScore}
                            <span className="text-xs text-muted-foreground font-normal">/{maxTotal}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{pct}%</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-white/10 rounded-full mb-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? "bg-green-400" : pct >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Category scores */}
                      {isEdit ? (
                        /* ── EDIT MODE ── */
                        <div className="space-y-3">
                          <p className="text-xs font-medium text-purple-400 flex items-center gap-1">
                            <Pencil className="w-3 h-3" /> Editing scores for {p.name}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {scorecard.categories.map((c) => {
                              const cur = p.scores.find((s) => s.categoryName === c.name)?.score ?? 0;
                              const rawDelta = editScores[c.name] ?? "";
                              const delta = rawDelta !== "" && !Number.isNaN(parseFloat(rawDelta)) ? parseFloat(rawDelta) : 0;
                              
                              // Calculate projected scores for both add and deduct
                              const addScore = cur + delta;
                              const deductScore = cur - delta;
                              
                              // Check for violations
                              const addExceedsMax = c.hasMaxScore && addScore > c.maxScore;
                              const addBelowZero = !c.negativeMarking && addScore < 0;
                              const deductBelowZero = !c.negativeMarking && deductScore < 0;
                              
                              const hasWarning = delta !== 0 && (addExceedsMax || addBelowZero || deductBelowZero);
                              const catPct = c.hasMaxScore ? Math.round((cur / c.maxScore) * 100) : 100;
                              
                              return (
                                <div key={c.name} className={`rounded-xl border p-3 transition-colors ${
                                  hasWarning 
                                    ? "border-red-500/40 bg-red-500/10" 
                                    : "border-purple-500/20 bg-purple-500/5"
                                }`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-muted-foreground truncate">{c.name}</p>
                                    {hasWarning && (
                                      <span className="text-xs text-red-400 font-medium">⚠ Invalid</span>
                                    )}
                                  </div>
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">Current:</span>
                                      <span className="font-semibold">
                                        {cur}
                                        {c.hasMaxScore && <span className="text-muted-foreground">/{c.maxScore}</span>}
                                      </span>
                                    </div>
                                    <input
                                      type="number"
                                      value={rawDelta}
                                      onChange={(e) => setEditScores((prev) => ({ ...prev, [c.name]: e.target.value }))}
                                      placeholder="0"
                                      className={`w-full bg-transparent text-center text-sm font-bold focus:outline-none border-b pb-1 ${
                                        hasWarning 
                                          ? "border-red-500/50 text-red-400" 
                                          : "border-purple-500/50"
                                      }`}
                                    />
                                    {hasWarning && (
                                      <div className="text-xs text-red-400 space-y-0.5 mt-2 pt-2 border-t border-red-500/20">
                                        {addExceedsMax && (
                                          <div>Add would reach {addScore} (max {c.maxScore})</div>
                                        )}
                                        {addBelowZero && (
                                          <div>Add would go to {addScore} (minimum 0)</div>
                                        )}
                                        {deductBelowZero && (
                                          <div>Deduct would go to {deductScore} (minimum 0)</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-1.5 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${catPct >= 80 ? "bg-green-400" : catPct >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                                      style={{ width: `${Math.min(catPct, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline" onClick={() => { setEditIdx(null); setEditScores({}); }}
                              className="h-8 gap-1">
                              <X className="w-3.5 h-3.5" /> Cancel
                            </Button>
                            <Button size="sm" onClick={handleDeductScore} disabled={saving}
                              className="h-8 gap-1 bg-red-600 hover:bg-red-700 text-white">
                              {saving ? (
                                <><span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
                              ) : (
                                <>Deduct Score</>
                              )}
                            </Button>
                            <Button size="sm" onClick={handleAddScore} disabled={saving}
                              className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white">
                              {saving ? (
                                <><span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
                              ) : (
                                <>Add Score</>
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* ── VIEW MODE ── */
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-2">
                            {scorecard.categories.map((c) => {
                              const s = p.scores.find((sc) => sc.categoryName === c.name);
                              const score = s?.score ?? 0;
                              const catPct = c.hasMaxScore ? Math.round((score / c.maxScore) * 100) : 100;
                              return (
                                <span key={c.name}
                                  className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-medium">
                                  {c.name}:{" "}
                                  <span className={catPct >= 80 ? "text-green-400" : catPct >= 50 ? "text-yellow-400" : "text-red-400"}>
                                    {score}
                                  </span>
                                  {c.hasMaxScore && (
                                    <span className="text-muted-foreground">/{c.maxScore}</span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                          <Button size="sm" variant="outline"
                            onClick={() => {
                              setEditIdx(idx);
                              setShowAdd(false);
                              const init = {};
                              p.scores.forEach((s) => { init[s.categoryName] = s.score; });
                              setEditScores(init);
                            }}
                            className="h-7 gap-1 text-xs">
                            <Pencil className="w-3 h-3" /> Edit Scores
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
              });
            })()}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
