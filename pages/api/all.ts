import { ComposeClient } from '@composedb/client';
import { RuntimeCompositeDefinition } from '@composedb/types';
import { NextApiRequest, NextApiResponse } from 'next';

import { definition } from '../../src/__generated__/definition.js';

export default async function listAttestations(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  //instantiate a composeDB client instance
  const composeClient = new ComposeClient({
    ceramic: 'http://localhost:7007',
    definition: definition as RuntimeCompositeDefinition,
  });

  try {
    console.log(req.body.account);
    const data: any = await composeClient.executeQuery(`
            query {
              attestationIndex(filters: {
          
            where: {
              attester: { 
                    equalTo: "${req.body.account}"
                  } 
            }
          },
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
                    data{
                      isVettedResearchObject
                      context
                      researchObjectCID
                    }
                    time
                }
              }
            }
          }
      `);
    console.log("listAttestation: got data " + JSON.stringify(data));
    return res.json(data);
  } catch (err) {
    res.json({
      err,
    });
  }
}
