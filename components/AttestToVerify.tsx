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
  data: FullAttestation;
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

export function AttestToVerify({ data }: Props) {
  const address = data.recipient;
  const [confirming, setConfirming] = useState(false);
  const [validated, setValidated] = useState(false);
  const [generatedAttestation, setGeneratedAttestation] = useState('');

  if (!address) return null;

  const isAttester = data.attester.toLowerCase() === data.currAccount;

  return (
    <div
      className="AttestContainer"
      onClick={() => {
        window.open(`${baseURL}/attestation/view/${data.id}`);
      }}
    >
      <div className="IconHolder">
        {validated && (
          <div style={{ fontSize: '2rem', color: 'green' }}>Valid</div>
        )}
        <Identicon
          address={isAttester ? data.recipient : data.attester}
          size={60}
        />
      </div>
      <div className="NameHolder">
        <p>From:</p> {data.attester}
        <p>researchObjectCID:</p> {data.data.researchObjectCID}
      </div>
      <div className="Time">
        {dayjs.unix(data.time).format(timeFormatString)}
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
                const attestation = generateAttestation(data);

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
                const attestation = generateAttestation(data);
                setGeneratedAttestation(
                  JSON.stringify({
                    signer: attestation.signer,
                    sig: attestation.sig,
                  })
                );
              } catch (e) {}
            }}
          >
            {'Generate Attestation'}
          </button>
        }
      </div>
      <div className="NameHolder">
        {generatedAttestation && <div>{generatedAttestation}</div>}
      </div>
    </div>
  );
}
