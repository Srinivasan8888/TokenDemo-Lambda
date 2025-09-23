import express from "express";
import {
  userSignup,
  userLogin,
  refreshToken,
  verifyToken,
  logout,
  insertData,
  getData,
  getUser,
  changePassword,
  deleteUser,
  forgotPassword,
  getReports,
  updateThreshold,
  updateProcessConfig,
  setAlertConfig,
  getAlertConfig,
  getAdminData,
  updateCronFrequency,
  getSensorData
} from "../Controller/controller.js";
import { verifyAccessToken, verifyApiKey } from "../Helpers/generateJwt.js";

const router = express.Router();

// login API
router.post("/userLogin", userLogin);
router.post("/forgotPassword", forgotPassword);

// token APIs
router.post("/refreshToken", refreshToken);
router.get("/verifyToken", verifyAccessToken, verifyToken);
router.delete("/logout", logout);

// data APIs
router.post("/insertData", verifyApiKey, insertData);
router.get("/getData", verifyAccessToken, getData);
router.get("/getReports", verifyAccessToken, getReports);
router.get("/getSensorData", verifyAccessToken, getSensorData);

// configs
router.post("/updateThreshold", verifyAccessToken, updateThreshold);
router.post("/updateProcessConfig", verifyAccessToken, updateProcessConfig);
router.post("/setAlertConfig", verifyAccessToken, setAlertConfig);
router.get("/getAlertConfig", verifyAccessToken, getAlertConfig);
router.post("/updateCronFrequency", verifyAccessToken, updateCronFrequency);

// admin APIs
router.post("/userSignup", userSignup);
router.get("/getAdminData", verifyAccessToken, getAdminData);
router.get("/getUser", verifyAccessToken, getUser);
router.post("/changePassword", verifyAccessToken, changePassword);
router.delete("/deleteUser", verifyAccessToken, deleteUser);

export default router;
