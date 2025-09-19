import crypto from "crypto";
import { performance } from "perf_hooks";

const ENCRYPTION_KEY = crypto.randomBytes(32); // 256-bit key
const IV_LENGTH = 16; // AES block size

const encryptData = (data) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");
  return `${iv.toString("base64")}:${encrypted}`;
};

const decryptData = (data) => {
  const [iv, encrypted] = data.split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    ENCRYPTION_KEY,
    Buffer.from(iv, "base64")
  );
  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

// Generate 100 encrypted records with 16 fields each
const generateEncryptedData = () => {
  return Array.from({ length: 1000 }, () => {
    const record = {};
    for (let i = 1; i <= 16; i++) {
      record[`S${i}`] = encryptData(
        String(Math.floor(Math.random() * 500) + 50)
      );
    }
    return record;
  });
};

const encryptedRecords = generateEncryptedData();

// Sequential Decryption
const sequentialDecryption = () => {
  const start = performance.now();
  const decryptedRecords = encryptedRecords.map((record) => {
    const decryptedRecord = {};
    Object.keys(record).forEach((key) => {
      decryptedRecord[key] = decryptData(record[key]);
    });
    return decryptedRecord;
  });
  const end = performance.now();
  console.log(`Sequential Decryption Time: ${(end - start).toFixed(2)} ms`);
  return decryptedRecords;
};

// Parallel Decryption using Promise.all
const parallelDecryption = async () => {
  const start = performance.now();
  const decryptedRecords = await Promise.all(
    encryptedRecords.map(async (record) => {
      const decryptedRecord = {};
      await Promise.all(
        Object.keys(record).map(async (key) => {
          decryptedRecord[key] = await decryptData(record[key]);
        })
      );
      return decryptedRecord;
    })
  );
  const end = performance.now();
  console.log(`Parallel Decryption Time: ${(end - start).toFixed(2)} ms`);
  return decryptedRecords;
};

// Run Tests
sequentialDecryption();
parallelDecryption();
