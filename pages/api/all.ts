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
                    dataId
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
    const attestations = data.data.attestationIndex.edges.map((x) => x.node);
    const vcData: any = await composeClient.executeQuery(`
      query {
        verifiableCredentialIndex(
      first: 100) {
        edges {
          node {
                issuer
                issuanceDate
                expirationDate
                proofType
                proofPurpose
                proofCreated
                proofValue
                verificationMethod
                credentialSubjectId
                credentialSubject {
                  isVettedResearchObject
                  context
                  researchObjectCID
                }
              }
          }
        }
      }
    `);
    const vcs = vcData.data.verifiableCredentialIndex.edges.map((x) => x.node);

    return res.json({ vcs, attestations });
  } catch (err) {
    res.json({
      err,
    });
  }
}
