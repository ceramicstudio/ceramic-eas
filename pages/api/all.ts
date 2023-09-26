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
    const data: any = await composeClient.executeQuery(`
            query {
              attestationIndex(filters: {
                or: [
          {
            where: {
              attester: { 
                    equalTo: "${req.body.account}"
                  } 
            }
          },
          {
            and: {
              where: {
            recipient : {
                    equalTo: "${req.body.account}"
                  } 
              }
            }
          }
            ],
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
                    recipient
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
                          recipient
                          refUID
                          data
                          dataId
                          time
                        }
                      }
                    }
                }
              }
            }
          }
      `);
    console.log("I found some data in listAttestations: " + JSON.stringify(data));
    return res.json(data);
  } catch (err) {
    console.log("There was an error!);
    res.json({
      err,
    });
  }
}
