# RelicRift 103

RelicRift is Nightshift build 103: a player-facing dungeon relic kiosk for composing and claiming Solana game assets.

Starter provenance is intentionally preserved: this project was generated with `bun x create-seed@latest nightshift-103-relicrift -t bun-react-vite-solana-kit`, then extended into a single semi-complex app.

## Capabilities

- Choose a dungeon route and relic core in a dark arcade terminal shell.
- Socket 3-5 expedition modifiers and simulate danger, payout, readiness, and grade.
- Generate first-party SVG and JSON metadata for the composed relic.
- Connect with wallet-ui and claim a wallet-signed MPL Core devnet asset through `createV1`.
- Verify the minted asset record with `fetchAssetV1` after the wallet returns a signature.

## Solana Path

The claim path uses `@wallet-ui/react`, `@solana/kit`, and `@obrera/mpl-core-kit-lib`.

The connected wallet signs as payer, owner, creation authority, and update authority. The browser generates a fresh asset signer with `generateKeyPairSigner`, builds an MPL Core `getCreateV1Instruction`, sends it through `signAndSendTransactionMessageWithSigners`, then verifies the devnet asset record. There is no server mint workaround.

## Development

```bash
bun install
bun run dev
```

Open `http://localhost:5173`.

## Validation

```bash
bun run check-types
bun run lint
bun run smoke
bun run build
```

The smoke script checks required dependencies, forbidden Solana imports, generated metadata shape, claimable composition rules, and the wallet-signed MPL Core claim path.

## Static Container

```bash
docker compose up --build
```

The app is served by nginx on `http://localhost:8080` with SPA fallback and `/healthz`.

## Deployment Target

Live target: `https://relicrift103.colmena.dev`
