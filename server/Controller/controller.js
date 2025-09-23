import cron from "node-cron";
import { CronExpressionParser } from "cron-parser";
import moment from "moment";
import PDFDocument from "pdfkit";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { WritableStreamBuffer } from "stream-buffers";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import userModel from "../Models/UserModel.js";
import dataModel from "../Models/DataModel.js";
import processConfigModel from "../Models/ProcessConfigModel.js";
import sensorThresholdConfigModel from "../Models/SensorThresholdConfigModel.js";
import alertEmailConfigModel from "../Models/AlertEmailConfigModel.js";
import alertMailContentModel from "../Models/AlertMailContentModel.js";
import userAlertLogModel from "../Models/UserAlertLogModel.js";
import adminAlertLogModel from "../Models/AdminAlertLogModel.js";
import userActivityModel from "../Models/UserActivityModel.js";
import reportEmailLogModel from "../Models/ReportEmailLogs.js";

import createError from "http-errors";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../Helpers/generateJwt.js";
import client from "../Helpers/initRedis.js";
import nodemailer from "nodemailer";

import logActivityWithLocation from "../utils/logActivityWithLocation.js";
import getPastTime from "../utils/getPastTime.js";

// function to calculate kolkata timestamp
const getCurrentKolkataTimestamp = () => {
  const dateTime = new Date();
  const kolkataTime = dateTime.toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    hour12: false,
  });

  const [datePart, timePart] = kolkataTime.split(",");
  const trimmedTimePart = timePart.trim();
  const [month, date, year] = datePart.split("/");
  const [hour, minute, second] = trimmedTimePart.split(":");

  const adjustedHour = hour === "24" ? "00" : hour.padStart(2, "0");

  return `${year}-${month.padStart(2, "0")}-${date.padStart(
    2,
    "0"
  )},${adjustedHour.padStart(2, "0")}:${minute.padStart(
    2,
    "0"
  )}:${second.padStart(2, "0")}`;
};

// to convert kolkata time to js date object
const getJSTime = (timestamp) => {
  const [datePart, timePart] = timestamp.split(",");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute, second);
};

