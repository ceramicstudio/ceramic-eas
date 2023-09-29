import { useState } from 'react';
import {
  EAS,
  SchemaEncoder,
  OFFCHAIN_ATTESTATION_VERSION,
  Offchain,
  PartialTypedDataConfig,
} from '@ethereum-attestation-service/eas-sdk';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import { MdOutlineVerified, MdVerified } from 'react-icons/md';
import { Identicon } from './Identicon';
import { theme } from '../utils/theme';
import { FullAttestation } from '../utils/types';
import {
  CUSTOM_SCHEMAS,
  EASContractAddress,
  baseURL,
  timeFormatString,
} from '../utils/utils';

type Props = {
  attestation: FullAttestation;
  vc: any;
};

const eas = new EAS(EASContractAddress);

const generateAttestation = (data) => {
  const schemaEncoder = new SchemaEncoder(
    'bool isVettedResearchObject, string context, string researchObjectCID'
  );
  const toEncode = [
    {
      name: 'isVettedResearchObject',
      type: 'bool',
      value: data.data.isVettedResearchObject,
    },
    {
      name: 'context',
      type: 'string',
      value: data.data.context,
    },
    {
      name: 'researchObjectCID',
      type: 'string',
      value: data.data.researchObjectCID,
    },
  ];

  const encoded = schemaEncoder.encodeData(toEncode);

  return {
    sig: {
      domain: {
        name: 'EAS Attestation',
        version: data.easVersion,
        chainId: data.chainId,
        verifyingContract: data.verifyingContract,
      },
      primaryType: 'Attest',
      types: {
        Attest: data.types,
      },
      signature: {
        r: data.r,
        s: data.s,
        v: data.v,
      },
      uid: data.uid,
      message: {
        version: data.version,
        schema: data.schema,
        refUID: data.refUID,
        time: data.time,
        expirationTime: 0,
        recipient: data.recipient,
        attester: data.attester,
        revocable: true,
        data: encoded,
      },
    },
    signer: data.attester,
  };
};

const generateVc = (data) => {
  return {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://beta.api.schemas.serto.id/v1/public/valid-research-object/2.0/ld-context.json',
    ],
    issuer: {
      id: data.issuer,
    },
    type: ['VerifiableCredential', 'ValidResearchObject'],
    credentialSchema: {
      id: 'https://beta.api.schemas.serto.id/v1/public/valid-research-object/2.0/json-schema.json',
      type: 'JsonSchemaValidator2018',
    },
    issuanceDate: data.issuanceDate,
    expirationDate: data.expirationDate,
    credentialSubject: {
      cid: data.credentialSubject.researchObjectCID,
      isVettedResearchObject: data.credentialSubject.isVettedResearchObject,
      context: data.credentialSubject.context,
    },
    proof: {
      verificationMethod: data.verificationMethod,
      created: data.proofCreated,
      proofPurpose: 'assertionMethod',
      type: 'EthereumEip712Signature2021',
      proofValue: data.proofValue,
      eip712: {
        domain: {
          chainId: 5,
          name: 'VerifiableCredential',
          version: '1',
        },
        types: {
          EIP712Domain: [
            {
              name: 'name',
              type: 'string',
            },
            {
              name: 'version',
              type: 'string',
            },
            {
              name: 'chainId',
              type: 'uint256',
            },
          ],
          CredentialSchema: [
            {
              name: 'id',
              type: 'string',
            },
            {
              name: 'type',
              type: 'string',
            },
          ],
          CredentialSubject: [
            {
              name: 'cid',
              type: 'string',
            },
            {
              name: 'context',
              type: 'string',
            },
            {
              name: 'isVettedResearchObject',
              type: 'bool',
            },
          ],
          Issuer: [
            {
              name: 'id',
              type: 'string',
            },
          ],
          Proof: [
            {
              name: 'created',
              type: 'string',
            },
            {
              name: 'proofPurpose',
              type: 'string',
            },
            {
              name: 'type',
              type: 'string',
            },
            {
              name: 'verificationMethod',
              type: 'string',
            },
          ],
          VerifiableCredential: [
            {
              name: '@context',
              type: 'string[]',
            },
            {
              name: 'credentialSchema',
              type: 'CredentialSchema',
            },
            {
              name: 'credentialSubject',
              type: 'CredentialSubject',
            },
            {
              name: 'expirationDate',
              type: 'string',
            },
            {
              name: 'issuanceDate',
              type: 'string',
            },
            {
              name: 'issuer',
              type: 'Issuer',
            },
            {
              name: 'proof',
              type: 'Proof',
            },
            {
              name: 'type',
              type: 'string[]',
            },
          ],
        },
        primaryType: 'VerifiableCredential',
      },
    },
  };
};

export function AttestToVerify({ attestation: atts, vc: vcData }: Props) {
  const address = atts.recipient;
  const [confirming, setConfirming] = useState(false);
  const [validated, setValidated] = useState(false);
  const [generatedAttestation, setGeneratedAttestation] = useState('');
  const [generatedVc, setGeneratedVc] = useState('');

  if (!address) return null;

  const isAttester = atts.attester.toLowerCase() === atts.currAccount;
  return (
    <div
      className="AttestContainer"
      onClick={() => {
        window.open(`${baseURL}/attestation/view/${atts.id}`);
      }}
    >
      <div className="IconHolder">
        {validated && (
          <div style={{ fontSize: '2rem', color: 'green' }}>Valid</div>
        )}
        <Identicon
          address={isAttester ? atts.recipient : atts.attester}
          size={60}
        />
      </div>
      <div className="NameHolder">
        <p>From:</p> {atts.attester}
        <p>researchObjectCID:</p> {atts.data.researchObjectCID}
      </div>
      <div className="Time">
        {dayjs.unix(atts.time).format(timeFormatString)}
      </div>
      <div className="Check">
        {!validated && (
          <button
            className="ConfirmButton"
            onClick={async (e) => {
              e.stopPropagation();
              setConfirming(true);
              try {
                // your offchain attestation
                const attestation = generateAttestation(atts);

                const EAS_CONFIG: PartialTypedDataConfig = {
                  address: attestation.sig.domain.verifyingContract,
                  version: attestation.sig.domain.version,
                  chainId: attestation.sig.domain.chainId,
                };
                const offchain = new Offchain(
                  EAS_CONFIG,
                  OFFCHAIN_ATTESTATION_VERSION
                );
                const isValidAttestation =
                  offchain.verifyOffchainAttestationSignature(
                    attestation.signer,
                    attestation.sig
                  );

                if (isValidAttestation) {
                  setValidated(true);
                }
                setConfirming(false);
              } catch (e) {}
            }}
          >
            {confirming ? 'Verifying...' : 'Verify Attestation'}
          </button>
        )}
      </div>
      <div className="Check">
        {
          <button
            className="ConfirmButton"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const attestation = generateAttestation(atts);
                setGeneratedAttestation(
                  JSON.stringify({
                    signer: attestation.signer,
                    sig: attestation.sig,
                  })
                );
                setGeneratedVc('');
              } catch (e) {}
            }}
          >
            {'Generate Attestation'}
          </button>
        }
      </div>
      <div className="Check">
        {
          <button
            className="ConfirmButton"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const vc = generateVc(vcData);
                setGeneratedVc(JSON.stringify(vc));
                setGeneratedAttestation('');
              } catch (e) {}
            }}
          >
            {'Generate VC'}
          </button>
        }
      </div>
      <div className="NameHolder">
        {generatedAttestation && <div>{generatedAttestation}</div>}
        {generatedVc && <div>{generatedVc}</div>}
      </div>
    </div>
  );
}
