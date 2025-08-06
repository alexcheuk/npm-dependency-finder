"use client";

import { useEffect } from "react";

// Google Analytics Measurement ID - replace with your actual GA4 Measurement ID
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

// Initialize Google Analytics
export function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;

    // Initialize dataLayer if it doesn't exist
    window.dataLayer = window.dataLayer || [];

    // Define gtag function
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };

    // Initialize with current timestamp
    window.gtag("js", new Date());

    // Configure GA with your measurement ID
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }, []);

  // Don't render anything if GA_MEASUREMENT_ID is not set
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `,
        }}
      />
    </>
  );
}