//  to send alert mail
const sendAlertMail = async (content, time) => {
  try {
    const recipients = await alertEmailConfigModel
      .find({
        DeviceName: "XY001",
        For: "alertMail",
      })
      .sort({ _id: -1 });
    const recipientEmails = recipients.map((recipient) => recipient.Email);

    if (recipientEmails.length === 0) {
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "hotmail",
      auth: {
        user: "jeffrey@xyma.in",
        pass: "zkphnnvntjspjgkr",
      },
    });

    const mailOptions = {
      from: "jeffrey@xyma.in",
      to: recipientEmails.join(","),
      subject: "From Jindal Dashboard: Temperature exceeded threhsold!",
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #d9534f; text-align: center;">🚨 Alert Notification 🚨</h2>
      <p style="font-size: 16px; color: #333;">The following alert message has been received from <strong>Jindal Shadeed Dashboard</strong>:</p>
      <div style="background-color: #fff; padding: 10px; border-left: 4px solid #d9534f; margin-top: 10px;">
        ${content
          .map(
            (data) =>
              `<p style="margin: 5px 0; font-size: 14px; color: #555;">${data}</p>`
          )
          .join("")}
      </div>
      <p style="text-align: center; font-size: 12px; color: #999;">This is an automated message. Please do not reply.</p>
    </div>
  `,
    };

    await transporter.sendMail(mailOptions);

    const alertMailInfo = {
      DeviceName: "XY001",
      AlertTime: time,
      MailContent: content,
    };

    await alertMailContentModel.create(alertMailInfo);

    console.log("alert mail sent!");
  } catch (error) {
    console.error("Error sending mail:", error.message);
  }
};

// generate pdf
const generateReportPdf = async (data, startTime, endTime) => {
  try {
    let imageBuffer;

    if (data.length > 0) {
      const lastDataObj = data[0].toObject();

      const sensorKeys = Object.keys(lastDataObj).filter((key) =>
        key.startsWith("S")
      );

      const sensorColors = [
        "#FF0000",
        "#3047C0",
        "#008000",
        "#FFA500",
        "#800080",
        "#FFC0CB",
        "#A52A2A",
        "#FFFF00",
        "#00FFFF",
        "#FF4500",
        "#4682B4",
        "#32CD32",
        "#8B008B",
        "#FFD700",
        "#708090",
        "#FF69B4",
      ];

      const labels = data.map((item) => item.Timestamp);

      const datasets = sensorKeys.map((sensor, index) => ({
        label: sensor,
        data: data.map((item) => item[sensor] || 0),
        borderColor: sensorColors[index],
        borderWidth: 2,
        pointRadius: 1,
        fill: false,
      }));

      const configuration = {
        type: "line",
        data: {
          labels,
          datasets,
        },
        options: {
          responsive: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
          },
          scales: {
            x: {
              title: { display: true, text: "Time" },
            },
            y: {
              title: { display: true, text: "Sensor Values" },
            },
          },
        },
      };

      const chartJSNodeCanvas = new ChartJSNodeCanvas({
        width: 800,
        height: 600,
      });

      imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    }

    const streamBuffer = new WritableStreamBuffer();

    const doc = new PDFDocument();
    doc.pipe(streamBuffer);

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const coverImage = join(__dirname, "../Assets/coverImage.png");
    const xymaLogo = join(__dirname, "../Assets/xymaLogoBlue.png");
    const disclaimerPage = join(__dirname, "../Assets/disclaimer.png");

    if (fs.existsSync(coverImage)) {
      doc.image(coverImage, 0, 0, { width: 612, height: 792 });
    }
    doc.addPage();

    if (fs.existsSync(xymaLogo)) {
      doc.image(xymaLogo, 500, 30, { width: 100, height: 50 });
      doc.moveDown(2);
    }

    // Add content to the PDF
    doc.fontSize(18).text("Sensor Data Report", { align: "center" });

    doc.moveDown(2);
    doc
      .fontSize(14)
      .text(`This report includes data from ${startTime} to ${endTime}`, {
        align: "center",
      });

    if (data.length > 0) {
      doc.image(imageBuffer, {
        fit: [500, 400],
        align: "center",
        valign: "center",
      });
    } else {
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      doc
        .fontSize(20)
        .fillColor("gray")
        .text("No data available!", pageWidth / 2, pageHeight / 2, {
          align: "center",
          baseline: "middle",
        });
    }

    doc.addPage();

    if (fs.existsSync(disclaimerPage)) {
      doc.image(disclaimerPage, 0, 0, { width: 612, height: 792 });
    }

    doc.end();

    return new Promise((resolve, reject) => {
      streamBuffer.on("finish", () => {
        const pdfBuffer = streamBuffer.getContents();
        resolve(pdfBuffer);
      });
      streamBuffer.on("error", reject);
    });
  } catch (error) {
    console.error("Error generating pdf", error);
  }
};

const sendReport = async (cronFrequency) => {
  try {
    const endTime = moment()
      .set({ hour: 18, minute: 0, second: 0 })
      .format("YYYY-MM-DD,HH:mm:ss");

    let startTime;

    if (cronFrequency === "daily") {
      startTime = moment()
        .subtract(1, "day")
        .set({ hour: 18, minute: 0, second: 0 })
        .format("YYYY-MM-DD,HH:mm:ss");
    } else if (cronFrequency === "weekly") {
      startTime = moment()
        .subtract(7, "days")
        .set({ hour: 18, minute: 0, second: 0 })
        .format("YYYY-MM-DD,HH:mm:ss");
    } else if (cronFrequency === "monthly") {
      startTime = moment()
        .subtract(1, "month")
        .set({ hour: 18, minute: 0, second: 0 })
        .format("YYYY-MM-DD,HH:mm:ss");
    }

    const data = await dataModel.find({
      DeviceName: "XY001",
      Timestamp: {
        $gte: startTime,
        $lte: endTime,
      },
    });

    const recepients = await alertEmailConfigModel.find({
      DeviceName: "XY001",
      For: "reportMail",
    });

    const recepientsEmail = recepients.map((data) => data.Email);

    const pdfBuffer = await generateReportPdf(data, startTime, endTime);

    const transporter = nodemailer.createTransport({
      service: "hotmail",
      auth: {
        user: "jeffrey@xyma.in",
        pass: "zkphnnvntjspjgkr",
      },
    });

    const info = await transporter.sendMail({
      from: "jeffrey@xyma.in",
      to: recepientsEmail.join(","),
      subject: "Jindal Auto Report",
      text: "Please find the attached Jindal data report.",
      attachments: [
        {
          filename: "Sensor_Report.pdf",
          content: pdfBuffer,
        },
      ],
    });

    console.log("Email Sent!");

    const currentTime = getCurrentKolkataTimestamp();

    const logInfo = {
      Accepted: (info.accepted || []).join(", "),
      Rejected: (info.rejected || []).join(", "),
      Errors: (info.rejectedErrors || ["No Error"])
        .map((e) => e?.message || e)
        .join(" | "),
      Time: currentTime,
    };

    await reportEmailLogModel.create(logInfo);
  } catch (error) {
    console.error("Error in sending reports!", error);
  }
};

// http://localhost:4000/backend/userSignup
// http://34.100.135.94:4000/backend/userSignup
// { "Email": "enterUsername", "Password": "enterPassword", "Role": "enterRole", "Name": "enterName"  }
export const userSignup = async (req, res, next) => {
  try {
    const { Email, Password, Role, Name } = req.body;

    if (!Email || !Password || !Role || !Name) throw createError.BadRequest();

    const userExists = await userModel.findOne({ Email });
    if (userExists)
      throw createError.Conflict(`${Email} is already registered`);

    let attributes = {
      Email,
      Password,
      Role,
      Name,
    };

    if (Role === "superAdmin") {
      attributes.AcceptedTC = "yes";
    } else {
      attributes.AcceptedTC = "no";
    }

    const savedUser = await userModel.create(attributes);

    const accessToken = await createAccessToken(savedUser.id, savedUser.Role);
    const refreshToken = await createRefreshToken(savedUser.id, savedUser.Role);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: savedUser,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// login api
export const userLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    // console.log("req body", req.body);

    const user = await userModel.findOne({ Email: username });
    if (!user) throw createError.NotFound("User not registered");

    const validUser = await user.isValidPassword(password);
    if (!validUser) throw createError.Unauthorized("Invalid Credentials");

    // console.log("user from login ->", user.Role);

    const timeStamp = getCurrentKolkataTimestamp();

    const accessToken = await createAccessToken(user.id, user.Role);
    const refreshToken = await createRefreshToken(user.id, user.Role);

    const activityInfo = {
      Email: username,
      Name: user.Name,
      ActivityType: "login",
      Action: "Logged in",
      Time: timeStamp,
    };

    logActivityWithLocation(req, activityInfo);

    res.send({
      accessToken,
      refreshToken,
      role: user.Role,
      timeStamp,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw createError.BadRequest();

    const { userId, role } = await verifyRefreshToken(refreshToken);

    console.log("refresh api triggered --------------->");

    const newAccessToken = await createAccessToken(userId, role);
    const newRefreshToken = await createRefreshToken(userId, role);
    res.send({ newAccessToken, newRefreshToken });
  } catch (error) {
    next(error);
  }
};

export const verifyToken = async (req, res, next) => {
  try {
    const userInfo = await userModel.findById(req.payload.aud);

    const acceptedTC = await userModel.findOne({ Email: userInfo.Email });

    res.status(200).json({
      success: true,
      message: "Access Granted",
      role: req.payload.role,
      name: userInfo.Name,
      email: userInfo.Email,
      acceptedTC: acceptedTC.AcceptedTC,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    console.log("logout api triggered--------------");
    const { refreshToken, accessToken } = req.body;
    // console.log("req body", req.body);

    if (!refreshToken || !accessToken) throw createError.BadRequest();

    const { userId, role } = await verifyRefreshToken(refreshToken);

    const refreshTokenDeleted = await client.DEL(userId);
    const accessTokenDeleted = await client.DEL(`accessToken:${userId}`);

    const userInfo = await userModel.findById(userId);

    const timeStamp = getCurrentKolkataTimestamp();

    const activityInfo = {
      Email: userInfo.Email,
      Name: userInfo.Name,
      ActivityType: "logout",
      Action: "Logged out",
      Time: timeStamp,
    };

    logActivityWithLocation(req, activityInfo);

    if (refreshTokenDeleted && accessTokenDeleted) {
      res.sendStatus(204);
    } else {
      throw createError.Unauthorized("Logout Failed");
    }
  } catch (error) {
    next(error);
  }
};

// http://localhost:4000/backend/insertData
// http://34.100.135.94:4000/backend/insertData

// {
//   "deviceName": "XY001",
//   "s1": "327",
//   "s2": "58",
//   "s3": "295",
//   "s4": "184",
//   "s5": "372",
//   "s6": "121",
//   "s7": "276",
//   "s8": "360",
//   "s9": "99",
//   "s10": "401",
//   "s11": "213",
//   "s12": "332",
//   "s13": "287",
//   "s14": "134",
//   "s15": "258",
//   "s16": "128",
//   "timestamp": "2025-02-12,15:25:34"
// }

export const insertData = async (req, res, next) => {
  try {
    const {
      deviceName,
      s1,
      s2,
      s3,
      s4,
      s5,
      s6,
      s7,
      s8,
      s9,
      s10,
      s11,
      s12,
      s13,
      s14,
      s15,
      s16,
      timestamp,
    } = req.body;

    // console.log("req body", req.body);

    const requiredFields = [
      deviceName,
      s1,
      s2,
      s3,
      s4,
      s5,
      s6,
      s7,
      s8,
      s9,
      s10,
      s11,
      s12,
      s13,
      s14,
      s15,
      s16,
      timestamp,
    ];

    if (requiredFields.some((field) => field === undefined)) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    const sensorThreshold = await sensorThresholdConfigModel.findOne({});
    if (!sensorThreshold) {
      return res.status(500).json({ message: "Threshold data not found." });
    }

    const alertDelays = {
      "1 minute": 1,
      "5 minutes": 5,
      "10 minutes": 10,
      "15 minutes": 15,
      "30 minutes": 30,
      "1 hour": 60,
    };

    const mailDelay = alertDelays[sensorThreshold.AlertDelay];

    const alertMailContent = [];
    const crossedSensorsUpper = [];
    const crossedSensorsLower = [];
    let timestampAdded = false;
    let logTime = "";

    const overallLowerLimit = parseFloat(sensorThreshold.MinLimit);
    const overallUpperLimit = parseFloat(sensorThreshold.MaxLimit);

    // compare sensor values with threshold values
    for (let i = 1; i <= 16; i++) {
      const sensorValue = parseFloat(req.body[`s${i}`]);
      const lowerLimit = parseFloat(sensorThreshold[`S${i}L`]);
      const upperLimit = parseFloat(sensorThreshold[`S${i}U`]);

      // mail threshold
      if (sensorValue <= lowerLimit || sensorValue >= upperLimit) {
        if (!timestampAdded) {
          const crossedTime = getCurrentKolkataTimestamp();
          alertMailContent.push(`Alert Time: ${crossedTime}`);
          timestampAdded = true;
        }

        if (sensorValue <= lowerLimit) {
          alertMailContent.push(
            `Sensor${i}: dropped below the lower limit of ${lowerLimit}°C, Current Temperature: ${sensorValue}°C`
          );
        } else if (sensorValue >= upperLimit) {
          alertMailContent.push(
            `Sensor${i}: exceeded the upper limit of ${upperLimit}°C, Current Temperature: ${sensorValue}°C`
          );
        }
      }

      // dashboard alert log
      if (
        sensorValue <= overallLowerLimit ||
        sensorValue >= overallUpperLimit
      ) {
        logTime = getCurrentKolkataTimestamp();

        if (sensorValue <= overallLowerLimit) {
          crossedSensorsLower.push(`S${i}:(${sensorValue}°C)`);
        } else if (sensorValue >= overallUpperLimit) {
          crossedSensorsUpper.push(`S${i}:(${sensorValue}°C)`);
        }
      }
    }

    // alert log collection
    if (crossedSensorsLower.length > 0 || crossedSensorsUpper.length > 0) {
      const logInfo = {
        DeviceName: "XY001",
        UpperLimit: overallUpperLimit,
        LowerLimit: overallLowerLimit,
        UpperSensors: crossedSensorsUpper,
        LowerSensors: crossedSensorsLower,
        LogTime: logTime,
      };

      await userAlertLogModel.create(logInfo);
      await adminAlertLogModel.create(logInfo);

      console.log("alert logged");
    }

    // alert mail collection
    if (alertMailContent.length > 0) {
      const currentTime = getCurrentKolkataTimestamp();

      const lastMailTime = await alertMailContentModel
        .findOne({})
        .sort({ _id: -1 });

      if (!lastMailTime) {
        sendAlertMail(alertMailContent, currentTime);
      } else {
        const delayTime =
          (new Date(currentTime) - new Date(lastMailTime.AlertTime)) /
          (1000 * 60);

        if (delayTime > mailDelay) {
          sendAlertMail(alertMailContent, currentTime);
        }
      }
    }

    const newData = new dataModel({
      DeviceName: deviceName,
      S1: s1,
      S2: s2,
      S3: s3,
      S4: s4,
      S5: s5,
      S6: s6,
      S7: s7,
      S8: s8,
      S9: s9,
      S10: s10,
      S11: s11,
      S12: s12,
      S13: s13,
      S14: s14,
      S15: s15,
      S16: s16,
      Timestamp: timestamp,
    });

    const savedData = await newData.save();

    res.status(201).json({
      message: "Data inserted successfully!",
      data: savedData,
    });
  } catch (error) {
    next(error);
  }
};

export const getData = async (req, res, next) => {
  try {
    const { intervalOption } = req.query;

    // calculate current time
    const formattedCurrentTime = getCurrentKolkataTimestamp();

    // get threshold value
    const thresholdData = await sensorThresholdConfigModel
      .findOne({ DeviceName: "XY001" })
      .select({ MaxLimit: 1, MinLimit: 1 });

    // get process config
    const processConfig = await processConfigModel
      .find({ DeviceName: "XY001" })
      .sort({ _id: -1 });

    // get last data
    const lastData = await dataModel
      .findOne({ DeviceName: "XY001" })
      .sort({ _id: -1 })
      .select({ _id: 0, __v: 0, DeviceName: 0 });

    // get alert logs
    const alertLogs = await userAlertLogModel.find().sort({ _id: -1 });

    // check process status
    const lastProcess = processConfig[0];

    let timeDiffInMinutes;
    let activityStatus;
    let thresholdStatus = {};

    if (lastData && thresholdData) {
      // activity status
      timeDiffInMinutes =
        (new Date(formattedCurrentTime) - new Date(lastData.Timestamp)) /
        (1000 * 60);

      if (timeDiffInMinutes > 5) {
        activityStatus = "inactive";
      } else if (timeDiffInMinutes <= 5) {
        activityStatus = "active";
      }

      // threhsold status
      for (let i = 1; i <= 16; i++) {
        const key = `S${i}`;
        const value = Number(lastData[key]);

        if (value > thresholdData.MaxLimit) {
          thresholdStatus[key] = "high";
        } else if (value < thresholdData.MinLimit) {
          thresholdStatus[key] = "low";
        } else {
          thresholdStatus[key] = "inRange";
        }
      }
    }

    const formattedPastTime = getPastTime(intervalOption);

    let filteredData = [];
    let timeElapsedString = "N/A";
    let sensorValues = {}
    const stoppedTime = lastProcess?.StoppedTime;

    // process running
    if (stoppedTime === "") {
      filteredData = await dataModel
        .find({
          DeviceName: "XY001",
          Timestamp: {
            $gte: lastProcess.StartTime,
          },
        })
        .sort({ _id: -1 })
        .select({ DeviceName: 0, __v: 0, _id: 0 });

      const startDate = getJSTime(lastProcess.StartTime);
      const currentDate = getJSTime(formattedCurrentTime);

      const timeElapsedMs = currentDate - startDate;
      const timeElapsed = {
        hours: Math.floor(timeElapsedMs / (1000 * 60 * 60)),
        minutes: Math.floor((timeElapsedMs % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((timeElapsedMs % (1000 * 60)) / 1000),
      };

      timeElapsedString = `${String(timeElapsed.hours).padStart(
        2,
        "0"
      )}h : ${String(timeElapsed.minutes).padStart(2, "0")}m : ${String(
        timeElapsed.seconds
      ).padStart(2, "0")}s`;
    }
    // process stopped
    else if (stoppedTime !== "") {
      filteredData = await dataModel
        .find({
          DeviceName: "XY001",
          Timestamp: {
            $gte: formattedPastTime,
            $lte: formattedCurrentTime,
          },
        })
        .sort({ _id: -1 })
        .select({ DeviceName: 0, __v: 0, _id: 0 });
    }

    if (filteredData.length > 0) {
      for (let i = 1; i <= 16; i++) {
        const sensorKey = `S${i}`;

        const sensorData = filteredData.map((data) =>
          parseFloat(data[sensorKey])
        );

        sensorValues[sensorKey] = {
          max: Math.max(...sensorData),
          min: Math.min(...sensorData),
          avg: (
            sensorData.reduce((sum, value) => sum + value, 0) /
            sensorData.length
          ).toFixed(1),
        };
      }
    }

    res.status(200).json({
      data: filteredData,
      sensorValues,
      lastData,
      activityStatus,
      thresholdStatus,
      processConfig,
      timeElapsedString,
      alertLogs,
    });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const {
      initialCall,
      fromReports,
      selectedReportOption,
      fromDate,
      toDate,
      count,
      avgFromDate,
      avgToDate,
      avgOption,
      intFromDate,
      intToDate,
      intOption,
      processInfo,
      userEmail,
      userName,
    } = req.query;

    if (initialCall === "true") {
      const processConfig = await processConfigModel
        .find({ DeviceName: "XY001" })
        .sort({ _id: -1 });

      const filteredProcessConfig = processConfig.filter(
        (data) => data.StoppedTime !== ""
      );

      return res.status(200).json(filteredProcessConfig);
    }

    let formattedFromDate = "";
    let formattedToDate = "";

    // get from and to date from process
    if (processInfo) {
      const split = processInfo.split("&");
      formattedFromDate = split[0];
      formattedToDate = split[1];
    }

    // date picker, process data
    if (
      selectedReportOption === "datePicker" ||
      selectedReportOption === "processOption"
    ) {
      if (selectedReportOption === "datePicker") {
        formattedFromDate = fromDate + ",00:00:00";
        formattedToDate = toDate + ",23:59:59";
      }

      const reportData = await dataModel
        .find({
          DeviceName: "XY001",
          Timestamp: {
            $gte: formattedFromDate,
            $lte: formattedToDate,
          },
        })
        .sort({ _id: -1 })
        .select({ DeviceName: 0, __v: 0, _id: 0 });

      res.status(200).json(reportData);
    }

    // count wise
    else if (
      selectedReportOption === "countWise1" ||
      selectedReportOption === "countWise2"
    ) {
      const query = { DeviceName: "XY001" };

      if (formattedFromDate && formattedToDate) {
        query.Timestamp = {
          $gte: formattedFromDate,
          $lte: formattedToDate,
        };
      }

      const reportData = await dataModel
        .find(query)
        .sort({ _id: -1 })
        .select({ DeviceName: 0, __v: 0, _id: 0 })
        .limit(count);

      res.status(200).json(reportData);
    }

    // average option
    else if (
      selectedReportOption === "averageOption1" ||
      selectedReportOption === "averageOption2"
    ) {
      if (selectedReportOption === "averageOption2") {
        formattedFromDate = avgFromDate + ",00:00:00";
        formattedToDate = avgToDate + ",23:59:59";
      }

      const reportData = await dataModel
        .find({
          DeviceName: "XY001",
          Timestamp: {
            $gte: formattedFromDate,
            $lte: formattedToDate,
          },
        })
        .sort({ _id: -1 })
        .select({ DeviceName: 0, __v: 0, _id: 0 });

      if (reportData.length > 0) {
        // function to group data by hours then average those groups
        const groupAndAverage = (reportData, groupBy) => {
          const groupedData = reportData.reduce((acc, item) => {
            const [date, time] = item.Timestamp.split(",");
            const key =
              groupBy === "hour" ? `${date}-${time.split(":")[0]}` : date;

            if (!acc[key]) {
              acc[key] = { date, hour: time.split(":")[0], sum: {}, count: 0 };
            }

            acc[key].count++;

            for (let i = 1; i <= 16; i++) {
              const sensorKey = `S${i}`;
              const value = parseFloat(item[sensorKey]);
              if (!isNaN(value)) {
                acc[key].sum[sensorKey] =
                  (acc[key].sum[sensorKey] || 0) + value;
              }
            }

            return acc;
          }, {});

          return Object.entries(groupedData).map(([key, group]) => {
            const avgData = {};
            for (let i = 1; i <= 16; i++) {
              const sensorKey = `S${i}`;
              avgData[`avg${sensorKey}`] = (
                group.sum[sensorKey] / group.count
              ).toFixed(2);
            }

            const timeRange =
              groupBy === "hour"
                ? `${group.date},${group.hour}:00:00 to ${group.date},${group.hour}:59:59`
                : `${group.date},00:00:00 to ${group.date},23:59:59`;

            return { ...avgData, dateRange: timeRange };
          });
        };

        if (avgOption === "hour" || avgOption === "day") {
          const averageData = groupAndAverage(reportData, avgOption);
          res.status(200).json(averageData);
        }
      }
    }

    // interval option
    else if (
      selectedReportOption === "intervalOption1" ||
      selectedReportOption === "intervalOption2"
    ) {
      if (selectedReportOption === "intervalOption2") {
        formattedFromDate = intFromDate + ",00:00:00";
        formattedToDate = intToDate + ",23:59:59";
      }

      const reportData = await dataModel
        .find({
          DeviceName: "XY001",
          Timestamp: {
            $gte: formattedFromDate,
            $lte: formattedToDate,
          },
        })
        .select({ DeviceName: 0, __v: 0, _id: 0 });

      if (reportData.length > 0) {
        // get first data of the hour/day
        const groupedData = reportData.reduce((acc, item) => {
          const [date, time] = item.Timestamp.split(",");
          const key =
            intOption === "hour" ? `${date}-${time.split(":")[0]}` : date;

          if (!acc[key]) {
            acc[key] = item;
          }

          return acc;
        }, {});

        const finalArray = Object.values(groupedData).reverse();

        res.status(200).json(finalArray);
      }
    }

    // moitor report download activity
    if (fromReports) {
      const reportTypes = {
        datePicker: "Date-wise data",
        processOption: "Process data",
        countWise1: "Count-wise: process-wise data",
        countWise2: "Count-wise data",
        averageOption1: "Average: process-wise data",
        averageOption2: "Average data",
        intervalOption1: "Interval: process-wise data",
        intervalOption2: "Interval data",
      };

      const downloadedReportType = reportTypes[selectedReportOption];
      const timeStamp = getCurrentKolkataTimestamp();

      const activityInfo = {
        Email: userEmail,
        Name: userName,
        ActivityType: "reportsDownload",
        Action: `Downloaded reports for ${downloadedReportType}`,
        Time: timeStamp,
      };

      logActivityWithLocation(req, activityInfo);
    }
  } catch (error) {
    next(error);
  }
};

// dashboard min max api
export const updateThreshold = async (req, res, next) => {
  try {
    const { lowerLimit, upperLimit, userEmail, userName, requestFor } =
      req.body;

    console.log("req body", req.body);

    // update threshold value
    if (requestFor === "update") {
      console.log("update triggered ------->");
      const data = await sensorThresholdConfigModel
        .findOneAndUpdate(
          { DeviceName: "XY001" },
          { MinLimit: lowerLimit, MaxLimit: upperLimit },
          { new: true, upsert: true }
        )
        .select({ MaxLimit: 1, MinLimit: 1 });

      const timeStamp = getCurrentKolkataTimestamp();

      const activityInfo = {
        Email: userEmail,
        Name: userName,
        ActivityType: "logThrehsold",
        Action: `Updated upper and lower log threhshold to ${upperLimit}°C and ${lowerLimit}°C`,
        Time: timeStamp,
      };

      logActivityWithLocation(req, activityInfo);

      if (data) {
        res.status(200).json(data);
      } else {
        return res.status(404).json({ message: "Threshold update failed" });
      }
    }

    // get threshold value
    else if (requestFor === "get") {
      console.log("get triggered -------->");
      const data = await sensorThresholdConfigModel
        .findOne({ DeviceName: "XY001" })
        .select({ MaxLimit: 1, MinLimit: 1 });

      const acceptedTC = await userModel.findOne({ Email: userEmail });

      // console.log("acespetd tc", acceptedTC.AcceptedTC);

      if (data) {
        res.status(200).json({ data, acceptedTC: acceptedTC.AcceptedTC });
      } else {
        return res.status(404).json({ message: "Threshold data not found" });
      }
    }

    // accept TC
    else if (requestFor === "accept") {
      console.log("tc---");

      await userModel.findOneAndUpdate(
        { Email: userEmail },
        { AcceptedTC: "yes" }
      );

      res.status(200).json({ message: "Terms and Conditions accepted!" });
    }
  } catch (error) {
    next(error);
  }
};

// start process api
export const updateProcessConfig = async (req, res, next) => {
  try {
    const {
      requestFor,
      tundishNo,
      heatNo,
      grade,
      castReady,
      selectedSection,
      userEmail,
      userName,
    } = req.body;

    // console.log("body", req.body);

    const currentTime = getCurrentKolkataTimestamp();

    let activityInfo = {
      Email: userEmail,
      Name: userName,
      ActivityType: "",
      Action: "",
      Time: currentTime,
    };

    // start process
    if (requestFor === "start") {
      await processConfigModel.create({
        DeviceName: "XY001",
        StartTime: currentTime,
        StoppedTime: "",
        TundishNo: tundishNo,
        HeatNo: heatNo,
        Grade: grade,
        CastReady: castReady,
        Section: selectedSection,
      });

      activityInfo.ActivityType = "processStart";
      activityInfo.Action = `Started the process with below configs: Tun.No:${tundishNo}, Ht.No:${heatNo}, Gd:${grade}, CastReady:${castReady}, Sec:${selectedSection}`;

      res.status(200).json({ message: "Process started successfully!" });
    }

    // stop process
    else if (requestFor === "stop") {
      await processConfigModel
        .findOneAndUpdate({}, { StoppedTime: currentTime })
        .sort({ _id: -1 });

      activityInfo.ActivityType = "processStop";
      activityInfo.Action = `Stopped the process`;

      res.status(200).json({ message: "Process stopped successfully!" });
    }

    // clear alert logs
    else if (requestFor === "clear") {
      await userAlertLogModel.deleteMany();

      activityInfo.ActivityType = "clearAlertLogs";
      activityInfo.Action = `Cleared dashboard alert logs`;

      res.status(200).json({ message: "Alert logs cleared successfully!" });
    }

    logActivityWithLocation(req, activityInfo);
  } catch (error) {
    next(error);
  }
};

// settings set api
export const setAlertConfig = async (req, res, next) => {
  try {
    const {
      requestFor,
      sensorLimits,
      alertDelay,
      alertMail,
      mailToDelete,
      mailIdToDelete,
      reportFrequency,
      reportMail,
      userEmail,
      userName,
      oldPass,
      resetPass,
    } = req.body;

    const currentTime = getCurrentKolkataTimestamp();

    let activityInfo = {
      Email: userEmail,
      Name: userName,
      ActivityType: "",
      Action: "",
      Time: currentTime,
    };

    // update threshold
    if (requestFor === "threshold") {
      const thresholdConfig = { DeviceName: "XY001" };

      for (let i = 0; i < 16; i++) {
        thresholdConfig[`S${i + 1}L`] = sensorLimits[i]?.lower || "";
        thresholdConfig[`S${i + 1}U`] = sensorLimits[i]?.upper || "";
      }

      // console.log("threhsld config", thresholdConfig);

      await sensorThresholdConfigModel.findOneAndUpdate(
        {},
        { ...thresholdConfig },
        { new: true, upsert: true }
      );

      const thresholdString = sensorLimits
        .map((data, i) => `[S${i + 1}L:${data.lower}-S${i + 1}U:${data.upper}]`)
        .join(", ");

      activityInfo.ActivityType = "thresholdUpdate";
      activityInfo.Action = `Updated the threshold with below values: ${thresholdString}`;

      res
        .status(200)
        .json({ message: "Sensor threshold updated successfully!" });
    }

    // update alert delay
    else if (requestFor === "alertDelay") {
      await sensorThresholdConfigModel.findOneAndUpdate(
        {},
        { AlertDelay: alertDelay },
        { new: true, upsert: true }
      );

      activityInfo.ActivityType = "alertDelayUpdate";
      activityInfo.Action = `Updated the mail alert delay to: ${alertDelay}`;

      res
        .status(200)
        .json({ message: `Mail alert delay updated to ${alertDelay}!` });
    }

    // update report frequency
    else if (requestFor === "reportFrequency") {
      await sensorThresholdConfigModel.findOneAndUpdate(
        {},
        { ReportFrequency: reportFrequency },
        { new: true, upsert: true }
      );

      activityInfo.ActivityType = "reportFrequencyUpdate";
      activityInfo.Action = `Updated the report frequency to: ${reportFrequency}`;

      res.status(200).json({
        message: `Mail report frequency updated to ${reportFrequency}!`,
      });
    }

    // add alert mail
    else if (requestFor === "alertMail") {
      const configMail = {
        DeviceName: "XY001",
        Email: alertMail,
        For: requestFor,
      };

      await alertEmailConfigModel.create(configMail);

      activityInfo.ActivityType = "alertMailAdd";
      activityInfo.Action = `Added the alert mail: ${alertMail}`;

      res
        .status(200)
        .json({ message: `${alertMail} configured successfully!` });
    }

    // add report mail
    else if (requestFor === "reportMail") {
      const configMail = {
        DeviceName: "XY001",
        Email: reportMail,
        For: requestFor,
      };

      await alertEmailConfigModel.create(configMail);

      activityInfo.ActivityType = "reportMailAdd";
      activityInfo.Action = `Added the report mail: ${reportMail}`;

      res
        .status(200)
        .json({ message: `${reportMail} configured successfully!` });
    }

    // delete mail
    else if (requestFor === "delete") {
      await alertEmailConfigModel.findOneAndDelete({ _id: mailIdToDelete });

      activityInfo.ActivityType = "alertMailDelete";
      activityInfo.Action = `Deleted the mail: ${mailToDelete} from mail settings`;

      res
        .status(200)
        .json({ message: `${mailToDelete} deleted successfully!` });
    }

    // verify old pass
    else if (requestFor === "verifyOld") {
      const user = await userModel.findOne({ Email: userEmail });
      const passValid = await user.isValidPassword(oldPass);

      if (passValid) {
        res.status(200).json({ message: "Password verified!", isValid: true });
      } else {
        res.status(200).json({ message: "Invalid password!", isValid: false });
      }

      activityInfo.ActivityType = "verifyOldPass";
      activityInfo.Action = `Verified their old password`;
    }

    // reset pass
    else if (requestFor === "reset") {
      const user = await userModel.findOne({ Email: userEmail });

      user.Password = resetPass;
      await user.save();

      activityInfo.ActivityType = "resetPass";
      activityInfo.Action = `Updated their password`;

      res.status(200).json({ message: "Password updated successfully!" });
    }

    logActivityWithLocation(req, activityInfo);
  } catch (error) {
    next(error);
  }
};

// settings get api
export const getAlertConfig = async (req, res, next) => {
  try {
    const thresholdValues = await sensorThresholdConfigModel.findOne({});
    const configuredMails = await alertEmailConfigModel
      .find()
      .sort({ _id: -1 });

    let alertMails = [];
    let reportMails = [];

    configuredMails.forEach((data) => {
      if (data.For === "alertMail") {
        alertMails.push({ Email: data.Email, id: data._id });
      } else if (data.For === "reportMail") {
        reportMails.push({ Email: data.Email, id: data._id });
      }
    });

    res.status(200).json({ thresholdValues, alertMails, reportMails });
  } catch (error) {
    next(error);
  }
};

// cron update api
export const updateCronFrequency = async (req, res, next) => {
  try {
    const { cronFrequency } = req.body;

    if (cronFrequency) {
      const cronData = {
        daily: "0 18 * * *",
        weekly: "0 18 * * 1",
        monthly: "0 18 1 * *",
      };

      const cronSyntax = cronData[cronFrequency];

      const interval = CronExpressionParser.parse(cronSyntax);
      const nextReport = interval.next().toLocaleString();

      // console.log("next report -----> ", nextReport);

      scheduleCronReport(cronData[cronFrequency], cronFrequency);

      await sensorThresholdConfigModel.findOneAndUpdate(
        {},
        { NextReport: nextReport },
        { new: true, upsert: true }
      );
    }

    res.status(200).json({ message: "Report frequency updated!" });
  } catch (error) {
    next(error);
  }
};

// admin APIs
export const getUser = async (req, res, next) => {
  try {
    const user = await userModel
      .find({})
      .sort({ _id: -1 })
      .select({ Password: 0, __v: 0 });

    if (!user || user.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) throw createError.BadRequest();

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.Password = newPassword;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.body;

    // console.log("user id", req.body);

    if (!userId) throw createError.BadRequest();

    const deletedUser = await userModel.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { userName } = req.body;

    const user = await userModel.findOne({ Email: userName });

    if (!user) {
      return res.status(404).json({ message: "Invalid User!" });
    }

    const transporter = nodemailer.createTransport({
      service: "hotmail",
      auth: {
        user: "jeffrey@xyma.in",
        pass: "zkphnnvntjspjgkr",
      },
    });

    const mailOptions = {
      from: "jeffrey@xyma.in",
      to: "jeffrey@xyma.in",
      subject: "Password reset request: Jindal Dashboard",
      html: `
      <p>There has been a password reset request from <strong>Jindal Dashboard</strong> for the username <h2 style="color: #4CAF50;">${userName}</h2></p>
    `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Mail sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminData = async (req, res, next) => {
  try {
    const { selectedUser, selectedActivity } = req.query;

    // console.log("query", req.query);

    // get users
    const user = await userModel
      .find({})
      .sort({ _id: -1 })
      .select({ Password: 0, __v: 0 });

    const adminAlertLogs = await adminAlertLogModel.find().sort({ _id: -1 });

    let query = {};

    if (selectedUser !== "" && selectedActivity !== "") {
      query = { Email: selectedUser, ActivityType: selectedActivity };
    } else if (selectedUser !== "" && selectedActivity === "") {
      query = { Email: selectedUser };
    } else if (selectedUser === "" && selectedActivity !== "") {
      query = { ActivityType: selectedActivity };
    } else if (selectedUser === "" && selectedActivity === "") {
      query = {};
    }

    const userActivity = await userActivityModel.find(query).sort({ _id: -1 });

    // mail report logs
    const mailLogs = await reportEmailLogModel.find().sort({ _id: -1 });

    res
      .status(200)
      .json({ users: user, alertLogs: adminAlertLogs, userActivity, mailLogs });
  } catch (error) {
    next(error);
  }
};

// cron report
let cronReport = null;

const scheduleCronReport = (cronSyntax, cronFrequency) => {
  if (cronReport) {
    cronReport.stop();
  }

  // cronReport = cron.schedule("* * * * *", () => {
  cronReport = cron.schedule(cronSyntax, async () => {
    sendReport(cronFrequency);

    const interval = CronExpressionParser.parse(cronSyntax);
    const nextReport = interval.next().toLocaleString();

    await sensorThresholdConfigModel.findOneAndUpdate(
      {},
      { NextReport: nextReport },
      { new: true, upsert: true }
    );
  });
};

export const getSensorData = async (req, res, next) => {
  try {
    const { dateRange, sensorId } = req.query;

    const lastData = await dataModel
      .findOne({ DeviceName: "XY001" })
      .sort({ _id: -1 })
      .select({ [sensorId]: 1, Timestamp: 1 });

    const thresholdData = await sensorThresholdConfigModel
      .findOne({ DeviceName: "XY001" })
      .select({ MaxLimit: 1, MinLimit: 1 });

    let activityStatus = "N/A";
    let thresholdStatus = {};

    const formattedCurrentTime = getCurrentKolkataTimestamp();

    if (lastData && thresholdData) {
      const timeDiffInMinutes =
        (new Date(formattedCurrentTime) - new Date(lastData.Timestamp)) /
        (1000 * 60);

      if (timeDiffInMinutes > 5) {
        activityStatus = "inactive";
      } else if (timeDiffInMinutes <= 5) {
        activityStatus = "active";
      }

      const key = sensorId;
      const value = Number(lastData[key]);

      if (value > thresholdData.MaxLimit) {
        thresholdStatus[key] = "high";
      } else if (value < thresholdData.MinLimit) {
        thresholdStatus[key] = "low";
      } else {
        thresholdStatus[key] = "inRange";
      }
    }

    const formattedPastTime = getPastTime(dateRange);

    const dateRangeData = await dataModel
      .find({
        DeviceName: "XY001",
        Timestamp: {
          $gte: formattedPastTime,
          $lte: formattedCurrentTime,
        },
      })
      .sort({ _id: -1 })
      .select({ [sensorId]: 1, Timestamp: 1 });

    let sensorValues = {};
    let finalArray = [];

    if (dateRangeData.length > 0) {
      //min max avg
      const sensorData = dateRangeData.map((data) =>
        parseFloat(data[sensorId])
      );

      sensorValues[sensorId] = {
        max: Math.max(...sensorData),
        min: Math.min(...sensorData),
        avg: (
          sensorData.reduce((sum, value) => sum + value, 0) /
          sensorData.length
        ).toFixed(1),
      };

      // find hourly average
      const groupedData = dateRangeData.reduce((acc, item) => {
        const [date, time] = item.Timestamp.split(",");
        const hour = time.split(":")[0];

        const key = `${date}-${hour}`;

        if (!acc[key]) {
          acc[key] = { date, hour, sum: 0, count: 0 };
        }

        const value = parseFloat(item[sensorId]);
        if (!isNaN(value)) {
          acc[key].sum += value;
          acc[key].count++;
        }

        return acc;
      }, {});

      finalArray = Object.values(groupedData).map(
        (group, index, array) => {
          const avgValue = (group.sum / group.count).toFixed(2);
          const isFirstEntry = index === array.length - 1;
          const startDate = isFirstEntry
            ? formattedPastTime.split(",")[0]
            : group.date;
          const startTime = isFirstEntry
            ? formattedPastTime.split(",")[1]
            : `${group.hour}:00:00`;

          return {
            [`avg${sensorId}`]: avgValue,
            dateRange: `${startDate},${startTime} to ${group.date},${group.hour}:59:59`,
          };
        }
      );
    }
    res.status(200).json({ finalArray, sensorValues, lastData, activityStatus, thresholdStatus });
  } catch (error) {
    next(error);
  }
};