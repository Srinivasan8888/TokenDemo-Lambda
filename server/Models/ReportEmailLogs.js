import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema({
  Accepted: String,
  Rejected: String,
  Errors: String,
  Time: String,
});

const reportEmailLogModel = mongoose.model("reportEmailLog", emailLogSchema);

export default reportEmailLogModel;
