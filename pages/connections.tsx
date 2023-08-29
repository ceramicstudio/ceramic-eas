"use client";
import React, { useEffect, useState } from "react";
import { networks } from "../utils/networks";
import { AttestationItem } from "../components/AttestationItem";
import { ResolvedAttestation } from "../utils/types";

export default function Home() {
  const [account, setAccount] = useState("");
  const [network, setNetwork] = useState("");
  const [attestations, setAttestations] = useState<ResolvedAttestation[]>([]);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      setAccount(accounts[0].toLowerCase());
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
      setAccount(acc.toLowerCase());
      await getAtts()
      
    } else {
      console.log("No authorized account found");
    }

    const chainId: string = await ethereum.request({ method: "eth_chainId" });

    // @ts-expect-error: Ignore the following line
    setNetwork(networks[chainId]);
    ethereum.on("chainChanged", handleChainChanged);
  };

  async function getAtts() {
    setLoading(true);
    const requestBody = { account };
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    };
    const tmpAttestations = await fetch("/api/all", requestOptions)
      .then((response) => response.json())
      .then((data) => data);
    console.log(tmpAttestations.data);
    setAttestations([]);

    if (!account || !tmpAttestations.data) {
      // setLoading(false);
      return;
    }
    // const tmpAttestations = await getAttestationsForAddress(address);
    console.log(tmpAttestations.data.attestationIndex.edges);
    const allRecords = tmpAttestations.data.attestationIndex.edges;
    const addresses = new Set<string>();

    allRecords.forEach((att: any) => {
      const obj = att.node;
      addresses.add(obj.attester);
      addresses.add(obj.recipient);
    });

    // const ensNames = await getENSNames(Array.from(addresses));

    console.log(addresses);
    // const ensNames = await getENSNames(Array.from(addresses))
    const stringified = JSON.stringify(allRecords);

    const reqOpts = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: stringified,
    };

    console.log(allRecords);

    let confirmations: any;
    if (allRecords.length) {
      confirmations = await fetch("/api/confirmations", reqOpts)
        .then((response) => response.json())
        .then((data) => data);

      console.log(confirmations);
    }

    const records: any[] = [];
    allRecords.forEach((att: any) => {
      const item = att.node;
      // console.log(item)
      // const amIAttester = item.attester.toLowerCase() === address.toLowerCase();

      if (att.node.confirm.edges.length) {
        item.confirmation = true;
      }
      item.uid = att.node.uid;
      records.push(item);
    });

    setAttestations([...attestations, ...records]);
    setLoading(false);
  }


  useEffect(() => {
    
    
    checkIfWalletIsConnected();
    // console.log(attestations.length)
  }, [account]);

  return (
    <>
      <div className="relative flex flex-1">
        <div className="flex-center flex h-full flex-1 flex-col items-center justify-center text-center">
          <div className="Container">
            {account.length && (
              <div className="right">
                <img alt="Network logo" className="logo" src={"/ethlogo.png"} />

                <p style={{ textAlign: "center" }}>
                  {" "}
                  Connected with: {account.slice(0, 6)}...{account.slice(-4)}{" "}
                </p>
              </div>
            )}
            <a
              className="SubText"
              href={"/"}
              style={{
                margin: "auto",
                position: "relative",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              Back home
            </a>
            <div className="GradientBar" />
            
            <div className="NewConnection">Who you met IRL.</div>
            <div className="AttestationHolder">
              <div className="WhiteBox">
                {loading && <div>Loading...</div>}
                {!loading && !attestations.length &&  <div>No one here</div>}
                {attestations.length > 0 || loading ? (
                  attestations.map((attestation, i) => (
                    <AttestationItem key={i} data={attestation} />
                  ))
                ) : (
                  <div></div>
                )}
                {!account && <button className="MetButton" onClick={async () => connectWallet()}>Connect Wallet</button>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}