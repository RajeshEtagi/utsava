/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Loader2, X } from "lucide-react";
import { State, City } from "country-state-city";
import { format } from "date-fns";
import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import * as api from "@/lib/api";
import { createLocationSlug } from "@/lib/location-utils";
import { getCategoryIcon } from "@/lib/data";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

// Debounce defined outside component — stable reference, no recreate on render (#5 fix)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default function SearchLocationBar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  const { data: currentUser, isLoading } = useConvexQuery(
    api.users.getCurrentUser
  );

  // #6 fix: use dedicated updateUserLocation instead of completeOnboarding
  const { mutate: updateLocation } = useConvexMutation(
    api.users.updateUserLocation
  );

  const { data: searchResults, isLoading: searchLoading } = useConvexQuery(
    api.search.searchEvents,
    searchQuery.trim().length >= 2 ? { query: searchQuery, limit: 5 } : "skip"
  );

  const indianStates = useMemo(() => State.getStatesOfCountry("IN"), []);

  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  useEffect(() => {
    if (currentUser?.location) {
      setSelectedState(currentUser.location.state || "");
      setSelectedCity(currentUser.location.city || "");
    }
  }, [currentUser, isLoading]);

  const cities = useMemo(() => {
    if (!selectedState) return [];
    const state = indianStates.find((s) => s.name === selectedState);
    if (!state) return [];
    return City.getCitiesOfState("IN", state.isoCode);
  }, [selectedState, indianStates]);

  const debouncedSetQuery = useRef(
    debounce((value) => setSearchQuery(value), 300)
  ).current;

  const handleSearchInput = (e) => {
    const value = e.target.value;
    debouncedSetQuery(value);
    setShowSearchResults(value.length >= 2);
  };

  const handleEventClick = (slug) => {
    setShowSearchResults(false);
    setSearchQuery("");
    router.push(`/events/${slug}`);
  };

  const handleLocationSelect = useCallback(async (city, state) => {
    const slug = createLocationSlug(city, state);

    if (currentUser) {
      try {
        await updateLocation({ city, state, country: "India" });
      } catch (error) {
        console.error("Failed to update location:", error);
      }
    }

    router.push(`/explore/${slug}`);
  }, [currentUser, router, updateLocation]);

  // #11 fix: clear state and city
  const handleClearLocation = useCallback(() => {
    setSelectedState("");
    setSelectedCity("");
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center">
      {/* Search Bar */}
      <div className="relative flex w-full" ref={searchRef}>
        <div className="flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            onChange={handleSearchInput}
            onFocus={() => {
              if (searchQuery.length >= 2) setShowSearchResults(true);
            }}
            className="pl-10 w-full h-9 rounded-none rounded-l-md"
          />
        </div>

        {/* Search Results */}
        {showSearchResults && (
          <div className="absolute top-full mt-2 w-96 bg-background border rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto">
            {searchLoading ? (
              <div className="p-4 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="py-2">
                <p className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                  SEARCH RESULTS
                </p>
                {searchResults.map((event) => (
                  <button
                    key={event._id}
                    onClick={() => handleEventClick(event.slug)}
                    className="w-full px-4 py-3 hover:bg-muted/50 text-left transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-0.5">
                        {getCategoryIcon(event.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium mb-1 line-clamp-1">
                          {event.title}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(event.startDate, "MMM dd")}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.city}
                          </span>
                        </div>
                      </div>
                      {event.ticketType === "free" && (
                        <Badge variant="secondary" className="text-xs">
                          Free
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              // #12 fix: show "no results" message
              <div className="p-4 text-center text-sm text-muted-foreground">
                No events found for &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        )}
      </div>

      {/* State Select */}
      <Select
        value={selectedState}
        onValueChange={(value) => {
          if (value === "__clear__") {
            handleClearLocation();
            return;
          }
          setSelectedState(value);
          setSelectedCity("");
        }}
      >
        <SelectTrigger className="w-32 h-9 border-l-0 rounded-none">
          <SelectValue placeholder="State" />
        </SelectTrigger>
        <SelectContent>
          {/* #11 fix: clear option */}
          <SelectItem value="__clear__">
            <span className="flex items-center gap-1 text-muted-foreground">
              <X className="w-3 h-3" /> All States
            </span>
          </SelectItem>
          {indianStates.map((state) => (
            <SelectItem key={state.isoCode} value={state.name}>
              {state.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* City Select */}
      <Select
        value={selectedCity}
        onValueChange={(value) => {
          setSelectedCity(value);
          if (value && selectedState) {
            handleLocationSelect(value, selectedState);
          }
        }}
        disabled={!selectedState}
      >
        <SelectTrigger className="w-32 h-9 rounded-none rounded-r-md ">
          <SelectValue placeholder="City" />
        </SelectTrigger>
        <SelectContent>
          {cities.map((city) => (
            <SelectItem key={city.name} value={city.name}>
              {city.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
