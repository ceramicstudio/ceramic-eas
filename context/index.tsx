import { createContext, useContext } from "react";
import { CeramicClient } from "@ceramicnetwork/http-client"
import { ComposeClient } from "@composedb/client";
import { fromString } from "uint8arrays/from-string";
import { definition } from "../src/__generated__/definition.js";
import { RuntimeCompositeDefinition } from "@composedb/types";
import { env } from "../env.mjs";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";



const authenticate = async () => {
  const seed = process.env.KEY;
  if(!seed) return;
  const key = fromString(seed, "base16");
  const did = new DID({
    // @ts-ignore
    resolver: getResolver(),
    provider: new Ed25519Provider(key),
  });
  await did.authenticate();
  ceramic.did = did;
  composeClient.setDID(did);
};


/**
 * Configure ceramic Client & create context.
 */
const ceramic = new CeramicClient("https://ceramic-temp.hirenodes.io");

const composeClient = new ComposeClient({
  ceramic: "https://ceramic-temp.hirenodes.io",
  // cast our definition as a RuntimeCompositeDefinition
  definition: definition as RuntimeCompositeDefinition,
});

authenticate();

const CeramicContext = createContext({ceramic: ceramic, composeClient: composeClient});

export const CeramicWrapper = ({ children }: any) => {
  return (
    <CeramicContext.Provider value={{ceramic, composeClient}}>
      {children}
    </CeramicContext.Provider>
  );
};

/**
 * Provide access to the Ceramic & Compose clients.
 * @example const { ceramic, compose } = useCeramicContext()
 * @returns CeramicClient
 */

export const useCeramicContext = () => useContext(CeramicContext);