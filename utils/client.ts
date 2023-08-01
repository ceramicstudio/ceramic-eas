import * as LitJsSdk from "@lit-protocol/lit-node-client-nodejs";

/**
 * Starts Lit Client in background. should be run upon starting of project.
 *
 * @param {Window} window the window of the project, to which it attaches
 * a litNodeClient
 */

declare global {
  interface Window {
    [index: string]: any;
  }
}

export async function startLitClient(window: Window) {
  console.log("Starting Lit Client...");
  const client = new LitJsSdk.LitNodeClientNodeJs(window);
  client.connect();
  window.litNodeClient = client;
}
