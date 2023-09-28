import { readFileSync } from "fs";
import { CeramicClient } from "@ceramicnetwork/http-client";
import {
  createComposite,
  readEncodedComposite,
  writeEncodedComposite,
  writeEncodedCompositeRuntime,
} from "@composedb/devtools-node";
import { Composite } from "@composedb/devtools";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { fromString } from "uint8arrays/from-string";

const ceramic = new CeramicClient("https://ceramic-temp.hirenodes.io");

/**
 * @param {Ora} spinner - to provide progress status.
 * @return {Promise<void>} - return void when composite finishes deploying.
 */
export const writeComposite = async (spinner) => {
  await authenticate();
  // spinner.info("writing composite to Ceramic");

  // const researchComposite = await createComposite(
  //   ceramic,
  //   "./composites/00-researchObject.graphql"
  // );

  // const attestationSchema = readFileSync("./composites/00-attestation.graphql", {
  //   encoding: "utf-8",
  // }).replace("$RESEARCH_ID", researchComposite.modelIDs[0]);

  // const attestationComposite = await Composite.create({
  //   ceramic,
  //   schema: attestationSchema,
  // });

  // const confirmSchema = readFileSync("./composites/01-confirm.graphql", {
  //   encoding: "utf-8",
  // }).replace("$ATTESTATION_ID", attestationComposite.modelIDs[1]);

  // const confirmComposite = await Composite.create({
  //   ceramic,
  //   schema: confirmSchema,
  // });

  // const confirmConnectSchema = readFileSync(
  //   "./composites/02-confirmConnect.graphql",
  //   {
  //     encoding: "utf-8",
  //   }
  // )
  //   .replace("$CONFIRM_ID", confirmComposite.modelIDs[1])
  //   .replace("$ATTESTATION_ID", attestationComposite.modelIDs[1]);

  // const confirmConnectComposite = await Composite.create({
  //   ceramic,
  //   schema: confirmConnectSchema,
  // });

  // const gitcoinComposite = await createComposite(
  //   ceramic,
  //   "./composites/04-gitcoinPassport.graphql"
  // );

  // const vcPassportSchema = readFileSync("./composites/04-verifiableCredentialForGitcoinPassport.graphql", {
  //   encoding: "utf-8",
  // }).replace("$PASSPORT_ID", gitcoinComposite.modelIDs[0]);

  // const vcPassportComposite = await Composite.create({
  //   ceramic,
  //   schema: vcPassportSchema,
  // });

  // const composite = Composite.from([
  //   researchComposite,
  //   attestationComposite,
  //   confirmComposite,
  //   confirmConnectComposite,
  //   gitcoinComposite,
  //   vcPassportComposite
  // ]);

  // await writeEncodedComposite(composite, "./src/__generated__/definition.json");
  // spinner.info("creating composite for runtime usage");
  // await writeEncodedCompositeRuntime(
  //   ceramic,
  //   "./src/__generated__/definition.json",
  //   "./src/__generated__/definition.js"
  // );
  // spinner.info("deploying composite");
  // const deployComposite = await readEncodedComposite(
  //   ceramic,
  //   "./src/__generated__/definition.json"
  // );

  // await deployComposite.startIndexingOn(ceramic);
  spinner.succeed("node authenticated");
};

/**
 * Authenticating DID for publishing composite
 * @return {Promise<void>} - return void when DID is authenticated.
 */
const authenticate = async () => {
  const seed = readFileSync("./admin_seed.txt");
  const key = fromString(seed, "base16");
  const did = new DID({
    resolver: getResolver(),
    provider: new Ed25519Provider(key),
  });
  await did.authenticate();
  ceramic.did = did;
};
