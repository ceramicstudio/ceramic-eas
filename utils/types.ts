import { TypedData } from "@ethereum-attestation-service/eas-sdk/dist/offchain/typed-data-handler"

export type EASChainConfig = {
  chainId: number
  chainName: string
  version: string
  contractAddress: string
  schemaRegistryAddress: string
  etherscanURL: string
  /** Must contain a trailing dot (unless mainnet). */
  subdomain: string
  contractStartBlock: number
  rpcProvider: string
}

export interface AttestationResult {
  data: Data
}

export interface MyAttestationResult {
  data: MyData
}

export interface EnsNamesResult {
  data: {
    ensNames: { id: string; name: string }[]
  }
}

export interface Data {
  attestation: Attestation | null
}

export interface MyData {
  attestations: Attestation[]
}

export interface Attestation {
  id: string
  attester: string
  recipient: string
  refUID: string
  revocationTime: number
  expirationTime: number
  time: number
  txid: string
  data: string
}

export interface FullAttestation {
  id: string
  attester: string
  recipient: string
  refUID: string
  revocationTime?: number
  expirationTime?: number
  time: number
  txid: string
  data: string
  uid: string
  schema: string
  verifyingContract: string
  easVersion: string
  version: number
  chainId: number
  r: string
  s: string
  v: number
  types: TypedData[]
  currAccount: string;
  confirmation?: Attestation
}

export type ResolvedAttestation = Attestation & {
  name: string
  uid: string
  confirmation?: Attestation
  currAccount: string;
}

declare global {
  interface Window {
    ethereum: any;
  }
}

export interface GitcoinPassport {
  id: string
  _id: string
  provider: string
  hash: string
}

export interface FullVC {
  id: string
  issuer: string
  issuanceDate: string
  expirationDate: string
  proofType: string
  proofPurpose: string
  proofCreated: string
  proofValue: string
  verificationMethod: string
  gitcoinPassportId: string
  credentialSubject: GitcoinPassport
}
