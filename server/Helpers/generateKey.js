// // generate random encryption key
import { randomBytes } from "crypto";

const key = randomBytes(32);
console.log("hex", key.toString("hex")); // tokens
console.log("base 64", key.toString("base64url")); //api key
