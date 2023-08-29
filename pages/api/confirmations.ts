import { CeramicClient } from '@ceramicnetwork/http-client'
import { ComposeClient } from '@composedb/client'
import { RuntimeCompositeDefinition } from '@composedb/types'
import { NextApiRequest, NextApiResponse } from 'next'

import { definition } from '../../src/__generated__/definition.js'

export default async function createAttestation(req: NextApiRequest, res: NextApiResponse<any>) {
  const { account } = req.body

  //instantiate a ceramic client instance
  const ceramic = new CeramicClient('http://localhost:7007')

  //instantiate a composeDB client instance
  const composeClient = new ComposeClient({
    ceramic: 'http://localhost:7007',
    definition: definition as RuntimeCompositeDefinition,
  })

  const allRecords = req.body
  console.log(allRecords, '124')
  try {
    const getRecords = async () => {
      const confirmations = {}

      for (let i = 0; i < allRecords.length; i++) {
        const record = allRecords[i]
        const data: any = await composeClient.executeQuery(`
            query {
              attestationIndex(filters: {
                or: [
          {
            where: {
              attester: { 
                    equalTo: "${record.node.recipient}"
                  } 
            }
          },
          {
            and: {
              where: {
            recipient : {
                    equalTo: "${record.node.attestor}"
                  } 
              }
            }
          }
            ],
            } 
          first: 5) {
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
                }
              }
            }
          }
      `)
        if (data.data.attestationIndex.edges[0]) {
          console.log(data.data.attestationIndex.edges[0], '158')
          // @ts-expect-error: Let's ignore a compile error like this unreachable code
          confirmations[i.toString()] = data.data.attestationIndex.edges[0].node
          console.log(confirmations, '160')
        }
      }
    }

    await getRecords()
    // @ts-expect-error: Let's ignore a compile error like this unreachable code
    return res.json(confirmations)
  } catch (err) {
    return res.json({ error: 'No confirmations to retrieve' })
  }
}
