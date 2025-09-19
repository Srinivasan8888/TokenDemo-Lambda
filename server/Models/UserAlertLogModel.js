import mongoose from "mongoose";

const userAlertLogSchema = new mongoose.Schema({
  DeviceName: String,
  UpperLimit: String,
  LowerLimit: String,
  UpperSensors: [String],
  LowerSensors: [String],
  LogTime: String,
});

const userAlertLogModel = mongoose.model("userAlertLog", userAlertLogSchema);

export default userAlertLogModel;
