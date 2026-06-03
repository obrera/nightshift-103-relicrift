# RelicRift Build Log

## Build Metadata

- Project: RelicRift
- Nightshift build: 103
- Timestamp UTC: 2026-06-03T01:21:43Z
- Model: openai/gpt-5.5 via Codex CLI
- Reasoning: n/a
- Starter provenance: `bun x create-seed@latest nightshift-103-relicrift -t bun-react-vite-solana-kit`
- Required dependency: `@obrera/mpl-core-kit-lib@0.0.3`
- Live link: https://relicrift103.colmena.dev

## Scorecard

- Build identity: RelicRift, build 103
- Product fit: player-facing dungeon relic kiosk
- Semi-complex scope: route/core selection, 3-5 modifier sockets, score simulation, first-party SVG/JSON metadata, wallet claim, devnet record verification
- Visual direction: dark arcade kiosk / dungeon terminal shell
- Wallet usage: wallet-ui connection is product-critical and required for claim
- Solana path: wallet-signed MPL Core devnet `createV1`; connected wallet signs as payer, owner, authority, and update authority
- Forbidden APIs: no `@solana/web3.js`, no `@solana/wallet-adapter-react`, no app-level Node `Buffer`
- Deploy target: static nginx container

## Validation Log

- 2026-06-03T01:21:43Z: implementation started from fresh create-seed Solana starter.
- 2026-06-03T01:30:00Z: `bun run check-types` passed.
- 2026-06-03T01:30:00Z: `bun run lint` passed.
- 2026-06-03T01:30:00Z: `bun run smoke` passed.
- 2026-06-03T01:30:00Z: `bun run build` passed.
- 2026-06-03T01:31:35Z: Dokploy compose deployment completed for `relicrift103.colmena.dev`.
- 2026-06-03T01:32:12Z: `curl -I -L --max-time 30 https://relicrift103.colmena.dev` returned HTTP 200.

## Blockers

- Live wallet transaction cannot be executed non-interactively by this agent. Runtime UI implements the actual wallet-signed mint/claim path and smoke validation verifies the claimable composition and Solana integration shape.
- Initial Dokploy deploy attempts failed until the GitHub provider id was attached and Docker install skipped the starter `prepare` script inside the build container. Final deployment succeeded.
