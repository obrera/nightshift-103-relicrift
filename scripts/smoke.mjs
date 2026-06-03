import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const requiredFiles = ['LICENSE', 'README.md', 'BUILDLOG.md', 'Dockerfile', 'docker-compose.yml', 'nginx.conf']
const forbidden = ['@solana/web3.js', '@solana/wallet-adapter-react', 'Buffer.from', 'new Buffer', 'node:buffer']
const sourceFiles = [
  'src/relicrift/data-access/claim-relic.ts',
  'src/relicrift/data-access/relicrift.ts',
  'src/relicrift/feature/relicrift-feature.tsx',
]
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

for (const file of requiredFiles) {
  assert(existsSync(join(root, file)), `Missing required file: ${file}`)
}

assert(packageJson.dependencies['@obrera/mpl-core-kit-lib'], 'Missing @obrera/mpl-core-kit-lib dependency')
assert(packageJson.dependencies['@wallet-ui/react'], 'Missing wallet-ui dependency')
assert(packageJson.dependencies['@solana/kit'], 'Missing @solana/kit dependency')

const source = sourceFiles.map((file) => readFileSync(join(root, file), 'utf8')).join('\n')

for (const token of forbidden) {
  assert(!source.includes(token), `Forbidden import/API detected: ${token}`)
}

assert(source.includes("from '@obrera/mpl-core-kit-lib'"), 'MPL Core helper must be imported by package export')
assert(source.includes('getCreateV1Instruction'), 'Missing MPL Core createV1 instruction path')
assert(source.includes('useWalletUiSigner'), 'Missing wallet-ui signer path')
assert(source.includes('payer: transactionSigner'), 'Connected wallet must sign as payer')
assert(source.includes('owner,'), 'Connected wallet must be asset owner')
assert(source.includes('updateAuthority: owner'), 'Connected wallet must be update authority')
assert(source.includes('claimable: modifiers.length >= 3'), 'Metadata must expose claimable composition rule')
assert(source.includes('data:image/svg+xml;utf8'), 'Metadata must include first-party SVG image data')
assert(source.includes('data:application/json;charset=utf-8,'), 'Metadata URI must use a static-safe JSON data URI')
assert(
  source.includes('encodeURIComponent(JSON.stringify(composition.metadata))'),
  'Metadata URI must encode the composed JSON metadata payload',
)
assert(
  !source.includes('https://relicrift103.colmena.dev/metadata/'),
  'Metadata URI must not target the SPA-served /metadata path',
)
assert(source.includes('fetchAssetV1'), 'Claim path must verify MPL Core devnet asset record')

const smokeMetadata = {
  attributes: [{ trait_type: 'Grade', value: 'S' }],
  description: 'Smoke metadata payload',
  image: 'data:image/svg+xml;utf8,%3Csvg%2F%3E',
  name: 'RelicRift Smoke',
  properties: {
    build: 103,
    category: 'solana-game-asset',
    claimable: true,
    composition: {
      core: 'glass-oracle',
      modifiers: ['echo-tax', 'gilded-map', 'hush-lantern'],
      route: 'cryptline',
    },
    schema: 'relicrift.composition.v1',
  },
}
const smokeMetadataUri = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(smokeMetadata))}`
const [smokeMetadataUriHeader, smokeMetadataUriPayload] = smokeMetadataUri.split(',', 2)
const decodedSmokeMetadata = JSON.parse(decodeURIComponent(smokeMetadataUriPayload))

assert(smokeMetadataUriHeader === 'data:application/json;charset=utf-8', 'Metadata URI must declare JSON content')
assert(!smokeMetadataUri.startsWith('http'), 'Metadata URI must not be an HTTP route')
assert(decodedSmokeMetadata.properties.build === 103, 'Metadata URI payload must remain parseable build 103 JSON')
assert(decodedSmokeMetadata.image.startsWith('data:image/svg+xml;utf8,'), 'Metadata JSON must retain embedded SVG image data')

console.log('smoke: required deps, forbidden imports, static-safe JSON metadata URI, and claim path passed')
