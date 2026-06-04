import connectDB from "@/lib/db";
import Scorecard from "@/models/Scorecard";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { eventId, title, description, categories } = body;

    if (!eventId || !title || !categories || categories.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (
      categories.some(
        (c) =>
          !c.name ||
          (c.hasMaxScore && (typeof c.maxScore !== "number" || c.maxScore <= 0)) ||
          typeof c.hasMaxScore !== "boolean" ||
          typeof c.negativeMarking !== "boolean",
      )
    ) {
      return NextResponse.json(
        { error: "Invalid category configuration" },
        { status: 400 },
      );
    }

    const scorecard = await Scorecard.create({
      eventId,
      organizerId: userId,
      title,
      description,
      categories: categories.map((c) => ({
        ...c,
        maxScore: c.hasMaxScore ? c.maxScore : 0,
      })),
      status: "draft",
    });

    console.log("\n========== Scorecard Created ==========");
    console.log("Mongoose _id:", scorecard._id);
    console.log("Mongoose _id type:", typeof scorecard._id);
    console.log("Mongoose _id toString():", scorecard._id.toString());
    console.log("Scorecard organizerId:", scorecard.organizerId);
    console.log("Scorecard eventId:", scorecard.eventId);

    // Convert to plain object and explicitly include _id as string
    const scorecardObj = scorecard.toObject();
    console.log("After toObject() _id:", scorecardObj._id);
    console.log("After toObject() _id type:", typeof scorecardObj._id);

    scorecardObj._id = scorecard._id.toString();
    console.log("Final _id being returned:", scorecardObj._id);
    console.log("Final _id type:", typeof scorecardObj._id);
    console.log("========== End Scorecard Created ==========\n");

    return NextResponse.json(scorecardObj, { status: 201 });
  } catch (error) {
    console.error("Error creating scorecard:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create scorecard" },
      { status: 500 },
    );
  }
}

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 },
      );
    }

    // Query scorecards by eventId and organizerId
    const scorecards = await Scorecard.find({
      eventId,
      organizerId: userId,
    });

    console.log(
      `Found ${scorecards.length} scorecards for eventId:`,
      eventId,
      "userId:",
      userId,
    );
    console.log("Scorecards:", scorecards);

    return NextResponse.json(
      scorecards.map((s) => {
        const obj = s.toObject();
        obj._id = s._id.toString();
        return obj;
      }),
    );
  } catch (error) {
    console.error("Error fetching scorecards:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch scorecards" },
      { status: 500 },
    );
  }
}
