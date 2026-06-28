# Contributing To latch-core

Core is an independent primary package.

Changes should preserve stable behavior for:

- report shape,
- policy evaluation,
- risk scoring semantics,
- cache key behavior,
- package spec parsing,
- tarball integrity checks.

## Checks

```bash
npm run typecheck
npm run build
npm test
npm run demo
```

## Fixtures

Prefer fixture-based tests over live registry tests.

Fixtures live under:

```txt
fixtures/packages/
```

## Scope

Do not add CLI prompts, Cloud upload behavior, UI code, or package-manager behavior to core.
