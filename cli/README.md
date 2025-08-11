# find-dep-breakpoint CLI

Usage:

```
npx find-dep-breakpoint <parent@minVersion?> <child@minVersion?> [--removed]
```

Examples:
```
npx find-dep-breakpoint auth0@3 form-data@4
npx find-dep-breakpoint auth0@3 form-data@4 --removed
npx find-dep-breakpoint auth0 form-data@4 --removed
```

Flags:
- `--removed` / `-r`: Accept either removal of the child package or meeting the minimum version requirement.
- `-h` / `--help`: Show help.

Exit codes:
- 0 success (criteria satisfied)
- 1 usage error
- 2 search ran but criteria not met
- 99 unexpected internal error
