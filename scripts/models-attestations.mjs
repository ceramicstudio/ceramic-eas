import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { Model } from '@ceramicnetwork/stream-model'
import { Composite } from '@composedb/devtools'
import { DID } from 'dids'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import { getResolver } from 'key-did-resolver'
import { fromString } from 'uint8arrays'

const CERAMIC_URL = process.env.CERAMIC_URL || 'http://localhost:7007'
const SEED_PATH = fileURLToPath(new URL('../admin_seed.txt', import.meta.url))

const COMMON_SCHEMA_DEFINITIONS = {
  Types: {
    type: 'object',
    title: 'Types',
    required: ['name', 'type'],
    properties: {
      name: { type: 'string', maxLength: 20 },
      type: { type: 'string', maxLength: 20 },
    },
    additionalProperties: false,
  },
  CeramicStreamID: { type: 'string', title: 'CeramicStreamID', maxLength: 100 },
  GraphQLDateTime: {
    type: 'string',
    title: 'GraphQLDateTime',
    format: 'date-time',
    maxLength: 100,
  },
}

const ATTESTATION_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    r: { type: 'string', maxLength: 66, minLength: 66 },
    s: { type: 'string', maxLength: 66, minLength: 66 },
    v: { type: 'integer' },
    uid: { type: 'string', maxLength: 66, minLength: 66 },
    time: { type: 'integer' },
    types: { type: 'array', items: { $ref: '#/$defs/Types' }, maxItems: 100 },
    dataId: { $ref: '#/$defs/CeramicStreamID' },
    refUID: { type: 'string', maxLength: 66, minLength: 66 },
    schema: { type: 'string', maxLength: 66, minLength: 66 },
    chainId: { type: 'integer' },
    version: { type: 'integer' },
    attester: { type: 'string', maxLength: 42, minLength: 42 },
    recipient: { type: 'string', maxLength: 42, minLength: 42 },
    easVersion: { type: 'string', maxLength: 5 },
    expirationTime: { $ref: '#/$defs/GraphQLDateTime' },
    revocationTime: { $ref: '#/$defs/GraphQLDateTime' },
    verifyingContract: { type: 'string', maxLength: 42, minLength: 42 },
  },
  additionalProperties: false,
  required: [
    'uid',
    'schema',
    'attester',
    'verifyingContract',
    'easVersion',
    'version',
    'chainId',
    'r',
    's',
    'v',
    'time',
    'dataId',
  ],

  $defs: COMMON_SCHEMA_DEFINITIONS,
}

const CONFIRMATION_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    r: { type: 'string', maxLength: 66, minLength: 66 },
    s: { type: 'string', maxLength: 66, minLength: 66 },
    v: { type: 'integer' },
    uid: { type: 'string', maxLength: 66, minLength: 66 },
    data: { type: 'string', maxLength: 1000000 },
    time: { type: 'integer' },
    types: { type: 'array', items: { $ref: '#/$defs/Types' }, maxItems: 100 },
    refUID: { type: 'string', maxLength: 66, minLength: 66 },
    schema: { type: 'string', maxLength: 66, minLength: 66 },
    chainId: { type: 'integer' },
    version: { type: 'integer' },
    attester: { type: 'string', maxLength: 42, minLength: 42 },
    recipient: { type: 'string', maxLength: 42, minLength: 42 },
    easVersion: { type: 'string', maxLength: 5 },
    attestationId: { $ref: '#/$defs/CeramicStreamID' },
    expirationTime: { $ref: '#/$defs/GraphQLDateTime' },
    revocationTime: { $ref: '#/$defs/GraphQLDateTime' },
    verifyingContract: { type: 'string', maxLength: 42, minLength: 42 },
  },
  additionalProperties: false,
  required: [
    'uid',
    'schema',
    'attester',
    'verifyingContract',
    'easVersion',
    'version',
    'chainId',
    'r',
    's',
    'v',
    'time',
    'data',
    'attestationId',
  ],
  $defs: COMMON_SCHEMA_DEFINITIONS,
}

