import { CeramicClient } from "@ceramicnetwork/http-client";
import { ComposeClient } from "@composedb/client";
import { RuntimeCompositeDefinition } from "@composedb/types";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import KeyResolver from "key-did-resolver";
import { NextApiRequest, NextApiResponse } from "next";
import { authenticateCeramic } from "../../utils";
import { useCeramicContext } from "../../context";


export default async function createAttestation(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const { message, uid, account, stream, domain, types, signature } = req.body;
  //instantiate a ceramic client instance
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clients = useCeramicContext();
  const { composeClient, ceramic } = clients;

  try {
    await authenticateCeramic(ceramic, composeClient);
    console.log(req.body);
    const data: any = await composeClient.executeQuery(`
      mutation {
        createConfirm(input: {
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
            types: ${JSON.stringify(types.Attest)
              .replaceAll('"name"', "name")
              .replaceAll('"type"', "type")}
            recipient: "${message.recipient}"
            refUID: "${message.refUID}"
            data: "${message.data}"
            time: ${message.time}
            attestationId: "${stream}"
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
    if (data.data.createConfirm.document.id) {
      return res.json(data);
    } else {
      return res.json({ error: data });
    }
  } catch (err) {
    res.json({
      err,
    });
  }
}
