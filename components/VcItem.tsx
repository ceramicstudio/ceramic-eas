import { useState } from "react";
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import dayjs from "dayjs";
import { ethers } from "ethers";
import { MdOutlineVerified, MdVerified } from "react-icons/md";
import { Identicon } from "./Identicon";
import { theme } from "../utils/theme";
import { ResolvedAttestation, FullVC } from "../utils/types";
import { useCeramicContext } from "../context";
import { authenticateCeramic } from "../utils";
import {
  CUSTOM_SCHEMAS,
  EASContractAddress,
  baseURL,
  timeFormatString,
} from "../utils/utils";

type Props = {
  data: FullVC;
};


export function VcItem({ data }: Props) {
  const [confirming, setConfirming] = useState(false);
  const clients = useCeramicContext();
  const { composeClient, ceramic } = clients;

  // if (!data.gitcoinPassportId) return null;

  let Icon = MdVerified;

  return (
    <div
      className="AttestContainer"
      onClick={() => {
        window.open(`${baseURL}/attestation/view/${data.id}`);
      }}
    >
      <div className="IconHolder">
      </div>
      <div className="NameHolder">
        <p>From:</p> {data.issuer} <p>To:</p> {data.credentialSubject._id}
      </div>
      <div className="Time">
        {data.proofCreated}
      </div>
      <div className="Check">
      </div>
    </div>
  );
}
