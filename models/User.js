import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    location: {
      city: String,
      state: String,
      country: String,
    },
    interests: {
      type: [String],
      default: [],
    },
    role: {
      type: String,
      enum: ["organizer", "volunteer"],
      default: "volunteer",
    },
    freeEventsCreated: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
