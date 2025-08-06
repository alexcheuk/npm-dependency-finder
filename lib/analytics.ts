// Analytics utilities and hooks
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js" | "set",
      targetId: string | Date | object,
      config?: object
    ) => void;
    dataLayer: Array<unknown>;
  }
}

// Hook to track page views
export function useGoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag)
      return;

    const url = pathname + (searchParams ? `?${searchParams}` : "");

    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
      page_title: document.title,
    });
  }, [pathname, searchParams]);
}

// Function to track custom events
export function trackEvent(
  eventName: string,
  parameters?: Record<string, unknown>
) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag)
    return;

  window.gtag("event", eventName, {
    event_category: "npm-version-finder",
    ...parameters,
  });
}

// Custom events for your npm version finder
export const analytics = {
  // Track when users search for package versions
  trackSearch: (parentPackage: string, childPackage: string) => {
    trackEvent("package_search", {
      parent_package: parentPackage,
      child_package: childPackage,
    });
  },

  // Track when results are found
  trackResult: (
    parentPackage: string,
    childPackage: string,
    resultVersion: string
  ) => {
    trackEvent("search_result", {
      parent_package: parentPackage,
      child_package: childPackage,
      result_version: resultVersion,
    });
  },

  // Track when users encounter errors
  trackError: (errorType: string, errorMessage?: string) => {
    trackEvent("search_error", {
      error_type: errorType,
      error_message: errorMessage,
    });
  },

  // Track when users copy results
  trackCopy: (content: string) => {
    trackEvent("copy_result", {
      content_type: content,
    });
  },

  // Track form interactions
  trackFormInteraction: (action: string, field: string) => {
    trackEvent("form_interaction", {
      action: action,
      field: field,
    });
  },
};
