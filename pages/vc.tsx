"use client";
import React, { useEffect, useState } from "react";
import { networks } from "../utils/networks";
import { AttestationItem } from "../components/AttestationItem";
import { ResolvedAttestation } from "../utils/types";
import { authenticateCeramic } from '../utils';
import { useCeramicContext } from '../context';

export default function Home() {
  const [account, setAccount] = useState("");
  const [network, setNetwork] = useState("");
  const [attestations, setAttestations] = useState<ResolvedAttestation[]>([]);
  const [loading, setLoading] = useState(false);
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
      await createDummyVcs()
      await getAtts()
      
    } else {
      console.log("No authorized account found");
    }

    const chainId: string = await ethereum.request({ method: "eth_chainId" });

    // @ts-expect-error: Ignore the following line
    setNetwork(networks[chainId]);
    ethereum.on("chainChanged", handleChainChanged);
  };

  async function createDummyVcs() {
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
    setAttestations([]);

    //exit call if no attestations are found
    if (!account || !tmpAttestations.data) {
      return;
    }

    //establish allRecords to check whether corresponding confirmations exist
    const allRecords = tmpAttestations.data.attestationIndex.edges;
    const addresses = new Set<string>();

    allRecords.forEach((att: any) => {
      const obj = att.node;
      addresses.add(obj.attester);
      addresses.add(obj.recipient);
    });


    const records: any[] = [];
    allRecords.forEach((att: any) => {
      const item = att.node;
      //if confirm field contains an item, a confirmation has been found
      if (att.node.confirm && att.node.confirm.edges.length) {
        item.confirmation = true;
      }
      item.uid = att.node.uid;
      item.currAccount = account;
      records.push(item);
    });
    setAttestations([...attestations, ...records]);
    console.log(records)
    setLoading(false);
  }

  //method to get all vcs
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
    setAttestations([]);

    //exit call if no attestations are found
    if (!account || !tmpAttestations.data) {
      return;
    }

    //establish allRecords to check whether corresponding confirmations exist
    const allRecords = tmpAttestations.data.attestationIndex.edges;
    const addresses = new Set<string>();

    allRecords.forEach((att: any) => {
      const obj = att.node;
      addresses.add(obj.attester);
      addresses.add(obj.recipient);
    });


    const records: any[] = [];
    allRecords.forEach((att: any) => {
      const item = att.node;
      //if confirm field contains an item, a confirmation has been found
      if (att.node.confirm && att.node.confirm.edges.length) {
        item.confirmation = true;
      }
      item.uid = att.node.uid;
      item.currAccount = account;
      records.push(item);
    });
    setAttestations([...attestations, ...records]);
    console.log(records)
    setLoading(false);
  }


  useEffect(() => {
    checkIfWalletIsConnected();
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
            
            <div className="NewConnection">Research Object Reviews.</div>
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
