"use client";

import { useParams, useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { useState, useMemo } from "react";
import { Loader2, MapPin } from "lucide-react";
import { useConvexQuery } from "@/hooks/use-convex-query";
import * as api from "@/lib/api";
import { CATEGORIES } from "@/lib/data";
import { parseLocationSlug } from "@/lib/location-utils";
import { Badge } from "@/components/ui/badge";
import EventCard from "@/components/event-card";
import { useUser } from "@clerk/nextjs";

export default function DynamicExplorePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const slug = params.slug;

  // Check if it's a valid category
  const categoryInfo = CATEGORIES.find((cat) => cat.id === slug);
  const isCategory = !!categoryInfo;

  // If not a category, validate location
  const { city, state, isValid } = !isCategory
    ? parseLocationSlug(slug)
    : { city: null, state: null, isValid: true };

  // If it's not a valid category and not a valid location, show 404
  if (!isCategory && !isValid) {
    notFound();
  }

  // Fetch events based on type
  const { data: events, isLoading } = useConvexQuery(
    isCategory
      ? api.explore.getEventsByCategory
      : api.explore.getEventsByLocation,
    isCategory
      ? { category: slug, limit: 50 }
      : city && state
        ? { city, state, limit: 50 }
        : "skip"
  );

  const handleEventClick = (eventSlug) => {
    router.push(`/events/${eventSlug}`);
  };

  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (!selectedSubCategory) return events;
    return events.filter(e => e.subCategory === selectedSubCategory);
  }, [events, selectedSubCategory]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Category View
  if (isCategory) {
    return (
      <>
        <div className="pb-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl">{categoryInfo.icon}</div>
            <div>
              <h1 className="text-5xl md:text-6xl font-bold">
                {categoryInfo.label}
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                {categoryInfo.description}
              </p>
            </div>
          </div>

          {events && events.length > 0 && (
            <p className="text-muted-foreground">
              {events.length} event{events.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>

        {/* Sub-Category Filter Pills */}
        {isCategory && categoryInfo.subCategories && categoryInfo.subCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Badge 
              variant={selectedSubCategory === null ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/90 hover:text-primary-foreground px-4 py-1.5 text-sm"
              onClick={() => setSelectedSubCategory(null)}
            >
              All
            </Badge>
            {categoryInfo.subCategories.map((sub) => (
              <Badge 
                key={sub.id}
                variant={selectedSubCategory === sub.id ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/90 hover:text-primary-foreground px-4 py-1.5 text-sm"
                onClick={() => setSelectedSubCategory(sub.id)}
              >
                {sub.label}
              </Badge>
            ))}
          </div>
        )}

        {filteredEvents && filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                currentUser={user}
                onClick={() => handleEventClick(event.slug)}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            {selectedSubCategory ? "No events found for this sub-category." : "No events found in this category."}
          </p>
        )}
      </>
    );
  }

  // Location View
  return (
    <>
      <div className="pb-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-6xl">📍</div>
          <div>
            <h1 className="text-5xl md:text-6xl font-bold">Events in {city}</h1>
            <p className="text-lg text-muted-foreground mt-2">{state}, India</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-2">
            <MapPin className="w-3 h-3" />
            {city}, {state}
          </Badge>
          {events && events.length > 0 && (
            <p className="text-muted-foreground">
              {events.length} event{events.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>
      </div>

      {filteredEvents && filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              currentUser={user}
              onClick={() => handleEventClick(event.slug)}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">
          No events in {city}, {state} yet.
        </p>
      )}
    </>
  );
}
