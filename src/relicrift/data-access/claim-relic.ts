import { fetchAssetV1, getCreateV1Instruction, plugin } from '@obrera/mpl-core-kit-lib'
import {
  address,
  appendTransactionMessageInstruction,
  compileTransactionMessage,
  createTransactionMessage,
  generateKeyPairSigner,
  getBase58Decoder,
  getBase64Decoder,
  getCompiledTransactionMessageEncoder,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signAndSendTransactionMessageWithSigners,
  type TransactionMessageBytesBase64,
} from '@solana/kit'
import { type useWalletUiSigner } from '@wallet-ui/react'

import type { SolanaClient } from '@/solana/data-access/solana-client'

import { createMetadataUri, type RelicComposition } from './relicrift'

export interface ClaimedRelicRecord {
  asset: string
  explorerUrl: string
  owner: string
  signature: string
  uri: string
  verified: boolean
}

export async function claimRelic({
  client,
  composition,
  transactionSigner,
}: {
  client: SolanaClient
  composition: RelicComposition
  transactionSigner: ReturnType<typeof useWalletUiSigner>
}): Promise<ClaimedRelicRecord> {
  if (!composition.metadata.properties.claimable) {
    throw new Error('Socket at least 3 expedition modifiers before claiming a relic.')
  }

  const asset = await generateKeyPairSigner()
  const owner = address(transactionSigner.address)
  const uri = createMetadataUri(composition)
  const { value: latestBlockhash } = await client.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()
  const instruction = getCreateV1Instruction({
    asset,
    authority: transactionSigner,
    name: composition.metadata.name.slice(0, 32),
    owner,
    payer: transactionSigner,
    plugins: [
      {
        authority: null,
        plugin: plugin('Attributes', [
          {
            attributeList: composition.metadata.attributes.map((attribute) => ({
              key: attribute.trait_type,
              value: String(attribute.value),
            })),
          },
        ]),
      },
    ],
    updateAuthority: owner,
    uri,
  })
  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (transactionMessage) => setTransactionMessageFeePayerSigner(transactionSigner, transactionMessage),
    (transactionMessage) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, transactionMessage),
    (transactionMessage) => appendTransactionMessageInstruction(instruction, transactionMessage),
  )
  const encodedMessage = getCompiledTransactionMessageEncoder().encode(compileTransactionMessage(message))
  const [{ value: balance }, { value: fee }] = await Promise.all([
    client.rpc.getBalance(owner, { commitment: 'confirmed' }).send(),
    client.rpc
      .getFeeForMessage(getBase64Decoder().decode(encodedMessage) as TransactionMessageBytesBase64, {
        commitment: 'confirmed',
      })
      .send(),
  ])

  if (fee === null) {
    throw new Error('Unable to estimate the claim fee. Try again with a fresh blockhash.')
  }

  if (balance < fee) {
    throw new Error('Not enough devnet SOL to pay the MPL Core claim fee.')
  }

  const signatureBytes = await signAndSendTransactionMessageWithSigners(message)
  const signature = getBase58Decoder().decode(signatureBytes)

  if (!signature) {
    throw new Error('Transaction submitted but no signature was returned by the wallet adapter.')
  }

  const record = await fetchAssetV1(client.rpc, asset.address)

  return {
    asset: asset.address,
    explorerUrl: `https://explorer.solana.com/address/${asset.address}?cluster=devnet`,
    owner,
    signature,
    uri,
    verified: record.data.name === composition.metadata.name.slice(0, 32) && record.data.uri === uri,
  }
}
