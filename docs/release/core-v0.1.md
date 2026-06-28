# @latch/core v0.1 Release Checklist

## Metadata

Verify `package.json` includes:

- `name`: `@latch/core`
- `version`: `0.1.0`
- `description`
- `license`
- `repository`
- `keywords`
- `files`
- `publishConfig.access`

## Validation

```bash
npm install
npm run typecheck
npm run build
npm test
npm run demo
npm pack --dry-run
```

Confirm the packed tarball includes:

- `dist/`
- `README.md`
- `CHANGELOG.md`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `LICENSE`
- `docs/`
- `examples/`
- `package.json`

## Publish Order

Publish `@latch/core` before publishing `@latch/latchx`.
