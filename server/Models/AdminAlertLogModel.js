import mongoose from "mongoose";

const adminAlertLogSchema = new mongoose.Schema({
  DeviceName: String,
  UpperLimit: String,
  LowerLimit: String,
  UpperSensors: [String],
  LowerSensors: [String],
  LogTime: String,
});

const adminAlertLogModel = mongoose.model("adminAlertLog", adminAlertLogSchema);

export default adminAlertLogModel;
