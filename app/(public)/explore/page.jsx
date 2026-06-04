"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Users, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useConvexQuery } from "@/hooks/use-convex-query";
import * as api from "@/lib/api";
import { createLocationSlug } from "@/lib/location-utils";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CATEGORIES } from "@/lib/data";
import EventCard from "@/components/event-card";

export default function ExplorePage() {
  const router = useRouter();

  // Fetch current user for location
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);

  // Fetch events
  const { data: featuredEvents, isLoading: loadingFeatured } = useConvexQuery(
    api.explore.getFeaturedEvents,
    { limit: 3 }
  );

  const { data: localEvents, isLoading: loadingLocal } = useConvexQuery(
    api.explore.getEventsByLocation,
    {
      city: currentUser?.location?.city || "Gurugram",
      state: currentUser?.location?.state || "Haryana",
      limit: 4,
    }
  );

  const { data: popularEvents, isLoading: loadingPopular } = useConvexQuery(
    api.explore.getPopularEvents,
    { limit: 6 }
  );

  const { data: categoryCounts } = useConvexQuery(
    api.explore.getCategoryCounts
  );

  const handleEventClick = (slug) => {
    router.push(`/events/${slug}`);
  };

  const handleCategoryClick = (categoryId) => {
    router.push(`/explore/${categoryId}`);
  };

  const handleViewLocalEvents = () => {
    const city = currentUser?.location?.city || "Gurugram";
    const state = currentUser?.location?.state || "Haryana";
    const slug = createLocationSlug(city, state);
    router.push(`/explore/${slug}`);
  };

  // Format categories with counts
  const categoriesWithCounts = CATEGORIES.map((cat) => ({
    ...cat,
    count: categoryCounts?.[cat.id] || 0,
  }));

  // Loading state
  const isLoading = loadingFeatured || loadingLocal || loadingPopular;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Page Header */}
      <div className="mb-10 pb-6 border-b border-border flex flex-col items-start gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Explore Events</h1>
        <p className="text-muted-foreground">
          Browse upcoming events happening near you or discover trending experiences nationwide.
        </p>
      </div>

      {/* Featured Grid (Formerly Carousel) */}
      {featuredEvents && featuredEvents.length > 0 && (
        <div className="mb-14">
          <div className="mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Featured Highlights
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <div
                key={event._id}
                className="group relative flex flex-col h-full bg-card rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleEventClick(event.slug)}
              >
                {/* Image Section */}
                <div className="relative aspect-[16/9] w-full bg-muted overflow-hidden border-b">
                  {event.coverImage ? (
                    <Image
                      src={event.coverImage}
                      alt={event.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: event.themeColor }}
                    />
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="shadow-sm">
                      {event.city}, {event.state || event.country}
                    </Badge>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {event.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                    {event.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm text-foreground/80 mt-auto pt-4 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{format(event.startDate, "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{event.registrationCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_300px] gap-10">
        {/* Main Feed Column */}
        <div className="space-y-14">
          
          {/* Local Events */}
          {localEvents && localEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  Local Events
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-medium"
                  onClick={handleViewLocalEvents}
                >
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localEvents.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    variant="compact"
                    currentUser={currentUser}
                    onClick={() => handleEventClick(event.slug)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Popular Events */}
          {popularEvents && popularEvents.length > 0 && (
            <section>
              <div className="mb-4 border-b border-border pb-2">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  Trending Nationwide
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {popularEvents.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    variant="compact"
                    currentUser={currentUser}
                    onClick={() => handleEventClick(event.slug)}
                  />
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Sidebar Column */}
        <div>
           {/* Browse by Category */}
          <div className="sticky top-24">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Categories
            </h3>
            <div className="flex flex-col gap-2">
              {categoriesWithCounts.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="flex items-center gap-3 p-3 text-left bg-card hover:bg-muted/50 border rounded-md transition-colors text-sm w-full"
                >
                  <span className="text-xl leading-none">{category.icon}</span>
                  <span className="font-medium flex-1">{category.label}</span>
                  <Badge variant="secondary" className="ml-auto text-xs font-normal">
                    {category.count}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!loadingFeatured &&
        !loadingLocal &&
        !loadingPopular &&
        (!featuredEvents || featuredEvents.length === 0) &&
        (!localEvents || localEvents.length === 0) &&
        (!popularEvents || popularEvents.length === 0) && (
          <Card className="p-12 text-center border-dashed bg-muted/20 shadow-none">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 bg-background border rounded-lg flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                <Calendar className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">No events published yet</h2>
              <p className="text-sm text-muted-foreground">
                Check back later or create the first event on the platform.
              </p>
              <div className="pt-4">
                <Button asChild>
                  <a href="/create-event">Create Event</a>
                </Button>
              </div>
            </div>
          </Card>
        )}
    </div>
  );
}
