"use server";

import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Event from "@/models/Event";
import Registration from "@/models/Registration";
import User from "@/models/User";

/**
 * Fetch event dashboard data including stats
 */
export async function getEventDashboard(args) {
  try {
    const { eventId } = args;
    
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    await connectDB();

    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found");

    // Fetch the event
    const event = await Event.findById(eventId).lean();
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId.toString() !== user._id.toString()) {
      throw new Error("Not authorized to view this dashboard");
    }

    // Convert ObjectIds to strings for client components
    const safeEvent = {
      ...event,
      _id: event._id.toString(),
      organizerId: event.organizerId.toString(),
    };

    const registrations = await Registration.find({ eventId }).lean();
    const approvedRegistrations = registrations.filter((registration) =>
      ["approved", "confirmed"].includes(registration.status),
    );
    const pendingApprovalCount = registrations.filter(
      (registration) => registration.status === "pending",
    ).length;
    const rejectedCount = registrations.filter(
      (registration) => registration.status === "rejected",
    ).length;

    const totalRegistrations = approvedRegistrations.length;
    const checkedInCount = approvedRegistrations.filter((r) => r.checkedIn).length;
    const pendingCount = totalRegistrations - checkedInCount;

    // Revenue calculation (only applicable for paid events)
    let totalRevenue = 0;
    if (event.ticketType === "paid" && event.ticketPrice) {
      totalRevenue = totalRegistrations * event.ticketPrice;
    }

    // Check-in rate
    const checkInRate = totalRegistrations > 0 
      ? Math.round((checkedInCount / totalRegistrations) * 100) 
      : 0;

    // Date logic
    const now = new Date();
    const eventDate = new Date(event.startDate);
    const isEventPast = now > new Date(event.endDate);
    
    // Check if event is today
    const isEventToday = 
      now.getFullYear() === eventDate.getFullYear() &&
      now.getMonth() === eventDate.getMonth() &&
      now.getDate() === eventDate.getDate();

    // Hours until event (if not past)
    let hoursUntilEvent = 0;
    if (!isEventPast) {
      const msDiff = eventDate.getTime() - now.getTime();
      hoursUntilEvent = Math.max(0, Math.floor(msDiff / (1000 * 60 * 60)));
    }

    const stats = {
      totalRegistrations,
      checkedInCount,
      pendingCount,
      pendingApprovalCount,
      rejectedCount,
      capacity: event.capacity,
      totalRevenue,
      checkInRate,
      isEventPast,
      isEventToday,
      hoursUntilEvent,
    };

    return {
      event: safeEvent,
      stats,
    };
  } catch (error) {
    console.error("Error in getEventDashboard:", error);
    throw new Error(error.message || "Failed to fetch event dashboard data");
  }
}

/**
 * Delete an event and all associated registrations
 */
export async function deleteEvent(args) {
  try {
    const { eventId } = args;

    if (!eventId) {
      throw new Error("Event ID is required");
    }

    // Auth check
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await connectDB();

    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found");

    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Ownership check — only the organizer can delete
    if (event.organizerId.toString() !== user._id.toString()) {
      throw new Error("Not authorized to delete this event");
    }

    // Delete all registrations for this event
    await Registration.deleteMany({ eventId });

    // Delete the event itself
    await Event.findByIdAndDelete(eventId);

    // Decrement free event counter
    if (event.ticketType === "free" && user.freeEventsCreated > 0) {
      user.freeEventsCreated -= 1;
      await user.save();
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteEvent:", error);
    throw new Error(error.message || "Failed to delete event");
  }
}
