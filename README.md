<div align="center">
	<h1>npm Version Finder (Web) &middot; <code>find-dep-breakpoint</code> CLI</h1>
	<p>Find the earliest parent package version where a target (direct or transitive) dependency is <strong>removed</strong> or meets a required <strong>version threshold</strong>.</p>
	<p>
		<a href="https://npm-version-finder.com">Web App</a>
		·
		<a href="#cli">CLI</a>
		·
		<a href="#programmatic-api">API</a>
	</p>
</div>

---

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Why](#why)
- [Features](#features)
- [Quick Start](#quick-start)
  - [Web](#web)
  - [CLI (npx)](#cli-npx)
  - [Example Output](#example-output)
- [CLI](#cli)
- [Web Query Parameters](#web-query-parameters)
- [How It Works](#how-it-works)
- [Limitations \& Scope](#limitations--scope)
- [Development](#development)
- [Contributing](#contributing)
  - [Style \& Guidelines](#style--guidelines)
- [Roadmap](#roadmap)
- [Security](#security)
- [License](#license)

## Why

When addressing a vulnerability or needing a specific transitive dependency version, blindly upgrading the top-level package can introduce unnecessary breaking changes. This tool computes the **earliest (minimal) parent version** that satisfies one of these conditions for a target dependency:

1. The dependency is removed entirely (no longer present anywhere in the tree), or
2. All occurrences meet a minimum version requirement.

It helps you apply the **smallest upgrade surface** to satisfy policy, security, or compatibility constraints.

## Features

- Earliest qualifying parent version (stable prioritized over pre-release).
- Three requirement modes:
	- Minimum version
	- Removed
	- Removed OR minimum version (breakpoint / threshold logic)
- Traverses dependency graph via npm registry metadata (no local install needed).
- Supports scoped packages and pre-release versions.
- CLI with colored output + `--no-color` flag.
- Web UI: shareable permalinks, dark/light theme, structured data (SEO), analytics-friendly.
- In-memory caching of package metadata & version resolutions for efficiency.

## Quick Start

### Web
Open: https://npm-version-finder.com

Enter:
1. Parent package (e.g. `auth0`)
2. Parent minimum version (optional)
3. Target dependency (e.g. `form-data`)
4. Target minimum version (optional depending on mode)
5. Requirement mode (Min / Min OR Removed / Removed)

### CLI (npx)

```
npx find-dep-breakpoint axios@1 form-data@4 --removed
```

If published locally (dev mode):

```
npm run build:cli
npm link
find-dep-breakpoint axios@1 form-data@4
```

### Example Output

```
✔ Result

✅ SUCCESS: Version 1.0.0 (stable release) - ALL instances of 'form-data' meet the minimum version requirement (>= 4) - minimum version condition satisfied.
Earliest parent version: axios@1.0.0

Dependency occurrences (1):
	axios@1.0.0 > form-data@4.0.4
```

## CLI

Command syntax:

```
find-dep-breakpoint <parent@minVersion?> <target@minVersion?> [options]
```

Options:

| Option       | Alias | Description                                                      |
| ------------ | ----- | ---------------------------------------------------------------- |
| `--removed`  | `-r`  | Accept removal OR minimum version satisfaction (breakpoint mode) |
| `--no-color` | —     | Disable ANSI colors (or set `NO_COLOR=1`)                        |
| `--help`     | `-h`  | Show help                                                        |

Positional arguments:

| Argument             | Meaning                                                                    | Examples                          |
| -------------------- | -------------------------------------------------------------------------- | --------------------------------- |
| `parent@minVersion?` | Parent package (optionally with a starting minimal version to search from) | `react@18`, `express`, `lodash@4` |
| `target@minVersion?` | Target dependency + optional min version                                   | `form-data@4`, `uuid@9`           |

Exit codes:

| Code | Meaning                               |
| ---- | ------------------------------------- |
| 0    | Success (criteria met)                |
| 1    | Usage error / invalid args            |
| 2    | Completed search but criteria not met |
| 99   | Unexpected internal error             |

## Web Query Parameters

You can deep link using URL params (all optional except `parent` & `child`):

| Param           | Description                                                           | Example               |
| --------------- | --------------------------------------------------------------------- | --------------------- |
| `parent`        | Parent package name                                                   | `parent=axios`        |
| `parentVersion` | Minimum parent version to start from                                  | `parentVersion=1.0.0` |
| `child`         | Target dependency name                                                | `child=form-data`     |
| `childVersion`  | Minimum target dependency version                                     | `childVersion=4.0.0`  |
| `removed`       | If `true`, removed OR (if childVersion set) version criterion allowed | `removed=true`        |

Example:
```
https://npm-version-finder.com?parent=axios&parentVersion=1&child=form-data&childVersion=4&removed=true
```

## How It Works

1. Fetches npm registry metadata (`Accept: application/vnd.npm.install-v1+json`) for the parent package.
2. Enumerates versions >= specified parent minimum.
3. Tries stable versions first, then pre-releases.
4. For each version: breadth-first traversal of dependency graph (regular + optional deps; peer deps ignored as they are resolved by consumers).
5. Collects all occurrences of the target dependency.
6. Evaluates success criteria (removal, minimum version met, or combined logic).
7. Returns immediately on first satisfying parent version.

Caching: An in-memory `Map` caches package metadata and version resolutions within a single process invocation (ephemeral on serverless cold start).

## Limitations & Scope

- No persistent or distributed cache (only per-process memory).
- Ignores peerDependencies (intentional) & devDependencies (not part of published tree).
- Does not currently output JSON from CLI (planned `--json`).
- Large graphs guarded by a node cap (defaults in code) for serverless safety.
- Pre-release versions only considered after stable set.

## Development

Prerequisites: Node.js >= 18.

Install & run web:
```
npm install
npm run dev
```

Build CLI:
```
npm run build:cli
```

Link CLI locally:
```
npm link
find-dep-breakpoint react@18 react-dom@18
```

Build both (web + CLI):
```
npm run build
```

## Contributing

Contributions welcome!

1. Open an issue describing enhancement / bug.
2. Fork & create a feature branch (`feat/short-description`).
3. Keep changes focused; add tests if functionality changes (test harness TBD).
4. Run lint/type-check before PR:
	 ```
	 npm run lint
	 npm run type-check
	 ```
5. Submit PR; reference issue number. Provide before/after for output-affecting changes.

### Style & Guidelines

- ESM modules only (`"type": "module"`).
- Prefer minimal deps; avoid heavy graph libraries.
- User-facing messages: concise, actionable, no stack traces unless debug context.
- Commit format: conventional style (e.g. `feat: add --json flag`).

## Roadmap

- [ ] `--json` CLI output mode
- [ ] `--verbose` / `--quiet` flags
- [ ] Multi-target analysis (`find-dep-breakpoint axios@1 form-data@4 mime@3`)
- [ ] Persistent caching (KV / Redis) option
- [ ] Web UI: result diffing & export
- [ ] GitHub Action integration (CI advisory resolution check)
- [ ] Package badges (npm monthly downloads, etc.)
- [ ] Optional peer dependency evaluation mode

## Security

No code execution—only registry metadata fetches. Still, if you discover a security concern, please open a private issue or contact the maintainer before public disclosure.

## License

MIT © 2025-present. See `LICENSE` (to be added if not already present).

---

If this saved you time, consider starring the repo or sharing it. Feedback & ideas welcome! 🚀

