import connectDB from "@/lib/db";
import Event from "@/models/Event";
import Registration from "@/models/Registration";
import User from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Extract YouTube video/stream ID from any YouTube URL
function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// GET: fetch current livestream URL for an event (approved participants or organizer)
export async function GET(req, { params }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { eventId } = await params;
    const event = await Event.findById(eventId).select("liveStreamUrl organizerId");
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const dbUser = await User.findOne({ clerkId }).select("_id");
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isOrganizer = event.organizerId.toString() === dbUser._id.toString();
    const approvedRegistration = await Registration.findOne({
      eventId,
      userId: dbUser._id,
      status: { $in: ["approved", "confirmed"] },
    }).select("_id");

    if (!isOrganizer && !approvedRegistration) {
      return NextResponse.json(
        { error: "Approved registration required" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      liveStreamUrl: event.liveStreamUrl || "",
      youtubeId: extractYouTubeId(event.liveStreamUrl),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: organizer sets/updates the YouTube livestream URL
export async function PUT(req, { params }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { eventId } = await params;
    const { liveStreamUrl } = await req.json();

    // Resolve clerkId → MongoDB User._id
    const dbUser = await User.findOne({ clerkId }).select("_id");
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Compare MongoDB ObjectIds
    if (event.organizerId.toString() !== dbUser._id.toString()) {
      return NextResponse.json({ error: "Forbidden: only the organizer can set the live stream" }, { status: 403 });
    }

    // Validate YouTube URL (allow clearing with empty string)
    if (liveStreamUrl && !extractYouTubeId(liveStreamUrl)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL. Use youtube.com/watch, youtu.be, or youtube.com/live links." },
        { status: 400 }
      );
    }

    event.liveStreamUrl = liveStreamUrl || "";
    await event.save();

    return NextResponse.json({
      liveStreamUrl: event.liveStreamUrl,
      youtubeId: extractYouTubeId(event.liveStreamUrl),
      message: liveStreamUrl ? "Live stream URL saved!" : "Live stream removed",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
