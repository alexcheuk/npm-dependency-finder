import { Metadata } from 'next'
import { PackageVersionFinder } from "@/components/PackageVersionFinder";
import { StructuredData } from '@/components/structured-data';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const parentPackage = typeof params.parent === 'string' ? params.parent : undefined;
  const childPackage = typeof params.child === 'string' ? params.child : undefined;
  
  if (parentPackage && childPackage) {
    const title = `${parentPackage} to ${childPackage} Dependency Analysis | npm Version Finder`;
    const description = `Find the minimal ${parentPackage} version that satisfies ${childPackage} requirements. Resolve npm vulnerabilities with minimal changelog impact.`;
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://npm-version-finder.dev?parent=${parentPackage}&child=${childPackage}`,
      },
      twitter: {
        title,
        description,
      },
      alternates: {
        canonical: `https://npm-version-finder.dev?parent=${parentPackage}&child=${childPackage}`,
      },
    };
  }
  
  return {
    title: 'npm Version Finder - Find Minimal Package Versions',
    description: 'Find the minimal parent npm package version that satisfies child package requirements. Free developer tool for resolving dependency vulnerabilities.',
  };
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const parentPackage = typeof params.parent === 'string' ? params.parent : undefined;
  const childPackage = typeof params.child === 'string' ? params.child : undefined;
  const parentMinVersion = typeof params.parentVersion === 'string' ? params.parentVersion : undefined;
  const childMinVersion = typeof params.childVersion === 'string' ? params.childVersion : undefined;

  const searchQuery = parentPackage && childPackage ? {
    parentPackage,
    childPackage,
    parentMinVersion,
    childMinVersion,
  } : undefined;

  return (
    <>
      {searchQuery && <StructuredData searchQuery={searchQuery} />}
      <PackageVersionFinder />
    </>
  );
}