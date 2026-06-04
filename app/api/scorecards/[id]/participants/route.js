import connectDB from "@/lib/db";
import Scorecard from "@/models/Scorecard";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function POST(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    // Next.js 15: params is a Promise and must be awaited
    const { id } = await params;
    const { participantIndex, scores } = await req.json();

    // Convert string ID to ObjectId
    const objectId = new mongoose.Types.ObjectId(id);

    const scorecard = await Scorecard.findOne({
      _id: objectId,
      organizerId: userId,
    });

    if (!scorecard) {
      return NextResponse.json(
        { error: "Scorecard not found" },
        { status: 404 },
      );
    }

    if (
      participantIndex < 0 ||
      participantIndex >= scorecard.participants.length
    ) {
      return NextResponse.json(
        { error: "Invalid participant index" },
        { status: 400 },
      );
    }

    const participant = scorecard.participants[participantIndex];

    // Validate and normalize submitted scores according to category config
    participant.scores = scores.map((s) => {
      const category = scorecard.categories.find((c) => c.name === s.categoryName);
      if (!category) {
        throw new Error(`Unknown category: ${s.categoryName}`);
      }

      let value = Number(s.score) || 0;

      if (category.hasMaxScore) {
        const max = Number(category.maxScore) || 0;
        const min = category.negativeMarking ? -max : 0;
        if (value > max) value = max;
        if (value < min) value = min;
      } else {
        // No max score: disallow negative values unless negativeMarking is enabled
        if (!category.negativeMarking && value < 0) {
          value = 0;
        }
      }

      return {
        categoryName: s.categoryName,
        score: value,
        notes: s.notes || "",
      };
    });

    // Calculate total score
    participant.totalScore = participant.scores.reduce(
      (sum, score) => sum + score.score,
      0,
    );

    // Recalculate ranks
    scorecard.participants.sort((a, b) => b.totalScore - a.totalScore);
    scorecard.participants.forEach((p, idx) => {
      p.rank = idx + 1;
    });

    await scorecard.save();

    const obj = scorecard.toObject();
    obj._id = scorecard._id.toString();
    return NextResponse.json(obj);
  } catch (error) {
    console.error("Error updating scores:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update scores" },
      { status: 500 },
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    // Next.js 15: params is a Promise and must be awaited
    const { id } = await params;
    const { participantName, scores } = await req.json();

    // Convert string ID to ObjectId
    const objectId = new mongoose.Types.ObjectId(id);

    const scorecard = await Scorecard.findOne({
      _id: objectId,
      organizerId: userId,
    });

    if (!scorecard) {
      return NextResponse.json(
        { error: "Scorecard not found" },
        { status: 404 },
      );
    }

    // Validate and normalize submitted scores according to category config
    const normalizedScores = scores.map((s) => {
      const category = scorecard.categories.find((c) => c.name === s.categoryName);
      if (!category) {
        throw new Error(`Unknown category: ${s.categoryName}`);
      }

      let value = Number(s.score) || 0;

      if (category.hasMaxScore) {
        const max = Number(category.maxScore) || 0;
        const min = category.negativeMarking ? -max : 0;
        if (value > max) value = max;
        if (value < min) value = min;
      } else {
        if (!category.negativeMarking && value < 0) {
          value = 0;
        }
      }

      return {
        categoryName: s.categoryName,
        score: value,
        notes: s.notes || "",
      };
    });

    // Add new participant
    const totalScore = normalizedScores.reduce((sum, score) => sum + score.score, 0);

    scorecard.participants.push({
      name: participantName,
      scores: normalizedScores,
      totalScore,
    });

    // Recalculate ranks
    scorecard.participants.sort((a, b) => b.totalScore - a.totalScore);
    scorecard.participants.forEach((p, idx) => {
      p.rank = idx + 1;
    });

    await scorecard.save();

    const obj = scorecard.toObject();
    obj._id = scorecard._id.toString();
    return NextResponse.json(obj);
  } catch (error) {
    console.error("Error adding participant:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add participant" },
      { status: 500 },
    );
  }
}
