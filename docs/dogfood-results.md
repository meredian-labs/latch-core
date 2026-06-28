# latch-core Dogfood Results

| Area | Command/Test | Expected | Actual | Issue | Status |
| --- | --- | --- | --- | --- | --- |
| Package spec parsing | `npm test -- packageSpec` | Scoped/unscoped specs parse correctly | Covered by fixture tests | None | Pass |
| Integrity verification | `npm test -- verifyIntegrity` | Integrity and shasum checks pass/fail deterministically | Covered by unit tests | None | Pass |
| Scanner | `npm test -- fileScanner` | Fixture signals are detected without live npm | Covered by fixture tests | None | Pass |
| Policy | `npm test -- evaluatePolicy` | Policy allow/deny decisions are deterministic | Covered by unit tests | None | Pass |
| Demo | `npm run demo` | Build and tests complete | Runs local-only checks | None | Pass |
