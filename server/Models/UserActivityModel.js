import mongoose from "mongoose";

const userActivitySchema = new mongoose.Schema({
  Email: String,
  Name: String,
  ActivityType: String,
  Action: String,
  Ip: String,
  City: String,
  Region: String,
  Country: String,
  Latitude: String,
  Longitude: String,
  Isp: String,
  Time: String,
});

const userActivityModel = mongoose.model("userActivity", userActivitySchema);

export default userActivityModel;
