import { CeramicClient } from "@ceramicnetwork/http-client";
import { ComposeClient } from "@composedb/client";
import { RuntimeCompositeDefinition } from "@composedb/types";
import { NextApiRequest, NextApiResponse } from "next";

import { definition } from "../../src/__generated__/definition.js";

export default async function createAttestation(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const { account } = req.body;

  //instantiate a ceramic client instance
  const ceramic = new CeramicClient("https://ceramic-temp.hirenodes.io");

  //instantiate a composeDB client instance
  const composeClient = new ComposeClient({
    ceramic: "https://ceramic-temp.hirenodes.io",
    definition: definition as RuntimeCompositeDefinition,
  });

  try {
    console.log(req.body);
    const data: any = await composeClient.executeQuery(`
    query {
      attestationIndex(filters: { 
        where: { 
          recipient: { 
            equalTo: "${account}" 
                    } 
                  }
                } 
          first: 100) {
            edges {
              node {
                    id
                    uid
                    schema
                    attester
                    recipient
                    refUID
                    data
                    time
                    confirm(first: 1){
                      edges{
                        node{
                          id
                        }
                      }
                    }
                }
              }
            }
          }
  `);
    console.log(data);
    return res.json(data);
  } catch (err) {
    res.json({
      err,
    });
  }
}
