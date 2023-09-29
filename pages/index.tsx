import { useState, useEffect } from 'react';
import { networks } from '../utils/networks';
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';
import { useCeramicContext } from '../context';
import Link from 'next/link';
import { EASContractAddress } from '../utils/utils';
import { authenticateCeramic } from '../utils';

const eas = new EAS(EASContractAddress);

export default function Home() {
  const [account, setAccount] = useState('');
  const [status, setStatus] = useState('');
  const [address, setAddress] = useState('');
  const [vetted, setIsVetted] = useState(false);
  const [researchCID, setResearchCID] = useState('');
  const [context, setContext] = useState('');
  const [ensResolvedAddress, setEnsResolvedAddress] = useState('Dakh.eth');
  const [attesting, setAttesting] = useState(false);
  const [network, setNetwork] = useState('');
  const clients = useCeramicContext();
  const { ceramic, composeClient } = clients;

  const handleLogin = async () => {
    const accounts = await authenticateCeramic(ceramic, composeClient);
    return accounts;
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert('Get MetaMask -> https://metamask.io/');
        return;
      }
      const accounts = await handleLogin();
      console.log('Connected', accounts[0]);
      setAccount(accounts[0].toLowerCase());
      setStatus('connected');
    } catch (error) {
      console.log(error);
    }
  };

  const handleChainChanged = (_chainId: string) => {
    window.location.reload();
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log('Make sure you have metamask!');
      return;
    } else {
      console.log('We have the ethereum object', ethereum);
    }

    // Check if we're authorized to access the user's wallet
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    // Users can have multiple authorized accounts, we grab the first one if its there!
    if (accounts.length !== 0) {
      const acc = accounts[0];
      console.log('Found an authorized account:', acc);
      setAccount(acc.toLowerCase());
      setStatus('connected');
    } else {
      if (localStorage.getItem('did')) {
        localStorage.removeItem('did');
      }
      console.log('No authorized account found');
    }

    const chainId: string = await ethereum.request({ method: 'eth_chainId' });

    // @ts-expect-error: Ignore the following line
    setNetwork(networks[chainId]);
    ethereum.on('chainChanged', handleChainChanged);
  };

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        // Try to switch to the Mumbai testnet
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1' }], // Check networks.js for hexadecimal network ids
        });
      } catch (error: any) {
        // This error code means that the chain we want has not been added to MetaMask
        // In this case we ask the user to add it to their MetaMask
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '1',
                  chainName: 'Ethereum',
                  rpcUrls: ['https://eth-mainnet-public.unifra.io'],
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  blockExplorerUrls: ['https://etherscan.io'],
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      // If window.ethereum is not found then MetaMask is not installed
      alert(
        'MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html'
      );
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <div className="Container">
      {account && (
        <div className="right">
          <img alt="Network logo" className="logo" src={'/ethlogo.png'} />
          {account.length ? (
            <p style={{ textAlign: 'center' }}>
              {' '}
              Connected with: {account.slice(0, 6)}...{account.slice(-4)}{' '}
            </p>
          ) : (
            <p style={{ textAlign: 'center' }}> Not connected </p>
          )}
        </div>
      )}

      <div className="GradientBar" />
      <div className="WhiteBox">
        <div className="Title">Research Object Attestation</div>

        <div className="InputContainer">
          <input
            className="InputBlock"
            autoCorrect={'off'}
            autoComplete={'off'}
            autoCapitalize={'off'}
            placeholder={'Research Object CID'}
            value={researchCID}
            onChange={(e) => setResearchCID(e.target.value)}
          />
        </div>
        <div className="InputContainer">
          <input
            className="InputBlock"
            autoCorrect={'off'}
            autoComplete={'off'}
            autoCapitalize={'off'}
            placeholder={'Context'}
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>
        <label htmlFor="bool">Is Vetted Research Object?</label>
        <select
          id="bool"
          name="bool"
          value={vetted.toString()}
          onChange={(e) => setIsVetted(e.target.value === 'true')}
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
        {status !== 'connected' ? (
          <button className="MetButton" onClick={async () => connectWallet()}>
            Connect Wallet
          </button>
        ) : network !== 'Mainnet' ? (
          <button className="MetButton" onClick={async () => switchNetwork()}>
            Click here to switch to Mainnet
          </button>
        ) : (
          <button
            className="MetButton"
            onClick={async () => {
              if (status !== 'connected') {
                connectWallet();
              } else {
                setAttesting(true);
                try {
                  await authenticateCeramic(ceramic, composeClient);

                  const provider = new ethers.providers.Web3Provider(
                    window.ethereum as unknown as ethers.providers.ExternalProvider
                  );
                  const signer = provider.getSigner();

                  eas.connect(signer);
                  const schemaEncoder = new SchemaEncoder(
                    'bool isVettedResearchObject, string context, string researchObjectCID'
                  );
                  const toEncode = [
                    {
                      name: 'isVettedResearchObject',
                      type: 'bool',
                      value: vetted,
                    },
                    {
                      name: 'context',
                      type: 'string',
                      value: context,
                    },
                    {
                      name: 'researchObjectCID',
                      type: 'string',
                      value: researchCID,
                    },
                  ];
                  const encoded = schemaEncoder.encodeData(toEncode);

                  if (!vetted || !context || !researchCID) {
                    alert('You are missing an input field');
                    return;
                  }
                  const offchain = await eas.getOffchain();

                  const time = Math.floor(Date.now() / 1000);
                  const offchainAttestation =
                    await offchain.signOffchainAttestation(
                      {
                        recipient: '0x0000000000000000000000000000000000000000',
                        // Unix timestamp of when attestation expires. (0 for no expiration)
                        expirationTime: 0,
                        // Unix timestamp of current time
                        time,
                        revocable: true,
                        version: 1,
                        nonce: 0,
                        schema:
                          '0x2641a807bd8055df8078f1d4e3057f80ffbb2ee681dd7a3fbd53020894ab8d18',
                        refUID:
                          '0x0000000000000000000000000000000000000000000000000000000000000000',
                        data: encoded,
                      },
                      signer
                    );
                  // un-comment the below to process an on-chain timestamp
                  // const transaction = await eas.timestamp(offchainAttestation.uid);
                  // // Optional: Wait for the transaction to be validated
                  // await transaction.wait();
                  const userAddress = await signer.getAddress();
                  console.log(offchainAttestation);
                  const requestBody = {
                    ...offchainAttestation,
                    account: userAddress.toLowerCase(),
                  };

                  const researchObject: any = await composeClient.executeQuery(`
                      mutation{
                        createResearchObjectAttestation(input:{
                          content: {
                            isVettedResearchObject: ${vetted}
                            context: "${context}"
                            researchObjectCID: "${researchCID}"
                          }
                        })
                        {
                          document{
                            id
                            context
                            isVettedResearchObject
                            researchObjectCID
                          }
                        }
                      }
                  `);
                  console.log(researchObject);
                  console.log(
                    researchObject.data.createResearchObjectAttestation.document
                      .id
                  );

                  const data: any = await composeClient.executeQuery(`
                    mutation {
                      createAttestation(input: {
                        content: {
                          uid: "${requestBody.uid}"
                          schema: "${requestBody.message.schema}"
                          attester: "${account}"
                          verifyingContract: "${
                            requestBody.domain.verifyingContract
                          }"
                          easVersion: "${requestBody.domain.version}"
                          version: ${requestBody.message.version}
                          chainId: ${requestBody.domain.chainId}
                          r: "${requestBody.signature.r}"
                          s: "${requestBody.signature.s}"
                          v: ${requestBody.signature.v}
                          types: ${JSON.stringify(requestBody.types.Attest)
                            .replaceAll('"name"', 'name')
                            .replaceAll('"type"', 'type')}
                          recipient: "${requestBody.message.recipient}"
                          refUID: "${requestBody.message.refUID}"
                          dataId: "${
                            researchObject.data.createResearchObjectAttestation
                              .document.id
                          }"
                          time: ${requestBody.message.time}
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
                          data {
                            isVettedResearchObject
                            context
                            researchObjectCID
                          }
                          time
                        }
                      }
                    }
                  `);
                  console.log(data);

                  const resp = await fetch('http://localhost:3000/vc', {
                    method: 'POST',
                    headers: {
                      Accept: 'application/json',
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      cid: researchCID,
                      isVettedResearchObject: vetted,
                      context: context,
                    }),
                  });
                  const vc = await resp.json();

                  const vcData: any = await composeClient.executeQuery(`
                  mutation {
                    createVerifiableCredential(input: {
                      content: {
                        issuer: "${vc.issuer.id}"
                        issuanceDate: "${vc.issuanceDate}"
                        expirationDate: "${vc.expirationDate}"
                        proofType: "${vc.proof.type}"
                        proofPurpose: "${vc.proof.purpose}"
                        proofCreated: "${vc.proof.created}"
                        proofValue: "${vc.proof.proofValue}"
                        verificationMethod: "${vc.proof.verificationMethod}"
                        credentialSubjectId: "${researchObject.data.createResearchObjectAttestation.document.id}"
                      }
                    }) 
                    {
                      document {
                        issuer
                        issuanceDate
                        expirationDate
                        proofType
                        proofPurpose 
                        proofCreated
                        proofValue 
                        verificationMethod 
                        credentialSubject {
                          isVettedResearchObject
                          context
                          researchObjectCID
                        }
                      }
                    }
                  }
                `);
                  console.log('vcData', vcData);
                  setAddress('');
                  setAttesting(false);
                } catch (e) {
                  console.log('🚀 ~ file: index.tsx:350 ~ onClick={ ~ e:', e);
                }
                setAddress('');
                setAttesting(false);
              }
            }}
          >
            {attesting
              ? 'Attesting...'
              : status === 'connected'
              ? 'Make Offchain attestation'
              : 'Connect wallet'}
          </button>
        )}

        {status === 'connected' && (
          <>
            <div className="SubText">
              {' '}
              <Link href="/qr">Show my QR code</Link>
            </div>
            <div className="SubText">
              {' '}
              <Link href="/connections">Connections</Link>
            </div>
            <div className="SubText">
              {' '}
              <Link href="/verify">Verify Attestations</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
