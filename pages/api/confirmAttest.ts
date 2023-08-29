import { CeramicClient } from '@ceramicnetwork/http-client'
import { ComposeClient } from '@composedb/client'
import { RuntimeCompositeDefinition } from '@composedb/types'
import { DID } from 'dids'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import KeyResolver from 'key-did-resolver'
import { NextApiRequest, NextApiResponse } from 'next'
import { fromString } from 'uint8arrays/from-string'

import { env } from '../../env.mjs'

import { definition } from '../../src/__generated__/definition.js'

const uniqueKey = env.AUTHOR_KEY

export default async function createAttestation(req: NextApiRequest, res: NextApiResponse<any>) {
  const { message, uid, account, stream } = req.body
  //instantiate a ceramic client instance
  const ceramic = new CeramicClient("https://ceramic-temp.hirenodes.io")

  //instantiate a composeDB client instance
  const composeClient = new ComposeClient({
    ceramic: "https://ceramic-temp.hirenodes.io",
    definition: definition as RuntimeCompositeDefinition,
  })

  const authenticateDID = async(seed: string) => {
    const key = fromString(seed, "base16");
    const provider = new Ed25519Provider(key);
    const staticDid = new DID({
      resolver: KeyResolver.getResolver(),
      provider
    });
    await staticDid.authenticate();
    ceramic.did = staticDid;
    return staticDid;
  }

  try {
    if (uniqueKey) {
      const did = await authenticateDID(uniqueKey)
      composeClient.setDID(did)
      console.log(req.body)
      const data: any = await composeClient.executeQuery(`
      mutation {
        createConfirm(input: {
          content: {
            uid: "${uid}"
            schema: "${message.schema}"
            attester: "${account}"
            recipient: "${message.recipient}"
            refUID: "${message.refUID}"
            data: "${message.data}"
            time: "${message.time.toString()}"
            attestationId: "${stream}"
          }
        }) 
        {
          document {
            id
            uid
            schema
            attester
            recipient
            refUID
            data
            time
          }
        }
      }
      `)
      if (data.data.createConfirm.document.id) {
        return res.json(data)
      } else {
        return res.json({ error: data })
      }
    }
  } catch (err) {
    res.json({
      err,
    })
  }
}
