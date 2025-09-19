import mongoose from "mongoose";

const mailThresholdSchema = new mongoose.Schema({
  DeviceName: String,
  S1L: String,
  S1U: String,
  S2L: String,
  S2U: String,
  S3L: String,
  S3U: String,
  S4L: String,
  S4U: String,
  S5L: String,
  S5U: String,
  S6L: String,
  S6U: String,
  S7L: String,
  S7U: String,
  S8L: String,
  S8U: String,
  S9L: String,
  S9U: String,
  S10L: String,
  S10U: String,
  S11L: String,
  S11U: String,
  S12L: String,
  S12U: String,
  S13L: String,
  S13U: String,
  S14L: String,
  S14U: String,
  S15L: String,
  S15U: String,
  S16L: String,
  S16U: String,
  AlertDelay: String,
  ReportFrequency: String,
  MinLimit: String,
  MaxLimit: String,
  NextReport: String,
});

const sensorThresholdConfigModel = mongoose.model(
  "SensorThresholdConfig",
  mailThresholdSchema
);

export default sensorThresholdConfigModel;
