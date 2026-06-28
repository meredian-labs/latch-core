# @latch/core

`@latch/core` is the shared audit, policy, scanner, risk, cache, and report engine used by Latch tools.

It is intentionally publishable as its own package. `latchx` depends on it, but core should remain independently testable, demoable, documented, and releasable.

## What It Does

`@latch/core` provides:

- npm package spec parsing
- npm registry metadata resolution
- exact version resolution
- tarball download and integrity verification
- extracted `package/package.json` analysis
- lifecycle script and bin detection
- dependency counting
- recursive file scanning
- suspicious pattern detection
- previous-version diff
- risk scoring
- policy evaluation
- local audit report cache
- human-readable and JSON report primitives
- npm execution helper used by `latchx`

## What It Does Not Do

Core does not own CLI UX.

Core should not:

- prompt users,
- implement Cloud auth,
- upload reports,
- create dashboards,
- implement sandboxing,
- directly publish packages,
- or become a full package manager.

## Development

```bash
npm install
npm run typecheck
npm run build
npm test
npm run demo
npm run pack:dry-run
```

## Dogfooding

Core dogfooding focuses on deterministic local tests and fixture-based behavior.

See `docs/dogfood-results.md`.

## Policy Examples

Example policies live in `examples/policies`.

They are plain JSON and map to the exported `LatchPolicy` type.

## Release

Core is published before packages that depend on it.

See `docs/release/core-v0.1.md`.
