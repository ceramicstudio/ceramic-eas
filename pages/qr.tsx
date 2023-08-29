"use client";
import React, { useEffect, useState } from "react";

import { EAS } from "@ethereum-attestation-service/eas-sdk";
import { motion } from "framer-motion";
import { networks } from "../utils/networks";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

import { FADE_DOWN_ANIMATION_VARIANTS } from "../config/design";

import { EASContractAddress, getENSName } from "../utils/utils";
import "../styles/styles.css";

const eas = new EAS(EASContractAddress);

export default function Home() {
  const [status, setStatus] = useState("");
  const [address, setAddress] = useState("");
  const [ens, setEns] = useState("");
  const [network, setNetwork] = useState("");

  const handleChainChanged = (_chainId: string) => {
    window.location.reload();
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    // Check if we're authorized to access the user's wallet
    const accounts = await ethereum.request({ method: "eth_accounts" });
    // Users can have multiple authorized accounts, we grab the first one if its there!
    if (accounts.length !== 0) {
      const acc = accounts[0];
      console.log("Found an authorized account:", acc);
      setAddress(acc);
      setStatus("connected");
    } else {
      console.log("No authorized account found");
    }

    const chainId: string = await ethereum.request({ method: "eth_chainId" });

    // @ts-expect-error: Ignore the following line
    setNetwork(networks[chainId]);
    ethereum.on("chainChanged", handleChainChanged);
  };

  useEffect(() => {
    async function checkENS() {
      if (!address) return;
      const name = await getENSName(address);
      if (name) {
        setEns(name);
      } else {
        setEns("");
      }
    }
    checkIfWalletIsConnected();
    checkENS();
  }, [address]);

  return (
    <div
      className="Container"
      style={{
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="SmallWhiteBox"
        style={{
          justifyContent: "center",
          display: "flex",
          flexDirection: "column",
          marginTop: "15%",
        }}
      >
        <div style={{ margin: "auto" }} className="FinalAddress">
          {ens ? ens : address}
        </div>

        {address && (
          <QRCodeSVG
            style={{ margin: "auto" }}
            value={`https://metirl.org/?address=${ens ? ens : address}`}
            includeMargin={true}
            size={300}
          />
        )}

        <a className="SubText" href={"/"} style={{ margin: "auto" , textDecoration: "none"}}>
          Back home
        </a>
      </div>
    </div>
  );
}
