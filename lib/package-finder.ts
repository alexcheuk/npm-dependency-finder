import { spawn } from 'child_process';
import * as semver from 'semver';

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

export async function findCompatibleVersion(params: SearchParams): Promise<SearchResult> {
  const { parentPackage, parentMinVersion, childPackage, childMinVersion, packageRemoved } = params;
  
  try {
    // Get all versions of the parent package
    console.log(`🔍 Searching for versions of '${parentPackage}'...`);
    const versions = await getPackageVersions(parentPackage);
    
    if (!versions.length) {
      return {
        success: false,
        message: `No versions found for package '${parentPackage}'`,
        details: []
      };
    }

    // Filter versions to only include those >= parentMinVersion
    const filteredVersions = versions.filter(version => {
      if (!parentMinVersion) return true;
      const normalizedParentMinVersion = normalizeVersion(parentMinVersion);
      const normalizedVersion = normalizeVersion(version);
      return semver.gte(normalizedVersion, normalizedParentMinVersion);
    });

    if (!filteredVersions.length) {
      return {
        success: false,
        message: `No versions of '${parentPackage}' found that are >= ${parentMinVersion}`,
        details: []
      };
    }

    console.log(`Found ${filteredVersions.length} versions >= ${parentMinVersion || 'any'}`);

    // Separate stable and pre-release versions
    const stableVersions = filteredVersions.filter(version => !semver.prerelease(version));
    const preReleaseVersions = filteredVersions.filter(version => semver.prerelease(version));

    console.log(`Prioritizing: ${stableVersions.length} stable versions, ${preReleaseVersions.length} pre-release versions`);

    // Try stable versions first, then pre-release versions
    const versionGroups = [
      { versions: stableVersions, type: 'stable' },
      { versions: preReleaseVersions, type: 'pre-release' }
    ];

    for (const group of versionGroups) {
      if (group.versions.length === 0) continue;
      
      console.log(`Checking ${group.versions.length} ${group.type} versions...`);
      
        for (const version of group.versions) {
          console.log(`--- Checking ${parentPackage}@${version} (${group.type}) ---`);
          
          const dependencyResult = await analyzePackageDependencies(
            `${parentPackage}@${version}`,
            childPackage,
            childMinVersion,
            packageRemoved
          );

          if (dependencyResult.success) {
            const versionType = group.type === 'stable' ? ' (stable release)' : ' (pre-release)';
            const enhancedMessage = dependencyResult.message.replace(
              /Version ([^\s]+)/,
              `Version $1${versionType}`
            );
            return {
              success: true,
              version,
              message: enhancedMessage,
              details: dependencyResult.details
            };
          }
        }
      }

    return {
      success: false,
      message: `No compatible version found for the given requirements`,
      details: []
    };

  } catch (error) {
    console.error('Error in findCompatibleVersion:', error);
    return {
      success: false,
      message: `Error during search: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: []
    };
  }
}

async function getPackageVersions(packageName: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const npmProcess = spawn('npm', ['view', packageName, 'versions', '--json'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    npmProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    npmProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    npmProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`npm view failed: ${stderr}`));
        return;
      }

      try {
        const versions = JSON.parse(stdout);
        // npm returns either an array or a single string
        const versionArray = Array.isArray(versions) ? versions : [versions];
        // Sort versions in ascending order
        const sortedVersions = versionArray.sort((a, b) => semver.compare(a, b));
        resolve(sortedVersions);
      } catch (error) {
        reject(new Error(`Failed to parse npm output: ${error}`));
      }
    });
  });
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
  
  // Try npm ls method first (more reliable in Node.js environment)
  const dependencyLines = await getDependencyLines(parentPackageVersion, childPackage);
  
  // Condition 1: The child package doesn't exist anywhere in the dependency tree
  if (dependencyLines.length === 0) {
    if (packageRemoved) {
      return {
        success: true,
        message: `✅ SUCCESS: Version ${parentPackageVersion.split('@')[1]} does not depend on '${childPackage}' anywhere in its dependency tree (package removed condition satisfied).`,
        details: [`Package '${childPackage}' is not found in the dependency tree`]
      };
    } else {
      return {
        success: false,
        message: `❌ Package '${childPackage}' not found in dependency tree`,
        details: []
      };
    }
  }

  console.log(`Found ${dependencyLines.length} instances of '${childPackage}' in the dependency tree:`);
  dependencyLines.forEach(line => console.log(`  ${line}`));

  // Handle OR condition: package removed OR minimum version met
  if (packageRemoved) {
    // When packageRemoved is checked, we accept EITHER:
    // 1. Package is removed (already handled above when dependencyLines.length === 0)
    // 2. OR package exists but meets minimum version requirement (if childMinVersion is provided)
    
    if (childMinVersion) {
      // Check if ALL instances meet the minimum version requirement
      const versionAnalysis = analyzeVersionRequirements(dependencyLines, childPackage, childMinVersion);
      
      if (versionAnalysis.allValid) {
        return {
          success: true,
          message: `✅ SUCCESS: Version ${parentPackageVersion.split('@')[1]} - ALL instances of '${childPackage}' meet the minimum version requirement (>= ${childMinVersion}) - minimum version condition satisfied.`,
          details: dependencyLines
        };
      } else {
        // Neither condition is met: package exists but doesn't meet minimum version
        return {
          success: false,
          message: `❌ Package '${childPackage}' exists but doesn't meet minimum version requirement. Need EITHER package removal OR version >= ${childMinVersion}.`,
          details: versionAnalysis.invalidVersions
        };
      }
    } else {
      // Only looking for package removal, but package exists
      return {
        success: false,
        message: `❌ Package '${childPackage}' still exists in dependency tree (package removal condition not satisfied).`,
        details: dependencyLines
      };
    }
  } else {
    // Standard case: only checking minimum version requirement
    const versionAnalysis = analyzeVersionRequirements(dependencyLines, childPackage, childMinVersion);
    
    if (versionAnalysis.allValid) {
      return {
        success: true,
        message: `✅ SUCCESS: Version ${parentPackageVersion.split('@')[1]} - ALL instances of '${childPackage}' meet the minimum version requirement (>= ${childMinVersion}).`,
        details: dependencyLines
      };
    } else {
      return {
        success: false,
        message: `❌ Some instances of '${childPackage}' are older than required:`,
        details: versionAnalysis.invalidVersions
      };
    }
  }
}

