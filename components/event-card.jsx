"use client";

import { Calendar, MapPin, Users, Trash2, X, Ticket, Eye } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { getCategoryIcon, getCategoryLabel, getSubCategoryLabel } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function EventCard({
  event,
  onClick,
  onDelete,
  variant = "grid", // "grid" or "list"
  action = null, // "event" | "ticket" | null
  className = "",
  currentUser = null, // Added to check for ownership
}) {
  const isOwner = currentUser && (currentUser._id === event.organizerId || currentUser.id === event.organizerId);

  // List variant (compact horizontal layout)
  if (variant === "list") {
    return (
      <Card
        className={`py-0 group cursor-pointer hover:shadow-sm hover:border-gray-300 dark:hover:border-zinc-700 transition-none ${className}`}
        onClick={onClick}
      >
        <CardContent className="p-3 flex gap-3">
          {/* Event Image */}
          <div className="w-20 h-20 rounded-lg shrink-0 overflow-hidden relative">
            {event.coverImage ? (
              <Image
                src={event.coverImage}
                alt={event.title}
                fill
                className="object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center text-3xl"
                style={{ backgroundColor: event.themeColor }}
              >
                {getCategoryIcon(event.category)}
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {getCategoryLabel(event.category)}
              </span>
              {event.subCategory && (
                <>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {getSubCategoryLabel(event.category, event.subCategory)}
                  </span>
                </>
              )}
            </div>
            <h3 className="font-semibold text-sm mb-1 line-clamp-2">
              {event.title}
              {isOwner && (
                <span className="ml-2 inline-flex items-center rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-zinc-300 ring-1 ring-inset ring-slate-200 dark:ring-zinc-700 whitespace-nowrap align-middle">
                  Created by You
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground mb-1">
              {format(event.startDate, "EEE, dd MMM, HH:mm")}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <MapPin className="w-3 h-3" />
              <span className="line-clamp-1">
                {event.locationType === "online" ? "Online Event" : event.city}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{event.registrationCount} attending</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid variant (default - original design)
  return (
    <Card
      className={`overflow-hidden group pt-0 ${onClick ? "cursor-pointer hover:shadow-sm hover:border-gray-300 dark:hover:border-zinc-700 transition-none" : ""} ${className}`}
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden">
        {event.coverImage ? (
          <Image
            src={event.coverImage}
            alt={event.title}
            className="w-full h-full object-cover"
            width={500}
            height={192}
            priority
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-4xl"
            style={{ backgroundColor: event.themeColor }}
          >
            {getCategoryIcon(event.category)}
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary">
            {event.ticketType === "free" ? "Free" : "Paid"}
          </Badge>
        </div>
      </div>

      <CardContent className="space-y-3">
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="outline">
              {getCategoryIcon(event.category)} {getCategoryLabel(event.category)}
            </Badge>
            {event.subCategory && (
              <Badge variant="secondary">
                {getSubCategoryLabel(event.category, event.subCategory)}
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-lg line-clamp-2 text-foreground">
            {event.title}
          </h3>
          {isOwner && (
            <div className="mt-1">
              <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-1 text-xs font-medium text-slate-700 dark:text-zinc-300 ring-1 ring-inset ring-slate-200 dark:ring-zinc-700">
                Created by You
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{format(event.startDate, "PPP")}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">
              {event.locationType === "online"
                ? "Online Event"
                : `${event.city}, ${event.state || event.country}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>
              {event.registrationCount} / {event.capacity} registered
            </span>
          </div>
        </div>

        {action && (
          <div className="flex gap-2 pt-2">
            {/* Primary button */}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(e);
              }}
            >
              {action === "event" ? (
                <>
                  <Eye className="w-4 h-4" />
                  View
                </>
              ) : (
                <>
                  <Ticket className="w-4 h-4" />
                  Show Ticket
                </>
              )}
            </Button>

            {/* Secondary button - delete / cancel */}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(event._id);
                }}
              >
                {action === "event" ? (
                  <Trash2 className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
