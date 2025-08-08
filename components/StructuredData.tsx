import Script from "next/script";

interface StructuredDataProps {
  searchQuery?: {
    parentPackage: string;
    childPackage: string;
    parentMinVersion?: string;
    childMinVersion?: string;
  };
}

export function StructuredData({ searchQuery }: StructuredDataProps) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "npm Version Finder",
    description:
      "Find the minimal parent npm package version that satisfies child package requirements. Resolve vulnerabilities with minimal changelog impact.",
    url: "https://npm-version-finder.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://npm-version-finder.com?parent={parent_package}&child={child_package}",
      },
      "query-input": "required name=parent_package",
    },
  };

  const webApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "npm Version Finder",
    description:
      "Find the minimal parent npm package version that satisfies child package requirements",
    url: "https://npm-version-finder.com",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Find compatible npm package versions",
      "Resolve dependency vulnerabilities",
      "Minimal changelog impact",
      "Stable and pre-release version support",
      "Permalink sharing",
      "Dark/light theme support",
    ],
  };

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "npm Version Finder",
    description:
      "Developer tool for finding minimal npm package versions that satisfy dependency requirements",
    url: "https://npm-version-finder.com",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: "npm Version Finder",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is npm Version Finder?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "npm Version Finder is a free developer tool that helps you find the minimal parent npm package version that satisfies child package requirements. It's designed to help resolve vulnerabilities with minimal changelog impact.",
        },
      },
      {
        "@type": "Question",
        name: "How does it help with vulnerability resolution?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "By finding the earliest version that meets your requirements, you can minimize the number of breaking changes while still addressing security vulnerabilities in your dependencies.",
        },
      },
      {
        "@type": "Question",
        name: "Is it free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, npm Version Finder is completely free to use. No registration or payment required.",
        },
      },
    ],
  };

  // Dynamic search action if we have search query
  const searchActionSchema = searchQuery
    ? {
        "@context": "https://schema.org",
        "@type": "SearchAction",
        target: `https://npm-version-finder.com?parent=${searchQuery.parentPackage}&child=${searchQuery.childPackage}`,
        query: `${searchQuery.parentPackage} ${searchQuery.childPackage}`,
        object: {
          "@type": "Thing",
          name: `${searchQuery.parentPackage} to ${searchQuery.childPackage} dependency analysis`,
        },
      }
    : null;

  const allSchemas = [
    websiteSchema,
    webApplicationSchema,
    softwareApplicationSchema,
    faqSchema,
    ...(searchActionSchema ? [searchActionSchema] : []),
  ];

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(allSchemas),
      }}
    />
  );
}
