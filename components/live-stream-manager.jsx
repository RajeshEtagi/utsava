"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Youtube,
  Radio,
  Link,
  Trash2,
  Save,
  ExternalLink,
  Eye,
  Copy,
} from "lucide-react";

export default function LiveStreamManager({ eventId }) {
  const [url, setUrl]           = useState("");
  const [savedUrl, setSavedUrl] = useState("");
  const [youtubeId, setYoutubeId] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  useEffect(() => { fetchStream(); }, [eventId]);

  const fetchStream = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/livestream`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSavedUrl(data.liveStreamUrl || "");
      setUrl(data.liveStreamUrl || "");
      setYoutubeId(data.youtubeId);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/livestream`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveStreamUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSavedUrl(data.liveStreamUrl);
      setYoutubeId(data.youtubeId);
      toast.success(data.message || "Saved!");
    } catch (e) {
      toast.error(e.message || "Failed to save stream URL");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Remove the live stream from this event?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/livestream`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveStreamUrl: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUrl(""); setSavedUrl(""); setYoutubeId(null);
      toast.success("Live stream removed");
    } catch (e) {
      toast.error("Failed to remove stream");
    } finally {
      setSaving(false);
    }
  };

  const copyEmbedLink = () => {
    if (!youtubeId) return;
    navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${youtubeId}`);
    toast.success("Link copied!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-7 h-7 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-red-900/20 via-rose-900/10 to-transparent p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
            <Youtube className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">YouTube Live Stream</h3>
            <p className="text-sm text-muted-foreground max-w-lg">
              Paste your YouTube live stream or video URL below. Registered participants
              and viewers will see an embedded player on the event page.
            </p>
          </div>
        </div>
      </div>

      {/* URL Input */}
      <Card className="border-white/10 p-5">
        <label className="text-sm font-medium mb-2 block">
          YouTube URL
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Accepted formats: <code className="bg-white/5 px-1 rounded">youtube.com/watch?v=...</code>,{" "}
          <code className="bg-white/5 px-1 rounded">youtu.be/...</code>,{" "}
          <code className="bg-white/5 px-1 rounded">youtube.com/live/...</code>
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="pl-9"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || url === savedUrl}
            className="bg-red-600 hover:bg-red-700 text-white gap-1.5 shrink-0"
          >
            {saving ? (
              <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </Card>

      {/* Preview */}
      {youtubeId ? (
        <div className="space-y-3">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                <Radio className="w-3 h-3 animate-pulse" />
                Live / Video Active
              </span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyEmbedLink} className="gap-1.5 h-8 text-xs">
                <Copy className="w-3.5 h-3.5" /> Copy Link
              </Button>
              <Button size="sm" variant="outline" asChild className="gap-1.5 h-8 text-xs">
                <a href={savedUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" /> Open on YouTube
                </a>
              </Button>
              <Button size="sm" variant="destructive" onClick={handleRemove} disabled={saving} className="h-8 text-xs gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </Button>
            </div>
          </div>

          {/* Embedded Player */}
          <Card className="overflow-hidden border-white/10 bg-black">
            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=0`}
                title="YouTube Live Stream Preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </Card>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/3 border border-white/10 rounded-lg px-3 py-2">
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span>
              This video is visible to <strong>approved participants</strong> on the public event page.
              If this is a live stream, it will show as live when YouTube is streaming.
            </span>
          </div>
        </div>
      ) : (
        <Card className="border-dashed border-white/15 bg-white/2">
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Youtube className="w-7 h-7 text-red-400" />
            </div>
            <p className="font-medium">No live stream set yet</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Paste a YouTube URL above and click Save. Participants will see
              an embedded player on the event page.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
