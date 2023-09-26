import { ComposeClient } from "@composedb/client";
import { RuntimeCompositeDefinition } from "@composedb/types";
import { NextApiRequest, NextApiResponse } from "next";

import { definition } from "../../src/__generated__/definition.js";

export default async function listAttestations(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {

  //instantiate a composeDB client instance
  const composeClient = new ComposeClient({
    ceramic: "http://localhost:7007",
    definition: definition as RuntimeCompositeDefinition,
  });

  try {
    console.log(req.body.account);
    console.log("listAttestations: about to execute query");
    const data: any = await composeClient.executeQuery(`
            query {
              attestationIndex(filters: {
            } 
          first: 100) {
            edges {
              node {
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
                    refUID
                    data
                    time
                    confirm(first: 1){
                      edges{
                        node{
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
                          refUID
                          data
                          time
                        }
                      }
                    }
                }
              }
            }
          }
      `);
    console.log("listAttestations: found some data: " + JSON.stringify(data));
    return res.json(data);
  } catch (err) {
    console.log("listAttestations: There was an error!");
    res.json({
      err,
    });
  }
}
