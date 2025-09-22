import mongoose from "mongoose";

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

const dataModel = mongoose.model("sensor_data", dataSchema);

export default dataModel;