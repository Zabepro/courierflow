"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

/* Initialise once on first render */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host:             process.env.NEXT_PUBLIC_POSTHOG_HOST,
      ui_host:              "https://us.posthog.com",
      person_profiles:      "identified_only",
      capture_pageview:     false,   // handled manually via PostHogPageView
      capture_pageleave:    true,
      session_recording: {
        maskAllInputs:    false,
        maskInputOptions: { password: true },
      },
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

/* Identify Clerk user to PostHog so events are tied to a real person */
export function PostHogIdentify() {
  const ph = usePostHog();
  const { userId }           = useAuth();
  const { user, isLoaded }   = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (userId && user) {
      ph.identify(userId, {
        email:      user.primaryEmailAddress?.emailAddress,
        name:       user.fullName,
        created_at: user.createdAt,
      });
    } else {
      ph.reset();
    }
  }, [ph, userId, user, isLoaded]);

  return null;
}
