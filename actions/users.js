"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { revalidatePath } from "next/cache";

export async function getCurrentUser() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    await connectDB();
    let user = await User.findOne({ clerkId: userId });

    // If user doesn't exist in DB, fetch from Clerk and create
    if (!user) {
      const { currentUser } = await import("@clerk/nextjs/server");
      const clerkUser = await currentUser();

      if (!clerkUser) return null;

      const email = clerkUser.emailAddresses[0]?.emailAddress;
      const name =
        `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
        "Anonymous";

      // Try to get role from query param if available
      let role = "volunteer";
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const qRole = params.get("role");
        if (qRole === "organizer" || qRole === "volunteer") {
          role = qRole;
        }
      }

      user = await User.create({
        clerkId: clerkUser.id,
        email,
        name,
        imageUrl: clerkUser.imageUrl,
        role,
      });
    }

    return JSON.parse(JSON.stringify(user)); // Serialize for Server Actions
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

export async function setUserRole(role) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    await connectDB();

    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { role },
      { new: true },
    );

    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    console.error("Error setting user role:", error);
    throw new Error("Failed to set user role");
  }
}

export async function updateUserLocation(location) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await connectDB();

    await User.findOneAndUpdate(
      { clerkId: userId },
      { location },
      { new: true }
    );

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating user location:", error);
    throw new Error("Failed to update location");
  }
}
