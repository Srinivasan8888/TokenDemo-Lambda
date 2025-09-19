import mongoose from "mongoose";

const alertMailSchema = new mongoose.Schema({
  DeviceName: String,
  Email: String,
  For: String,
});

const alertEmailConfigModel = mongoose.model(
  "alertEmailConfig",
  alertMailSchema
);

export default alertEmailConfigModel;
