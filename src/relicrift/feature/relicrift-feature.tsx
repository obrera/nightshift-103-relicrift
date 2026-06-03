import { type UiWalletAccount, useWalletUi, useWalletUiSigner } from '@wallet-ui/react'
import {
  BadgeCheck,
  Boxes,
  CircleGauge,
  Coins,
  Download,
  Gem,
  KeyRound,
  RadioTower,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { SolanaClient } from '@/solana/data-access/solana-client'

import { Button } from '@/core/ui/button'
import { useSolanaClient } from '@/solana/data-access/use-solana-client'
import { SolanaUiWalletDialog } from '@/solana/ui/solana-ui-wallet-dialog'

import { type ClaimedRelicRecord, claimRelic } from '../data-access/claim-relic'
import {
  composeRelic,
  cores,
  type ModifierId,
  modifiers,
  type RelicComposition,
  type RelicCoreId,
  type RouteId,
  routes,
} from '../data-access/relicrift'

const initialModifiers: ModifierId[] = ['gilded-map', 'hush-lantern', 'warden-mark']

export function RelicRiftFeature() {
  const client = useSolanaClient()
  const { account, cluster } = useWalletUi()
  const [routeId, setRouteId] = useState<RouteId>('cryptline')
  const [coreId, setCoreId] = useState<RelicCoreId>('glass-oracle')
  const [modifierIds, setModifierIds] = useState<ModifierId[]>(initialModifiers)
  const composition = useMemo(() => composeRelic({ coreId, modifierIds, routeId }), [coreId, modifierIds, routeId])
  const metadataText = useMemo(() => JSON.stringify(composition.metadata, null, 2), [composition.metadata])
  const [claim, setClaim] = useState<ClaimedRelicRecord | null>(null)
  const isDevnet = cluster.id === 'solana:devnet'

  const toggleModifier = (modifierId: ModifierId) => {
    setClaim(null)
    setModifierIds((current) => {
      if (current.includes(modifierId)) {
        return current.filter((candidate) => candidate !== modifierId)
      }
      if (current.length === 5) {
        return current
      }
      return [...current, modifierId]
    })
  }

  const downloadMetadata = () => {
    downloadFile(`${composition.metadata.name}.json`, metadataText, 'application/json')
  }

  const downloadSvg = () => {
    downloadFile(`${composition.metadata.name}.svg`, composition.svg, 'image/svg+xml')
  }

  return (
    <div className="min-h-full bg-[#050609] text-zinc-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-3 py-4 sm:px-5 lg:grid lg:grid-cols-[1.05fr_.95fr] lg:py-6">
        <div className="rounded border border-emerald-300/30 bg-[#0b0d12] shadow-[0_0_0_1px_rgba(255,255,255,.04),0_24px_90px_rgba(0,0,0,.55)]">
          <div className="flex items-center justify-between border-b border-emerald-300/20 px-4 py-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-normal text-emerald-200 uppercase sm:text-4xl">RelicRift</h1>
              <p className="text-xs tracking-normal text-zinc-500 uppercase">Dungeon relic kiosk / build 103</p>
            </div>
            <div className="rounded border border-amber-300/50 px-3 py-2 font-mono text-sm text-amber-200">
              {composition.score.grade}-GRADE
            </div>
          </div>

          <div className="grid gap-3 p-3 sm:p-4">
            <PanelTitle icon={<RadioTower />} title="Route" />
            <div className="grid gap-2 sm:grid-cols-3">
              {routes.map((route) => (
                <OptionButton active={route.id === routeId} key={route.id} onClick={() => setRouteId(route.id)}>
                  <span className="font-semibold">{route.label}</span>
                  <span className="text-xs text-zinc-500">{route.sector}</span>
                </OptionButton>
              ))}
            </div>

            <PanelTitle icon={<Gem />} title="Relic Core" />
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {cores.map((core) => (
                <OptionButton active={core.id === coreId} key={core.id} onClick={() => setCoreId(core.id)}>
                  <span className="font-semibold" style={{ color: core.tone }}>
                    {core.label}
                  </span>
                  <span className="text-xs text-zinc-500">{core.affinity}</span>
                </OptionButton>
              ))}
            </div>

            <PanelTitle icon={<Boxes />} title={`Modifier Sockets ${modifierIds.length}/5`} />
            <div className="grid gap-2 sm:grid-cols-5">
              {modifiers.map((modifier) => (
                <button
                  className={`min-h-24 rounded border p-3 text-left transition ${
                    modifierIds.includes(modifier.id)
                      ? 'border-amber-300 bg-amber-300/15 text-amber-100'
                      : 'border-zinc-800 bg-black/25 text-zinc-300 hover:border-emerald-300/60'
                  }`}
                  key={modifier.id}
                  onClick={() => toggleModifier(modifier.id)}
                  type="button"
                >
                  <span className="block font-semibold">{modifier.label}</span>
                  <span className="mt-2 block font-mono text-xs text-zinc-500">
                    D{signed(modifier.danger)} P{signed(modifier.payout)} R{signed(modifier.readiness)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="grid gap-5">
          <div className="rounded border border-zinc-800 bg-[#10131a] p-3 sm:p-4">
            <div
              className="aspect-square w-full overflow-hidden rounded border border-zinc-700 bg-black"
              dangerouslySetInnerHTML={{ __html: composition.svg }}
            />
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Metric icon={<ShieldAlert />} label="Danger" value={composition.score.danger} />
              <Metric icon={<Coins />} label="Payout" value={composition.score.payout} />
              <Metric icon={<CircleGauge />} label="Ready" value={composition.score.readiness} />
            </div>
          </div>

          <div className="rounded border border-emerald-300/20 bg-[#10131a] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PanelTitle icon={<KeyRound />} title="Wallet Claim" />
              <SolanaUiWalletDialog />
            </div>
            <div className="mt-3 grid gap-2 font-mono text-xs text-zinc-400">
              <span>Cluster: {cluster.label}</span>
              <span>Wallet: {account?.address ?? 'not connected'}</span>
              <span>Claim rule: connected wallet signs as payer, owner, authority, update authority</span>
            </div>
            {account ? (
              <ConnectedClaimButton
                account={account}
                client={client}
                composition={composition}
                isDevnet={isDevnet}
                onClaimed={setClaim}
              />
            ) : (
              <Button className="mt-4 w-full" disabled>
                <Sparkles />
                Connect Wallet to Claim
              </Button>
            )}
            {claim ? (
              <div className="mt-3 rounded border border-emerald-300/30 bg-emerald-300/10 p-3 text-sm text-emerald-100">
                <div className="flex items-center gap-2 font-semibold">
                  <BadgeCheck className="size-4" />
                  Devnet record verified: {claim.verified ? 'yes' : 'metadata mismatch'}
                </div>
                <a
                  className="mt-2 block text-xs break-all underline"
                  href={claim.explorerUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {claim.asset}
                </a>
                <p className="mt-2 font-mono text-xs break-all text-emerald-200">Signature: {claim.signature}</p>
              </div>
            ) : null}
          </div>
        </aside>

        <section className="rounded border border-zinc-800 bg-[#0b0d12] p-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PanelTitle icon={<Download />} title="First-Party Metadata" />
            <div className="flex gap-2">
              <Button onClick={downloadSvg} size="sm" variant="secondary">
                SVG
              </Button>
              <Button onClick={downloadMetadata} size="sm" variant="secondary">
                JSON
              </Button>
            </div>
          </div>
          <pre className="mt-3 max-h-80 overflow-auto rounded border border-zinc-800 bg-black/50 p-3 text-xs text-zinc-300">
            {metadataText}
          </pre>
        </section>
      </section>
    </div>
  )
}

function ConnectedClaimButton({
  account,
  client,
  composition,
  isDevnet,
  onClaimed,
}: {
  account: UiWalletAccount
  client: SolanaClient
  composition: RelicComposition
  isDevnet: boolean
  onClaimed: (claim: ClaimedRelicRecord | null) => void
}) {
  const transactionSigner = useWalletUiSigner({ account })
  const [isClaiming, setIsClaiming] = useState(false)
  const canClaim = isDevnet && composition.metadata.properties.claimable

  const handleClaim = async () => {
    if (!isDevnet) {
      toast.error('Switch the wallet cluster to devnet before claiming.')
      return
    }

    setIsClaiming(true)
    onClaimed(null)
    try {
      const result = await claimRelic({ client, composition, transactionSigner })
      onClaimed(result)
      toast.success('Relic claimed and devnet record verified.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <Button className="mt-4 w-full" disabled={!canClaim || isClaiming} onClick={handleClaim}>
      <Sparkles />
      {isClaiming ? 'Claiming Relic' : 'Mint / Claim MPL Core Relic'}
    </Button>
  )
}

function downloadFile(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded border border-zinc-800 bg-black/35 p-3">
      <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-mono text-2xl font-black text-zinc-100">{value}</div>
    </div>
  )
}

function OptionButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      className={`flex min-h-20 flex-col justify-between rounded border p-3 text-left transition ${
        active
          ? 'border-emerald-300 bg-emerald-300/15 text-emerald-100'
          : 'border-zinc-800 bg-black/25 hover:border-zinc-500'
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function PanelTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-sm font-bold text-zinc-300 uppercase">
      {icon}
      {title}
    </div>
  )
}

function signed(value: number) {
  return value >= 0 ? `+${value}` : String(value)
}

export { RelicRiftFeature as Component }
