import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import * as api from "@/lib/api";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { format } from "date-fns";
import { CheckCircle, Circle, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200",
};

export function AttendeeCard({ registration, onCheckInSuccess }) {
  const { mutate: checkInAttendee, isLoading: isCheckingIn } = useConvexMutation(
    api.registrations.checkInAttendee,
  );
  const { mutate: reviewRegistration, isLoading: isReviewing } =
    useConvexMutation(api.registrations.reviewRegistration);

  const isApproved = ["approved", "confirmed"].includes(registration.status);
  const statusLabel = registration.status === "confirmed" ? "approved" : registration.status;

  const handleManualCheckIn = async () => {
    try {
      const result = await checkInAttendee({ ticketId: registration.qrCode });
      if (result.success) {
        toast.success("Attendee checked in successfully");
        onCheckInSuccess?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to check in attendee");
    }
  };

  const handleReview = async (status) => {
    const action = status === "approved" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${action} this registration?`)) {
      return;
    }

    try {
      await reviewRegistration({ registrationId: registration._id, status });
      toast.success(`Registration ${status}.`);
      onCheckInSuccess?.();
    } catch (error) {
      toast.error(error.message || `Failed to ${action} registration`);
    }
  };

  return (
    <Card className="py-0">
      <CardContent className="p-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className={`mt-1 p-2 rounded-full ${
            registration.checkedIn ? "bg-green-100" : "bg-gray-100"
          }`}
        >
          {registration.checkedIn ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold">{registration.attendeeName}</h3>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                STATUS_STYLES[registration.status] || STATUS_STYLES.pending
              }`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {registration.attendeeEmail}
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            <span
              className={
                registration.checkedIn
                  ? "text-green-600 font-semibold"
                  : "text-muted-foreground"
              }
            >
              {registration.checkedIn ? "Checked in" : "Registered"}{" "}
              {registration.checkedIn && registration.checkedInAt
                ? format(new Date(registration.checkedInAt), "PPp")
                : format(new Date(registration.createdAt), "PPp")}
            </span>
            <span className="font-mono text-muted-foreground">
              Ticket ID: {registration.qrCode}
            </span>
          </div>
          {registration.reviewedAt && (
            <p className="mt-2 text-xs text-muted-foreground">
              {statusLabel === "approved" ? "Approved" : "Rejected"} by{" "}
              {registration.reviewedByName || registration.reviewedBy?.name || "Organizer"} on{" "}
              {format(new Date(registration.reviewedAt), "PPp")}
            </p>
          )}
        </div>

        {registration.status === "pending" && (
          <div className="flex gap-2 sm:flex-col">
            <Button
              size="sm"
              onClick={() => handleReview("approved")}
              disabled={isReviewing}
              className="gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReview("rejected")}
              disabled={isReviewing}
              className="gap-2 text-red-600 hover:text-red-700"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
          </div>
        )}

        {isApproved && !registration.checkedIn && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualCheckIn}
            disabled={isCheckingIn}
            className="gap-2"
          >
            {isCheckingIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Check In
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
