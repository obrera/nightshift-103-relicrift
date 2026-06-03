export interface ExpeditionModifier {
  danger: number
  id: ModifierId
  label: string
  payout: number
  readiness: number
  tag: string
}

export type ModifierId = 'echo-tax' | 'gilded-map' | 'hush-lantern' | 'rift-clock' | 'warden-mark'

export interface RelicComposition {
  core: RelicCore
  metadata: RelicMetadata
  modifiers: ExpeditionModifier[]
  route: RelicRoute
  score: RelicScore
  seed: string
  svg: string
}

export interface RelicCore {
  affinity: string
  id: RelicCoreId
  label: string
  payout: number
  readiness: number
  tone: string
}

export type RelicCoreId = 'ember-vault' | 'glass-oracle' | 'iron-veil' | 'void-index'

export interface RelicMetadata {
  attributes: Array<{ trait_type: string; value: number | string }>
  description: string
  image: string
  name: string
  properties: {
    build: number
    category: string
    claimable: boolean
    composition: {
      core: RelicCoreId
      modifiers: ModifierId[]
      route: RouteId
    }
    schema: string
  }
}

export interface RelicRoute {
  danger: number
  id: RouteId
  label: string
  payout: number
  readiness: number
  sector: string
}

export interface RelicScore {
  danger: number
  grade: 'A' | 'B' | 'C' | 'S'
  payout: number
  readiness: number
}

export type RouteId = 'cryptline' | 'furnace' | 'sablegate'

export const routes: RelicRoute[] = [
  {
    danger: 41,
    id: 'cryptline',
    label: 'Cryptline Descent',
    payout: 58,
    readiness: 73,
    sector: 'Sublevel 03 / bone rail',
  },
  {
    danger: 68,
    id: 'furnace',
    label: 'Furnace Ossuary',
    payout: 84,
    readiness: 49,
    sector: 'Sublevel 07 / ash lift',
  },
  {
    danger: 53,
    id: 'sablegate',
    label: 'Sablegate Run',
    payout: 72,
    readiness: 61,
    sector: 'Sublevel 05 / sealed arcade',
  },
]

export const cores: RelicCore[] = [
  { affinity: 'Heat ledger', id: 'ember-vault', label: 'Ember Vault Core', payout: 18, readiness: 5, tone: '#ff5c35' },
  {
    affinity: 'Oracle glass',
    id: 'glass-oracle',
    label: 'Glass Oracle Core',
    payout: 8,
    readiness: 19,
    tone: '#42f2c2',
  },
  { affinity: 'Armor hymn', id: 'iron-veil', label: 'Iron Veil Core', payout: 12, readiness: 14, tone: '#f2c14e' },
  { affinity: 'Null index', id: 'void-index', label: 'Void Index Core', payout: 26, readiness: -5, tone: '#9d7cff' },
]

export const modifiers: ExpeditionModifier[] = [
  { danger: 13, id: 'echo-tax', label: 'Echo Tax', payout: 18, readiness: -8, tag: 'toll' },
  { danger: 4, id: 'gilded-map', label: 'Gilded Map', payout: 14, readiness: 7, tag: 'loot' },
  { danger: -8, id: 'hush-lantern', label: 'Hush Lantern', payout: -4, readiness: 18, tag: 'stealth' },
  { danger: 17, id: 'rift-clock', label: 'Rift Clock', payout: 22, readiness: -11, tag: 'timed' },
  { danger: 10, id: 'warden-mark', label: 'Warden Mark', payout: 11, readiness: 3, tag: 'boss' },
]

export function composeRelic({
  coreId,
  modifierIds,
  routeId,
}: {
  coreId: RelicCoreId
  modifierIds: ModifierId[]
  routeId: RouteId
}): RelicComposition {
  const route = getById(routes, routeId)
  const core = getById(cores, coreId)
  const activeModifiers = modifierIds.map((modifierId) => getById(modifiers, modifierId))
  const score = scoreRelic(route, core, activeModifiers)
  const seed = `${route.id}:${core.id}:${activeModifiers.map((modifier) => modifier.id).join('+')}:${score.grade}`
  const svg = createRelicSvg({ core, modifiers: activeModifiers, route, score, seed })
  const metadata = createRelicMetadata({ core, modifiers: activeModifiers, route, score, svg })

  return { core, metadata, modifiers: activeModifiers, route, score, seed, svg }
}

