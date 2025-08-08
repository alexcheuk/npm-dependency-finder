import * as semver from "semver";

export interface SearchParams {
  parentPackage: string;
  parentMinVersion: string;
  childPackage: string;
  childMinVersion: string;
  packageRemoved: boolean;
}

export interface SearchResult {
  success: boolean;
  version?: string;
  message: string;
  details: string[];
}

export async function findCompatibleVersion(
  params: SearchParams
): Promise<SearchResult> {
  const {
    parentPackage,
    parentMinVersion,
    childPackage,
    childMinVersion,
    packageRemoved,
  } = params;

  try {
    // Get all versions of the parent package
    console.log(`🔍 Searching for versions of '${parentPackage}'...`);
    const versions = await getPackageVersions(parentPackage);

    if (!versions.length) {
      return {
        success: false,
        message: `No versions found for package '${parentPackage}'`,
        details: [],
      };
    }

    // Filter versions to only include those >= parentMinVersion
    const filteredVersions = versions.filter((version) => {
      if (!parentMinVersion) return true;
      const normalizedParentMinVersion = normalizeVersion(parentMinVersion);
      const normalizedVersion = normalizeVersion(version);
      return semver.gte(normalizedVersion, normalizedParentMinVersion);
    });

    if (!filteredVersions.length) {
      return {
        success: false,
        message: `No versions of '${parentPackage}' found that are >= ${parentMinVersion}`,
        details: [],
      };
    }

    console.log(
      `Found ${filteredVersions.length} versions >= ${
        parentMinVersion || "any"
      }`
    );

    // Separate stable and pre-release versions
    const stableVersions = filteredVersions.filter(
      (version) => !semver.prerelease(version)
    );
    const preReleaseVersions = filteredVersions.filter((version) =>
      semver.prerelease(version)
    );

    console.log(
      `Prioritizing: ${stableVersions.length} stable versions, ${preReleaseVersions.length} pre-release versions`
    );

    // Try stable versions first, then pre-release versions
    const versionGroups = [
      { versions: stableVersions, type: "stable" },
      { versions: preReleaseVersions, type: "pre-release" },
    ];

    for (const group of versionGroups) {
      if (group.versions.length === 0) continue;

      console.log(
        `Checking ${group.versions.length} ${group.type} versions...`
      );

      for (const version of group.versions) {
        console.log(
          `--- Checking ${parentPackage}@${version} (${group.type}) ---`
        );

        const dependencyResult = await analyzePackageDependencies(
          `${parentPackage}@${version}`,
          childPackage,
          childMinVersion,
          packageRemoved
        );

        if (dependencyResult.success) {
          const versionType =
            group.type === "stable" ? " (stable release)" : " (pre-release)";
          const enhancedMessage = dependencyResult.message.replace(
            /Version ([^\s]+)/,
            `Version $1${versionType}`
          );
          return {
            success: true,
            version,
            message: enhancedMessage,
            details: dependencyResult.details,
          };
        }
      }
    }

    return {
      success: false,
      message: `No compatible version found for the given requirements`,
      details: [],
    };
  } catch (error) {
    console.error("Error in findCompatibleVersion:", error);
    return {
      success: false,
      message: `Error during search: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      details: [],
    };
  }
}

async function getPackageVersions(packageName: string): Promise<string[]> {
  const meta = await fetchPackageMetadata(packageName);
  const versions = Object.keys(meta.versions || {});
  // Sort versions in ascending order
  return versions.sort(semver.compare);
}

interface DependencyAnalysisResult {
  success: boolean;
  message: string;
  details: string[];
}

async function analyzePackageDependencies(
  parentPackageVersion: string,
  childPackage: string,
  childMinVersion: string,
  packageRemoved: boolean
): Promise<DependencyAnalysisResult> {
  // Serverless-friendly analysis using npm registry without spawning processes
  const [parentName, parentVersion] = splitNameAndVersion(parentPackageVersion);
  const traversal = await findChildOccurrencesInTree({
    rootName: parentName,
    rootVersion: parentVersion,
    targetName: childPackage,
    minVersion: childMinVersion,
  });
  const dependencyLines = traversal.matches.map((m) => m.pathString);

  // Condition 1: The child package doesn't exist anywhere in the dependency tree
  if (dependencyLines.length === 0) {
    if (packageRemoved) {
      return {
        success: true,
        message: `✅ SUCCESS: Version ${parentVersion} does not depend on '${childPackage}' anywhere in its dependency tree (package removed condition satisfied).`,
        details: [
          `Package '${childPackage}' is not found in the dependency tree`,
        ],
      };
    } else {
      return {
        success: false,
        message: `❌ Package '${childPackage}' not found in dependency tree`,
        details: [],
      };
    }
  }

  console.log(
    `Found ${dependencyLines.length} instances of '${childPackage}' in the dependency tree:`
  );
  dependencyLines.forEach((line) => console.log(`  ${line}`));

  // Handle OR condition: package removed OR minimum version met
  if (packageRemoved) {
    // When packageRemoved is checked, we accept EITHER:
    // 1. Package is removed (already handled above when dependencyLines.length === 0)
    // 2. OR package exists but meets minimum version requirement (if childMinVersion is provided)

    if (childMinVersion) {
      // Check if ALL instances meet the minimum version requirement
      const versionAnalysis = analyzeVersionRequirements(
        dependencyLines,
        childPackage,
        childMinVersion
      );

      if (versionAnalysis.allValid) {
        return {
          success: true,
          message: `✅ SUCCESS: Version ${parentVersion} - ALL instances of '${childPackage}' meet the minimum version requirement (>= ${childMinVersion}) - minimum version condition satisfied.`,
          details: dependencyLines,
        };
      } else {
        // Neither condition is met: package exists but doesn't meet minimum version
        return {
          success: false,
          message: `❌ Package '${childPackage}' exists but doesn't meet minimum version requirement. Need EITHER package removal OR version >= ${childMinVersion}.`,
          details: versionAnalysis.invalidVersions,
        };
      }
    } else {
      // Only looking for package removal, but package exists
      return {
        success: false,
        message: `❌ Package '${childPackage}' still exists in dependency tree (package removal condition not satisfied).`,
        details: dependencyLines,
      };
    }
  } else {
    // Standard case: only checking minimum version requirement
    const versionAnalysis = analyzeVersionRequirements(
      dependencyLines,
      childPackage,
      childMinVersion
    );

    if (versionAnalysis.allValid) {
      return {
        success: true,
        message: `✅ SUCCESS: Version ${parentVersion} - ALL instances of '${childPackage}' meet the minimum version requirement (>= ${childMinVersion}).`,
        details: dependencyLines,
      };
    } else {
      return {
        success: false,
        message: `❌ Some instances of '${childPackage}' are older than required:`,
        details: versionAnalysis.invalidVersions,
      };
    }
  }
}