async function getCeramicClient(provided) {
  const seed = await readFile(SEED_PATH, 'utf8')
  const key = fromString(seed, 'base16')
  const did = new DID({
    // @ts-ignore resolver type mismatch
    resolver: getResolver(),
    provider: new Ed25519Provider(key),
  })
  await did.authenticate()

  const ceramic =
    provided instanceof CeramicClient ? provided : new CeramicClient(provided ?? CERAMIC_URL)
  ceramic.did = did
  return ceramic
}

// Create an attestation model for the given model ID and name
async function createAttestationModels(ceramic, forModelID, forModelName) {
  const attestationModel = await Model.create(ceramic, {
    version: '1.0',
    name: `AttestationFor${forModelName}`,
    description: `Ethereum attestation for documents of model ${forModelName}`,
    accountRelation: { type: 'list' },
    schema: ATTESTATION_SCHEMA,
    relations: {
      dataId: { type: 'document', model: forModelID },
    },
    views: {
      data: { type: 'relationDocument', model: forModelID, property: 'dataId' },
      publisher: { type: 'documentAccount' },
    },
  })
  const attestationID = attestationModel.id.toString()

  const confirmationModel = await Model.create(ceramic, {
    version: '1.0',
    name: `AttestationConfirmationFor${forModelName}`,
    description: `Ethereum attestation confirmation for documents of model ${forModelName}`,
    accountRelation: { type: 'list' },
    schema: CONFIRMATION_SCHEMA,
    relations: {
      attestationId: { type: 'document', model: attestationID },
    },
    views: {
      attestation: { type: 'relationDocument', model: attestationID, property: 'attestationId' },
      publisher: { type: 'documentAccount' },
    },
  })

  await ceramic.admin.startIndexingModelData([
    {
      streamID: attestationModel.id,
      indices: [
        { fields: [{ path: ['attester'] }] },
        { fields: [{ path: ['verifyingContract'] }] },
      ],
    },
    {
      streamID: confirmationModel.id,
      indices: [{ fields: [{ path: ['attester'] }] }, { fields: [{ path: ['recipient'] }] }],
    },
  ])

  return { attestationID, confirmationID: confirmationModel.id.toString() }
}

export async function addAttestations({ ceramic, models, source }) {
  const { definition } = source.toParams()
  // Create mapping of model IDs by their name
  const modelIDsByName = Object.entries(definition.models).reduce(
    (acc, [modelID, modelDefinition]) => {
      acc[modelDefinition.name] = modelID
      return acc
    },
    {}
  )

  // Create the attestation model for each model name provided
  const attestationIDsByName = {}
  const attestationModelsIDs = await Promise.all(
    models.map(async (modelName) => {
      const modelID = modelIDsByName[modelName]
      if (modelID == null) {
        throw new Error(`Model ID not found for model: ${modelName}`)
      }
      const models = await createAttestationModels(ceramic, modelID, modelName)
      attestationIDsByName[modelName] = models
      return Object.values(models)
    })
  )

  // Create new composite containing the created attestation models
  const attestationsComposite = await Composite.fromModels({
    ceramic,
    models: attestationModelsIDs.flat(),
  })

  // Create views to the attestations for the provided models
  const modelViews = Object.entries(attestationIDsByName).reduce(
    (acc, [forModelName, relatedModels]) => {
      acc[forModelName] = {
        // attestations: {
        //   type: 'relationFrom',
        //   model: relatedModels.attestationID,
        //   property: 'dataId',
        // },
        // attestationsCount: {
        //   type: 'relationCountFrom',
        //   model: relatedModels.attestationID,
        //   property: 'dataId',
        // },
        confirm: {
          type: 'relationFrom',
          model: relatedModels.confirmationID,
          property: 'attestationId',
        },
      }
      return acc
    },
    {}
  )

  // Create new composite combining the source one with attestations models and additional views
  return Composite.from([source, attestationsComposite], {
    views: { models: modelViews },
  })
}
