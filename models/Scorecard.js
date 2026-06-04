import mongoose from "mongoose";

const ScorecardSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    organizerId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    categories: [
      {
        name: { type: String, required: true },
        maxScore: { type: Number, required: true, min: 0 },
        hasMaxScore: { type: Boolean, default: true },
        negativeMarking: { type: Boolean, default: false },
        description: { type: String, default: "" },
      },
    ],
    participants: [
      {
        participantId: {
          type: String,
        },
        name: { type: String, required: true },
        email: { type: String, default: "" },
        scores: [
          {
            categoryName: { type: String, required: true },
            score: { type: Number, required: true },
            notes: { type: String, default: "" },
          },
        ],
        totalScore: { type: Number, default: 0 },
        rank: { type: Number },
      },
    ],
    status: {
      type: String,
      enum: ["draft", "active", "completed"],
      default: "draft",
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Index for finding scorecards by event
ScorecardSchema.index({ eventId: 1, organizerId: 1 });

export default mongoose.models.Scorecard ||
  mongoose.model("Scorecard", ScorecardSchema);
