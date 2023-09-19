import { CeramicClient } from "@ceramicnetwork/http-client";
import { ComposeClient } from "@composedb/client";
import { RuntimeCompositeDefinition } from "@composedb/types";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import KeyResolver from "key-did-resolver";
import { NextApiRequest, NextApiResponse } from "next";
import { fromString } from "uint8arrays/from-string";

import { env } from "../../env.mjs";

import { definition } from "../../src/__generated__/definition.js";

const uniqueKey = process.env.AUTHOR_KEY;

export default async function createAttestation(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const { message, uid, account, domain, types, signature } = req.body;
  console.log(env.AUTHOR_KEY)
  //instantiate a ceramic client instance
  const ceramic = new CeramicClient('http://localhost:7007');

  //instantiate a composeDB client instance
  const composeClient = new ComposeClient({
    ceramic: 'http://localhost:7007',
    definition: definition as RuntimeCompositeDefinition,
  });

  //authenticate developer DID in order to create a write transaction
  const authenticateDID = async(seed: string) => {
    const key = fromString(seed, "base16");
    const provider = new Ed25519Provider(key);
    const staticDid = new DID({
      // @ts-expect-error: Ignore type error
      resolver: KeyResolver.getResolver(),
      provider
    });
    await staticDid.authenticate();
    ceramic.did = staticDid;
    return staticDid;
  }

  try {
    if (uniqueKey) {
      const did = await authenticateDID(uniqueKey);
      composeClient.setDID(did);
      const data: any = await composeClient.executeQuery(`
      mutation {
        createAttestation(input: {
          content: {
            uid: "${uid}"
            schema: "${message.schema}"
            attester: "${account}"
            verifyingContract: "${domain.verifyingContract}"
            easVersion: "${domain.version}"
            version: ${message.version}
            chainId: ${domain.chainId}
            r: "${signature.r}"
            s: "${signature.s}"
            v: ${signature.v}
            types: ${JSON.stringify(types.Attest).replaceAll('"name"', 'name').replaceAll('"type"', 'type')}
            recipient: "${message.recipient}"
            refUID: "${message.refUID}"
            data: "${message.data}"
            time: ${message.time}
          }
        }) 
        {
          document {
            id
            uid
            schema
            attester
            verifyingContract 
            easVersion
            version 
            chainId 
            types{
              name
              type
            }
            r
            s
            v
            recipient
            refUID
            data
            time
          }
        }
      }
    `);
    console.log(data)
      if (data.data.createAttestation.document.id) {
        return res.json(data);
      } else {
        return res.json({
          error: "There was an error processing your write request",
        });
      }
    }
  } catch (err) {
    res.json({
      err,
    });
  }
}