// -----------------------
// Registry-based traversal
// -----------------------

type RegistryPackageMeta = {
  name: string;
  versions: Record<
    string,
    {
      name: string;
      version: string;
      dependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    }
  >;
  "dist-tags"?: Record<string, string>;
};

const packageMetaCache = new Map<string, RegistryPackageMeta>();
const versionResolutionCache = new Map<string, string | null>(); // key: name@range

async function fetchPackageMetadata(
  packageName: string
): Promise<RegistryPackageMeta> {
  if (packageMetaCache.has(packageName)) {
    return packageMetaCache.get(packageName)!;
  }

  const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
  const res = await fetch(url, {
    headers: {
      // Smaller response body compared to full metadata
      Accept: "application/vnd.npm.install-v1+json",
    },
    // Vercel/Next fetch will cache per-request unless disabled; that's ok.
  });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch metadata for ${packageName}: ${res.status} ${res.statusText}`
    );
  }
  const json = await res.json();
  packageMetaCache.set(packageName, json);
  return json as RegistryPackageMeta;
}

function splitNameAndVersion(spec: string): [string, string] {
  // Handles scoped packages: @scope/name@1.2.3
  const atIndex = spec.lastIndexOf("@");
  if (atIndex <= 0) {
    throw new Error(`Invalid package spec: ${spec}`);
  }
  const name = spec.slice(0, atIndex);
  const version = spec.slice(atIndex + 1);
  return [name, version];
}

async function resolveVersion(
  name: string,
  range: string
): Promise<string | null> {
  const key = `${name}@${range}`;
  if (versionResolutionCache.has(key)) return versionResolutionCache.get(key)!;
  try {
    const meta = await fetchPackageMetadata(name);
    const allVersions = Object.keys(meta.versions || {});
    // First try stable only
    const stable = allVersions.filter((v) => !semver.prerelease(v));
    let match = semver.maxSatisfying(stable, range);
    if (!match) {
      // Then allow pre-release if needed
      match = semver.maxSatisfying(allVersions, range, {
        includePrerelease: true,
      });
    }
    versionResolutionCache.set(key, match || null);
    return match || null;
  } catch {
    versionResolutionCache.set(key, null);
    return null;
  }
}

type Match = { path: string[]; version: string };
type TraversalResult = {
  matches: Array<{ pathString: string; version: string }>;
  visitedCount: number;
  truncated: boolean;
};

async function findChildOccurrencesInTree(params: {
  rootName: string;
  rootVersion: string;
  targetName: string;
  minVersion?: string;
}): Promise<TraversalResult> {
  const { rootName, rootVersion, targetName } = params;
  const maxNodes = 3000; // guard for serverless
  const queue: Array<{ name: string; version: string; path: string[] }> = [
    {
      name: rootName,
      version: rootVersion,
      path: [`${rootName}@${rootVersion}`],
    },
  ];
  const visited = new Set<string>();
  const matches: Array<{ pathString: string; version: string }> = [];
  let truncated = false;

  while (queue.length) {
    const node = queue.shift()!;
    const key = `${node.name}@${node.version}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (visited.size > maxNodes) {
      truncated = true;
      break;
    }

    // If node itself is the target, record it
    if (node.name === targetName) {
      matches.push({
        pathString: node.path.join(" > "),
        version: node.version,
      });
      // Do not continue from here to avoid counting nested target occurrences under the same path redundantly
      continue;
    }

    // Fetch exact version data
    let meta: RegistryPackageMeta;
    try {
      meta = await fetchPackageMetadata(node.name);
    } catch (e) {
      console.warn(`Metadata fetch failed for ${node.name}:`, e);
      continue;
    }
    const pkg = meta.versions?.[node.version];
    if (!pkg) {
      // Sometimes versions missing (yanked). Skip.
      continue;
    }

    const deps = {
      ...(pkg.dependencies || {}),
      ...(pkg.optionalDependencies || {}),
      // Intentionally ignoring peerDependencies; they are resolved by consumers
    } as Record<string, string>;

    for (const [depName, depRange] of Object.entries(deps)) {
      const resolved = await resolveVersion(depName, depRange);
      if (!resolved) continue;
      const childPath = [...node.path, `${depName}@${resolved}`];
      queue.push({ name: depName, version: resolved, path: childPath });
    }
  }

  return { matches, visitedCount: visited.size, truncated };
}

function normalizeVersion(version: string): string {
  // Handle partial versions like "4" -> "4.0.0", "4.1" -> "4.1.0"
  const parts = version.split(".");
  while (parts.length < 3) {
    parts.push("0");
  }
  return parts.join(".");
}

function analyzeVersionRequirements(
  dependencyLines: string[],
  childPackage: string,
  minVersion: string
): { allValid: boolean; invalidVersions: string[] } {
  const invalidVersions: string[] = [];
  let allValid = true;

  // Normalize the minimum version
  const normalizedMinVersion = normalizeVersion(minVersion);

  for (const line of dependencyLines) {
    // Extract version from line like "├── form-data@4.0.0" or "│   └── form-data@2.5.1"
    const match = line.match(
      new RegExp(`${childPackage}@([\\d\\.]+(?:-[\\w\\.]+)*)`)
    );
    if (!match) continue;

    const depVersion = match[1];
    const normalizedDepVersion = normalizeVersion(depVersion);

    // Check if this version meets the minimum requirement
    if (minVersion && semver.lt(normalizedDepVersion, normalizedMinVersion)) {
      allValid = false;
      invalidVersions.push(line);
    }
  }

  return { allValid, invalidVersions };
}
