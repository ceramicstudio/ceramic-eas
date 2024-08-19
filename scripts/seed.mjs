import { randomBytes } from "crypto";
import { toString } from "uint8arrays/to-string";

const generateSeed = async () => {
  const seed = new Uint8Array(randomBytes(32));
  const stringSeed = toString(seed, "base16");
  console.log(stringSeed);
};
generateSeed();