export function createMetadataUri(composition: RelicComposition) {
  return `https://relicrift103.colmena.dev/metadata/${slugify(composition.metadata.name)}-${hashSeed(composition.seed)}.json`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function createRelicMetadata({
  core,
  modifiers,
  route,
  score,
  svg,
}: {
  core: RelicCore
  modifiers: ExpeditionModifier[]
  route: RelicRoute
  score: RelicScore
  svg: string
}): RelicMetadata {
  const image = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

  return {
    attributes: [
      { trait_type: 'Dungeon Route', value: route.label },
      { trait_type: 'Relic Core', value: core.label },
      { trait_type: 'Danger', value: score.danger },
      { trait_type: 'Payout', value: score.payout },
      { trait_type: 'Readiness', value: score.readiness },
      { trait_type: 'Grade', value: score.grade },
      ...modifiers.map((modifier, index) => ({ trait_type: `Socket ${index + 1}`, value: modifier.label })),
    ],
    description: 'A wallet-claimed RelicRift dungeon relic composed at the Nightshift 103 arcade kiosk.',
    image,
    name: `RelicRift ${score.grade}-${core.label.replace(' Core', '')}`,
    properties: {
      build: 103,
      category: 'solana-game-asset',
      claimable: modifiers.length >= 3,
      composition: {
        core: core.id,
        modifiers: modifiers.map((modifier) => modifier.id),
        route: route.id,
      },
      schema: 'relicrift.composition.v1',
    },
  }
}

function createRelicSvg({
  core,
  modifiers,
  route,
  score,
  seed,
}: {
  core: RelicCore
  modifiers: ExpeditionModifier[]
  route: RelicRoute
  score: RelicScore
  seed: string
}) {
  const code = hashSeed(seed)
  const modifierText = modifiers.map((modifier) => modifier.tag.toUpperCase()).join(' / ')
  const rings = modifiers
    .map((modifier, index) => {
      const offset = 42 + index * 32
      return `<rect x="${offset}" y="250" width="24" height="24" fill="${index % 2 ? '#0df2b8' : '#ffcc33'}" opacity=".9"/><text x="${offset + 12}" y="294" text-anchor="middle">${modifier.tag.slice(0, 2).toUpperCase()}</text>`
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#08090d"/>
  <rect x="18" y="18" width="476" height="476" fill="#12141b" stroke="#3df5c0" stroke-width="3"/>
  <path d="M70 128h372v246H70z" fill="#171a22" stroke="#ffcc33" stroke-width="2"/>
  <path d="M256 92l124 76v146L256 390 132 314V168z" fill="${core.tone}" opacity=".18" stroke="${core.tone}" stroke-width="6"/>
  <circle cx="256" cy="238" r="78" fill="#08090d" stroke="${core.tone}" stroke-width="10"/>
  <path d="M256 164l48 84h-96z" fill="${core.tone}"/>
  <path d="M190 335h132" stroke="#f5f7fb" stroke-width="10"/>
  ${rings}
  <text x="44" y="62" fill="#3df5c0" font-family="monospace" font-size="24">RELICRIFT // BUILD 103</text>
  <text x="44" y="102" fill="#f5f7fb" font-family="monospace" font-size="18">${escapeXml(route.label)}</text>
  <text x="44" y="426" fill="#ffcc33" font-family="monospace" font-size="22">GRADE ${score.grade} / PAYOUT ${score.payout}</text>
  <text x="44" y="458" fill="#f5f7fb" font-family="monospace" font-size="14">${escapeXml(modifierText)}</text>
  <text x="44" y="480" fill="#6f7787" font-family="monospace" font-size="13">HASH ${code}</text>
</svg>`
}

function escapeXml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function getById<T extends { id: string }>(items: T[], id: T['id']): T {
  const item = items.find((candidate) => candidate.id === id)

  if (!item) {
    throw new Error(`Unknown relic option: ${id}`)
  }

  return item
}

function hashSeed(seed: string) {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(16).padStart(8, '0').toUpperCase()
}

function scoreRelic(route: RelicRoute, core: RelicCore, activeModifiers: ExpeditionModifier[]): RelicScore {
  const modifierTotals = activeModifiers.reduce(
    (totals, modifier) => ({
      danger: totals.danger + modifier.danger,
      payout: totals.payout + modifier.payout,
      readiness: totals.readiness + modifier.readiness,
    }),
    { danger: 0, payout: 0, readiness: 0 },
  )
  const danger = clamp(route.danger + modifierTotals.danger - Math.round(core.readiness / 3), 0, 100)
  const payout = clamp(route.payout + core.payout + modifierTotals.payout, 0, 100)
  const readiness = clamp(route.readiness + core.readiness + modifierTotals.readiness - Math.round(danger / 5), 0, 100)
  const grade = readiness >= 78 && payout >= 80 ? 'S' : readiness >= 62 ? 'A' : readiness >= 44 ? 'B' : 'C'

  return { danger, grade, payout, readiness }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
