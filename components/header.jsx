"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Building, Crown, Plus, Ticket } from "lucide-react";
import { SignInButton, useAuth, UserButton, useUser } from "@clerk/nextjs";
import { BarLoader } from "react-spinners";
import SearchLocationBar from "./search-location-bar";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Badge } from "./ui/badge";

export default function Header() {
  const { has } = useAuth();
  const { isLoaded, isSignedIn } = useUser();
  const hasPro = has?.({ plan: "pro" });

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-zinc-950 z-20 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={500}
              height={500}
              className="w-full h-11"
              priority
            />
            {/* <span className="text-purple-500 text-2xl font-bold">spott*</span> */}
            {hasPro && (
              <Badge
                variant="secondary"
                className="gap-1 ml-3 bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                <Crown className="w-3 h-3" />
                Pro
              </Badge>
            )}
          </Link>

          {/* Search & Location - Desktop Only */}
          <div className="hidden md:flex flex-1 justify-center">
            <SearchLocationBar />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center">
            {/* Show Pro badge or Upgrade button */}
            <Button variant="ghost" size="sm" asChild className={"mr-2"}>
              <Link href="/explore">Explore</Link>
            </Button>

            {isLoaded && isSignedIn ? (
              <>
                {/* My Events Button (Desktop Quick Access) */}
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="mr-2 hidden sm:flex gap-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <Link href="/my-events">
                    <Building className="w-4 h-4" />
                    My Events
                  </Link>
                </Button>

                {/* Create Event Button */}
                <Button size="sm" asChild className="flex gap-2 mr-4">
                  <Link href="/create-event">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create Event</span>
                  </Link>
                </Button>

                <div className="border border-gray-200 dark:border-zinc-800 rounded-full bg-white dark:bg-zinc-900 overflow-hidden flex items-center justify-center p-[2px]">
                  <UserButton
                    afterSignOutUrl="/"
                    userProfileMode="modal"
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8 rounded-full",
                      },
                    }}
                  >
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="My Tickets"
                        labelIcon={<Ticket size={16} />}
                        href="/my-tickets"
                      />
                      <UserButton.Link
                        label="My Events"
                        labelIcon={<Building size={16} />}
                        href="/my-events"
                      />
                      <UserButton.Action label="manageAccount" />
                    </UserButton.MenuItems>
                  </UserButton>
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="mr-2">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button variant="secondary" size="sm" asChild>
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </>
            )}

          </div>
        </div>

        {/* Mobile Search & Location - Below Header */}
        <div className="md:hidden border-t px-3 py-3">
          <SearchLocationBar />
        </div>
      </nav>

    </>
  );
}
