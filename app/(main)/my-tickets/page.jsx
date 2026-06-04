/* eslint-disable react-hooks/purity */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar, MapPin, Loader2, Ticket } from "lucide-react";
import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import * as api from "@/lib/api";
import { toast } from "sonner";


import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import EventCard from "@/components/event-card";

export default function MyTicketsPage() {
  const router = useRouter();
  const [selectedTicket, setSelectedTicket] = useState(null);

  const { data: registrations, isLoading } = useConvexQuery(
    api.registrations.getMyRegistrations,
  );

  const { mutate: cancelRegistration, isLoading: isCancelling } =
    useConvexMutation(api.registrations.cancelRegistration);

  const handleCancelRegistration = async (registrationId) => {
    if (!window.confirm("Are you sure you want to cancel this registration?"))
      return;

    try {
      await cancelRegistration(registrationId);
      toast.success("Registration cancelled successfully.");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Failed to cancel registration");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const now = Date.now();

  const getEventTimestamp = (value) => {
    if (value instanceof Date) return value.getTime();
    if (typeof value === "number") return value;
    if (typeof value === "string") return Date.parse(value);
    return NaN;
  };

  const getEventEndTime = (event) => {
    if (!event) return NaN;
    return getEventTimestamp(event.endDate ?? event.startDate);
  };

  const isEventEnded = (event) => {
    const endTime = getEventEndTime(event);
    return Number.isFinite(endTime) && endTime <= now;
  };

  const getStatusLabel = (status) => (status === "confirmed" ? "approved" : status);

  const getStatusClassName = (status) => {
    const normalized = getStatusLabel(status);
    if (normalized === "approved") return "bg-green-100 text-green-800 border-green-200";
    if (normalized === "pending") return "bg-amber-100 text-amber-800 border-amber-200";
    if (normalized === "rejected") return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  // Cancelled registrations are filtered out by the server action.
  const ticketsWithEvents = registrations?.filter((reg) => reg.event) ?? [];

  const upcomingTickets = ticketsWithEvents.filter(
    (reg) => getStatusLabel(reg.status) === "approved" && !isEventEnded(reg.event),
  );

  // Past tickets include active registrations for events that have ended.
  const pastTickets = ticketsWithEvents.filter(
    (reg) => getStatusLabel(reg.status) === "approved" && isEventEnded(reg.event),
  );
  const pendingTickets = ticketsWithEvents.filter((reg) => reg.status === "pending");
  const rejectedTickets = ticketsWithEvents.filter((reg) => reg.status === "rejected");

  return (
    <div className="min-h-screen pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Tickets</h1>
          <p className="text-muted-foreground">
            View and manage your event registrations
          </p>
        </div>

        {/* Upcoming Tickets */}
        {pendingTickets?.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Pending Approval</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingTickets.map((registration) => (
                <EventCard
                  key={registration._id}
                  event={registration.event}
                  action="ticket"
                  onClick={() => setSelectedTicket(registration)}
                  onDelete={() => handleCancelRegistration(registration._id)}
                />
              ))}
            </div>
          </div>
        )}

        {upcomingTickets?.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingTickets.map((registration) => (
                <EventCard
                  key={registration._id}
                  event={registration.event}
                  action="ticket"
                  onClick={() => setSelectedTicket(registration)}
                  onDelete={!registration.checkedIn ? () => handleCancelRegistration(registration._id) : null}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past Tickets */}
        {pastTickets?.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Past Events</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastTickets.map((registration) => (
                <EventCard
                  key={registration._id}
                  event={registration.event}
                  action="ticket"
                  onClick={() => setSelectedTicket(registration)}
                  className="opacity-60"
                />
              ))}
            </div>
          </div>
        )}

        {rejectedTickets?.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Rejected Registrations</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rejectedTickets.map((registration) => (
                <EventCard
                  key={registration._id}
                  event={registration.event}
                  action="ticket"
                  onClick={() => setSelectedTicket(registration)}
                  className="opacity-70"
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!pendingTickets?.length &&
          !upcomingTickets?.length &&
          !pastTickets?.length &&
          !rejectedTickets?.length && (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-6xl mb-4">🎟️</div>
              <h2 className="text-2xl font-bold">No tickets yet</h2>
              <p className="text-muted-foreground">
                Register for events to see your tickets here
              </p>
              <Button asChild className="gap-2">
                <Link href="/explore">
                  <Ticket className="w-4 h-4" /> Browse Events
                </Link>
              </Button>
            </div>
          </Card>
          )}
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <Dialog
          open={!!selectedTicket}
          onOpenChange={() => setSelectedTicket(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Your Ticket</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="text-center">
                <Badge className={`mb-3 capitalize ${getStatusClassName(selectedTicket.status)}`}>
                  {getStatusLabel(selectedTicket.status)}
                </Badge>
                <p className="font-semibold mb-1">
                  {selectedTicket.attendeeName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedTicket.event.title}
                </p>
                {selectedTicket.status === "pending" ? (
                  <p className="mt-2 text-sm font-semibold text-amber-700">
                    Your registration is waiting for organizer approval. Participant-only content and check-in will unlock after approval.
                  </p>
                ) : selectedTicket.status === "rejected" ? (
                  <p className="mt-2 text-sm font-semibold text-red-600">
                    This registration was rejected by the organizer. Please contact the organizer if you need help.
                  </p>
                ) : selectedTicket.checkedIn ? (
                  <p className="mt-2 text-sm font-semibold text-green-600">
                    Checked in at{" "}
                    {selectedTicket.checkedInAt
                      ? format(selectedTicket.checkedInAt, "PPp")
                      : "—"}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Not checked in yet
                  </p>
                )}
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Ticket ID</p>
                <p className="font-mono text-sm">{selectedTicket.qrCode}</p>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(selectedTicket.event.startDate, "PPP, h:mm a")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {selectedTicket.event.locationType === "online"
                      ? "Online Event"
                      : `${selectedTicket.event.city}, ${
                          selectedTicket.event.state ||
                          selectedTicket.event.country
                        }`}
                  </span>
                </div>
              </div>

            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
