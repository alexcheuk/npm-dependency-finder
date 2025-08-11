import { Metadata } from "next";
import { Suspense } from "react";
import { PackageVersionFinder } from "@/components/PackageVersionFinder";
import { StructuredData } from "@/components/StructuredData";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const parentPackage =
    typeof params.parent === "string" ? params.parent : undefined;
  const childPackage =
    typeof params.child === "string" ? params.child : undefined;

  if (parentPackage && childPackage) {
    const title = `${parentPackage} to ${childPackage} Dependency Analysis | npm Version Finder`;
    const description = `Find the earliest ${parentPackage} version where target dependency '${childPackage}' is removed or meets the required version. Resolve vulnerabilities with minimal upgrade impact.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://npm-version-finder.com?parent=${parentPackage}&child=${childPackage}`,
      },
      twitter: {
        title,
        description,
      },
      alternates: {
        canonical: `https://npm-version-finder.com?parent=${parentPackage}&child=${childPackage}`,
      },
    };
  }

  return {
    title: "npm Version Finder - Dependency Breakpoint Finder",
    description:
      "Find the earliest parent package version where a target (direct or transitive) dependency is removed or reaches a required version threshold.",
  };
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const parentPackage =
    typeof params.parent === "string" ? params.parent : undefined;
  const childPackage =
    typeof params.child === "string" ? params.child : undefined;
  const parentMinVersion =
    typeof params.parentVersion === "string" ? params.parentVersion : undefined;
  const childMinVersion =
    typeof params.childVersion === "string" ? params.childVersion : undefined;

  const searchQuery =
    parentPackage && childPackage
      ? {
          parentPackage,
          childPackage,
          parentMinVersion,
          childMinVersion,
        }
      : undefined;

  return (
    <>
      {searchQuery && <StructuredData searchQuery={searchQuery} />}
      <Suspense fallback={<div>Loading...</div>}>
        <PackageVersionFinder />
      </Suspense>
    </>
  );
}
