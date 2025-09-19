import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
const IV_LENGTH = parseInt(process.env.IV_LENGTH);

const encryptData = (data) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");

  const encryptedData = `${iv.toString("base64")}:${encrypted}`;
  return encryptedData;
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

const dataSchema = new mongoose.Schema({
  DeviceName: String,
  S1: String,
  S2: String,
  S3: String,
  S4: String,
  S5: String,
  S6: String,
  S7: String,
  S8: String,
  S9: String,
  S10: String,
  S11: String,
  S12: String,
  S13: String,
  S14: String,
  S15: String,
  S16: String,
  Timestamp: String,
});

dataSchema.pre("save", function (next) {
  try {
    const data = this;

    Object.keys(data.toObject()).forEach((key) => {
      if (
        key !== "_id" &&
        key !== "__v" &&
        key !== "Timestamp" &&
        key !== "DeviceName"
      ) {
        data[key] = encryptData(data[key]);
      }
    });
    next();
  } catch (error) {
    next(error);
  }
});

// add decryptFields method to schema
dataSchema.methods.decryptFields = function () {
  const decryptedFields = {};

  Object.keys(this.toObject()).forEach((field) => {
    if (
      field !== "_id" &&
      field !== "__v" &&
      field !== "Timestamp" &&
      field !== "DeviceName"
    ) {
      decryptedFields[field] = decryptData(this[field]);
    } else {
      decryptedFields[field] = this[field];
    }
  });

  return decryptedFields;
};

// triggered for find queries
dataSchema.post("find", function (data) {
  try {
    data.forEach((data) => {
      if (data.decryptFields) {
        Object.assign(data, data.decryptFields());
      }
    });
  } catch (error) {
    console.error("Decryption error:", error);
  }
});

// triggered for findOne queries
dataSchema.post("findOne", function (data) {
  try {
    if (data && data.decryptFields) {
      Object.assign(data, data.decryptFields());
    }
  } catch (error) {
    console.error("Decryption error:", error);
  }
});

const dataModel = mongoose.model("Data", dataSchema);

export default dataModel;
