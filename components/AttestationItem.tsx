import { useState, useEffect } from "react";

import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import dayjs from "dayjs";
import { ethers } from "ethers";
import { MdOutlineVerified, MdVerified } from "react-icons/md";
import "../styles/styles.css";
import { Identicon } from "./Identicon";
import { theme } from "../utils/theme";
import { ResolvedAttestation } from "../utils/types";
import {
  CUSTOM_SCHEMAS,
  EASContractAddress,
  baseURL,
  timeFormatString,
} from "../utils/utils";

type Props = {
  data: ResolvedAttestation;
};

const eas = new EAS(EASContractAddress);

export function AttestationItem({ data }: Props) {
  const address = data.recipient;
  const [confirming, setConfirming] = useState(false);

  if (!address) return null;

  const isAttester = data.attester.toLowerCase() === address.toLowerCase();
  let isConfirmed = !!data.confirmation;
  const isConfirmable = !isAttester && !isConfirmed;

  let Icon = MdVerified;

  if (!isConfirmed) {
    Icon = MdOutlineVerified;
  }

  return (
    <div
      className="Container"
      onClick={() => {
        window.open(`${baseURL}/attestation/view/${data.id}`);
      }}
    >
      <div className="IconHolder">
        <Identicon
          address={isAttester ? data.recipient : data.attester}
          size={60}
        />
      </div>
      <div className="NameHolder">
        <p>From:</p> {data.attester} <p>To:</p> {data.recipient}
      </div>
      <div className="Time">
        {dayjs.unix(data.time).format(timeFormatString)}
      </div>
      <div className="Check">
        {isConfirmable ? (
          <button
            className="ConfirmButton"
            onClick={async (e) => {
              e.stopPropagation();
              setConfirming(true);
              try {
                const provider = new ethers.providers.Web3Provider(
                  window.ethereum as unknown as ethers.providers.ExternalProvider
                );
                const signer = provider.getSigner();
                console.log(signer);
                eas.connect(signer);

                const schemaEncoder = new SchemaEncoder("bool confirm");
                const encoded = schemaEncoder.encodeData([
                  { name: "confirm", type: "bool", value: true },
                ]);

                // const recipient = data.attester;
                const offchain = await eas.getOffchain();
                const time = Math.floor(Date.now() / 1000);
                const offchainAttestation =
                  await offchain.signOffchainAttestation(
                    {
                      recipient: ethers.constants.AddressZero,
                      // Unix timestamp of when attestation expires. (0 for no expiration)
                      expirationTime: 0,
                      // Unix timestamp of current time
                      time,
                      revocable: true,
                      version: 1,
                      nonce: 0,
                      schema: CUSTOM_SCHEMAS.CONFIRM_SCHEMA,
                      refUID: data.uid,
                      data: encoded,
                    },
                    signer
                  );

                // const transaction = await eas.timestamp(offchainAttestation.uid);

                // // Optional: Wait for the transaction to be validated
                // await transaction.wait();
                const userAddress = await signer.getAddress();
                // offchainAttestation.account = addy
                console.log(offchainAttestation);
                const requestBody = {
                  ...offchainAttestation,
                  account: userAddress,
                  stream: data.id,
                };
                const requestOptions = {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(requestBody),
                };
                await fetch("/api/confirmAttest", requestOptions)
                  .then((response) => response.json())
                  .then((data) => console.log(data));

                setConfirming(false);
                window.location.reload();
              } catch (e) {}
            }}
          >
            {confirming ? "Confirming..." : "Confirm we met"}
          </button>
        ) : (
          <div className="VerifyIconContainer">
            <Icon
              color={
                data.confirmation
                  ? theme.supporting["green-vivid-400"]
                  : theme.neutrals["cool-grey-100"]
              }
              size={22}
            />
          </div>
        )}
      </div>
    </div>
  );
}
