import { ComposeClient } from "@composedb/client";
import { RuntimeCompositeDefinition } from "@composedb/types";
import { NextApiRequest, NextApiResponse } from "next";
import { useCeramicContext } from "../../context";
import { definition } from "../../src/__generated__/definition.js";
import { authenticateCeramic } from "../../utils";

export default async function createAttestation(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const { message, uid, account, domain, types, signature } = req.body;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clients = useCeramicContext();
  const { composeClient, ceramic } = clients;

  try {
    await authenticateCeramic(ceramic, composeClient);
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
            types: ${JSON.stringify(types.Attest)
              .replaceAll('"name"', "name")
              .replaceAll('"type"', "type")}
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
    console.log(data);
    if (data.data.createAttestation.document.id) {
      return res.json(data);
    } else {
      return res.json({
        error: "There was an error processing your write request",
      });
    }
  } catch (err) {
    res.json({
      err,
    });
  }
}
