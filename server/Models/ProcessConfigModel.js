import mongoose from "mongoose";

const processSchema = new mongoose.Schema({
  DeviceName: String,
  StartTime: String,
  StoppedTime: String,
  TundishNo: String,
  HeatNo: String,
  Grade: String,
  CastReady: String,
  Section: String,
});

const processConfigModel = mongoose.model("processConfig", processSchema);

export default processConfigModel;
