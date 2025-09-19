import mongoose from "mongoose";

const alertMailTimeSchema = new mongoose.Schema({
  DeviceName: String,
  AlertTime: String,
  MailContent: [String],
});

const alertMailContentModel = mongoose.model(
  "alertMailContent",
  alertMailTimeSchema
);

export default alertMailContentModel;
