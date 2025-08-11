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
      "Find the earliest parent package version where a target dependency is removed or meets a required version threshold.",
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
      "Find the earliest parent package version where a target (direct or transitive) dependency is removed or upgraded.",
    url: "https://npm-version-finder.com",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Find earliest compatible parent version",
      "Target dependency removal or version threshold",
      "Resolve vulnerabilities with minimal upgrade",
      "Stable & pre-release prioritization",
      "Permalink & shareable search URLs",
      "CLI: find-dep-breakpoint",
      "Dark / light theme",
    ],
  };

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "npm Version Finder",
    description:
      "Developer tool to compute the earliest parent version where a target dependency is removed or meets a version requirement.",
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
          text: "npm Version Finder helps you identify the earliest parent package version where a target (direct or transitive) dependency is removed or upgraded to a safe / required version, reducing unnecessary upgrades while fixing issues.",
        },
      },
      {
        "@type": "Question",
        name: "How does it help with vulnerability resolution?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It locates the earliest satisfying version, minimizing breaking changes while still resolving security advisories or policy constraints.",
        },
      },
      {
        "@type": "Question",
        name: "Is it free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. 100% free to use. No registration required.",
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
    {
      "@context": "https://schema.org",
      "@type": "SoftwareSourceCode",
      name: "find-dep-breakpoint CLI",
      codeRepository: "https://github.com/alexcheuk/npm-dependency-finder",
      programmingLanguage: "TypeScript",
      runtimePlatform: "Node.js >= 18",
      operatingSystem: "Any",
      description:
        "CLI and web tool to compute earliest parent package version where a target dependency is removed or meets a version threshold (minimal upgrade breakpoint).",
      keywords:
        "npm, dependency analysis, transitive dependency, vulnerability, minimal upgrade, breakpoint, find earliest version",
      license: "https://opensource.org/licenses/MIT",
    },
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