async function getDependencyLines(parentPackageVersion: string, childPackage: string): Promise<string[]> {
  return new Promise((resolve) => {
    // Create a temporary directory and install the package
    const tempDir = `/tmp/npm-dep-analysis-${Date.now()}`;
    
    const setupProcess = spawn('bash', ['-c', `
      mkdir -p "${tempDir}" && 
      cd "${tempDir}" && 
      npm init -y > /dev/null 2>&1 && 
      npm install "${parentPackageVersion}" > /dev/null 2>&1 && 
      npm ls --all 2>/dev/null | grep "${childPackage}@" || true
    `], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';

    setupProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    setupProcess.stderr.on('data', () => {
      // Ignore stderr for this implementation
    });

    setupProcess.on('close', () => {
      // Clean up temp directory
      spawn('rm', ['-rf', tempDir]);

      const lines = stdout
        .split('\n')
        .filter(line => line.includes(`${childPackage}@`))
        .map(line => line.trim())
        .filter(line => line.length > 0);

      resolve(lines);
    });
  });
}

function normalizeVersion(version: string): string {
  // Handle partial versions like "4" -> "4.0.0", "4.1" -> "4.1.0"
  const parts = version.split('.');
  while (parts.length < 3) {
    parts.push('0');
  }
  return parts.join('.');
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
    const match = line.match(new RegExp(`${childPackage}@([\\d\\.]+(?:-[\\w\\.]+)*)`));
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