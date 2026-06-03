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
assert(source.includes('fetchAssetV1'), 'Claim path must verify MPL Core devnet asset record')

console.log('smoke: required deps, forbidden imports, metadata shape, and claim path passed')
