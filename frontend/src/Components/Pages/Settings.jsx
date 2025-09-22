import React, { useState, useEffect } from "react";
import Navbar from "../Reusables/Navbar";
import { useOutletContext } from "react-router-dom";
import API from "../../Api/axiosInterceptor";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { FaArrowDownLong, FaArrowUpLong, FaRegTrashCan } from "react-icons/fa6";
import {
  IoLogInSharp,
  IoRibbon,
  IoSend,
  IoEye,
  IoEyeOff,
} from "react-icons/io5";
import { PiPasswordBold } from "react-icons/pi";
import { FaUserCircle } from "react-icons/fa";
import { IoIosMail } from "react-icons/io";

const Settings = () => {
  const { userRole, userEmail, userName } = useOutletContext();

  const [sensorLimits, setSensorLimits] = useState(
    Array.from({ length: 16 }, () => ({ upper: "", lower: "" }))
  );
  const [alertDelay, setAlertDelay] = useState("");
  const [alertMail, setAlertMail] = useState("");
  const [reportFrequency, setReportFrequency] = useState("");
  const [nextReport, setNextReport] = useState("");
  const [reportMail, setReportMail] = useState("");
  const [confirmationPopup, setConfirmationPopup] = useState(false);
  const [requestType, setRequestType] = useState("");
  const [dbAlertMails, setDbAlertMails] = useState([]);
  const [mailToDelete, setMailToDelete] = useState("");
  const [mailIdToDelete, setMailIdToDelete] = useState("");
  const [dbReportMails, setDbReportMails] = useState([]);
  const [oldPass, setOldPass] = useState("");
  const [resetPass, setResetPass] = useState("");
  const [viewPassword, setViewPassword] = useState(false);
  const [viewPassword2, setViewPassword2] = useState(false);
  const [resetPassPopup, setResetPassPopup] = useState(false);

  const logTimeLS = localStorage.getItem("loggedInTime");

  const handleSensorLimit = (index, type, value) => {
    setSensorLimits((prev) =>
      prev.map((sensor, i) =>
        i === index ? { ...sensor, [type]: value } : sensor
      )
    );
  };

  // form submission confirmation logic
  const triggerConfirmation = (e, requestFor) => {
    e?.preventDefault();
    setRequestType(requestFor);
    setConfirmationPopup(true);
  };

  const cancelSubmission = () => {
    setRequestType("");
    setResetPass("");
    setConfirmationPopup(false);
  };

  const confirmSubmission = () => {
    setAlertConfig(requestType);
    setConfirmationPopup(false);
    if (requestType === "reportFrequency") {
      updateCron(reportFrequency);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      setViewPassword(false);
      setViewPassword2(false);
    }, 1000);

    return () => clearTimeout(delay);
  }, [viewPassword, viewPassword2]);

  // set config api
  const setAlertConfig = async (requestFor) => {
    try {
      const response = await API.post("/setAlertConfig", {
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
      });

      if (response.status === 200) {
        if (requestFor !== "verifyOld") {
          toast.success(
            <div className="text-gray-600 break-words whitespace-normal text-sm 2xl:text-base">
              {response.data.message}
            </div>
          );
          setAlertMail("");
          setReportMail("");
          setMailToDelete("");
          setMailIdToDelete("");
          setReportFrequency("");
          getAlertConfig();
          setResetPass("");
        } else {
          if (response.data.isValid) {
            toast.success(
              <div className="text-gray-600 break-words whitespace-normal text-sm 2xl:text-base">
                {response.data.message}
              </div>
            );
            setOldPass("");
            setResetPassPopup(true);
          } else {
            toast.error(
              <div className="text-gray-600 break-words whitespace-normal text-sm 2xl:text-base">
                {response.data.message}
              </div>
            );
          }
        }
      }
    } catch (error) {
      toast.error(
        <div className="text-gray-600 break-words whitespace-normal text-sm 2xl:text-base">
          Server Error!
        </div>
      );
      console.error("setAlertConfig error catched!", error);
    }
  };

  // update cron frequency
  const updateCron = async (cronFrequency) => {
    try {
      await API.post("/updateCronFrequency", { cronFrequency });
    } catch (error) {
      console.error("updateCron error catched!", error);
    }
  };

  // get config api
  const getAlertConfig = async () => {
    try {
      const response = await API.get("/getAlertConfig");

      if (response.status === 200) {
        const formattedLimits = Array.from({ length: 16 }, (_, i) => ({
          lower: response.data.thresholdValues[`S${i + 1}L`] || "",
          upper: response.data.thresholdValues[`S${i + 1}U`] || "",
        }));

        // console.log("configured mails", response.data.configuredMails);
        // console.log("alert mails", response.data.alertMails);
        // console.log("report mails", response.data.reportMails);

        setSensorLimits(formattedLimits);
        setAlertDelay(response.data.thresholdValues.AlertDelay);
        setReportFrequency(response.data.thresholdValues.ReportFrequency);
        setNextReport(response.data.thresholdValues.NextReport);
        setDbAlertMails(response.data.alertMails);
        setDbReportMails(response.data.reportMails);
      }
    } catch (error) {
      toast.error(
        <div className="text-gray-600 break-words whitespace-normal text-sm 2xl:text-base">
          Server Error!
        </div>
      );
      console.error("getAlertConfig error catched!", error);
    }
  };

  useEffect(() => {
    getAlertConfig();
  }, []);

  // console.log("sensor limits", sensorLimits);
  // console.log("db mails", dbAlertMails);

  return (
    <div className="min-h-screen xl:h-screen bg-[#e9edf9] p-4 text-[#1D2B73] flex flex-col gap-4 text-sm 2xl:text-base">
      <div className="xl:h-[8%] flex">
        <Navbar />
      </div>

      <div className="xl:h-[92%] flex">
        <div className="flex flex-col gap-4 bg-white rounded-xl p-4 flex-1">
          {/* info */}
          <div className="flex flex-col md:flex-row gap-4 items-center bg-[#EAEDF9] p-4 rounded-md">
            {/* name */}
            <div className="info-layout">
              <div className="w-[75%] flex items-center gap-1">
                <FaUserCircle className="text-xl text-[#3047C0]" />
                Name <span className="hidden xl:block 2xl:hidden">xl</span>
              </div>
              <div className="info-box">{userName}</div>
            </div>

            {/* email */}
            <div className="info-layout">
              <div className="w-[75%] flex items-center gap-1">
                <IoIosMail className="text-2xl text-[#3047C0]" />
                Email
              </div>
              <div className="info-box">{userEmail}</div>
            </div>

            {/* role */}
            <div className="info-layout">
              <div className="w-[75%] flex items-center gap-1">
                <IoRibbon className="text-xl text-[#3047C0]" />
                Role
              </div>
              <div className="info-box">{userRole}</div>
            </div>

            {/* login */}
            <div className="info-layout">
              <div className="w-[75%] flex items-center gap-1">
                <IoLogInSharp className="text-2xl text-[#3047C0]" />
                Last Login
              </div>
              <div className="info-box md:text-xs xl:text-sm">{logTimeLS}</div>
            </div>

            {/* reset pass */}
            <form
              className="info-layout items-start"
              onSubmit={(e) => {
                e.preventDefault();
                setAlertConfig("verifyOld");
              }}
            >
              <div className="w-[75%] flex items-center gap-1">
                <PiPasswordBold className="text-2xl text-[#3047C0]" />
                <span className="hidden xl:block">Reset Password</span>
                <span className="xl:hidden">Reset Pass</span>
              </div>

              <div className="flex items-center gap-2 w-full">
                <div className="relative w-[85%] md:w-[75%] xl:w-[85%]">
                  <input
                    type={viewPassword ? "text" : "password"}
                    value={oldPass}
                    onChange={(e) => setOldPass(e.target.value)}
                    placeholder="Old Password..."
                    className="info-box w-full"
                    required
                  />

                  <span
                    className="absolute right-3 md:right-1 xl:right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#3047C0] bg-white text-lg"
                    onClick={() => setViewPassword(!viewPassword)}
                  >
                    {viewPassword ? <IoEyeOff /> : <IoEye />}
                  </span>
                </div>

                <div className="w-[15%] md:w-[25%] xl:w-[15%] flex justify-center items-center">
                  <button
                    type="submit"
                    className="rounded-full h-8 w-8 flex justify-center items-center bg-[#3047C0] text-white hover-effect text-lg md:text-sm xl:text-lg"
                  >
                    <IoSend />
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="flex flex-col xl:flex-row flex-1 gap-4">
            {/* threshold settings */}
            <form
              className="bg-[#EAEDF9] p-4 rounded-md w-full xl:w-[60%] flex flex-col gap-6 text-sm 2xl:text-base"
              onSubmit={(e) => triggerConfirmation(e, "threshold")}
            >
              <div className="text-center text-base font-medium">
                {userRole === "user"
                  ? "Sensor Threshold Configuration"
                  : "Sensor Threshold Settings"}
              </div>

              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="flex flex-col justify-between w-full md:w-1/2 gap-4 xl:gap-0">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                      <div>Sensor {i + 1}:</div>

                      <div className="flex items-center gap-1">
                        <FaArrowDownLong className="text-green-500 text-xl w-[15%]" />
                        <input
                          type="number"
                          required
                          value={sensorLimits[i].lower}
                          className="p-1 rounded-sm w-[65%] text-center text-[#3047C0] font-medium"
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (val < 0) {
                              handleSensorLimit(i, "lower", 0);
                            } else {
                              handleSensorLimit(
                                i,
                                "lower",
                                val.toString().replace(/^0+(\d)/, "$1")
                              );
                            }
                          }}
                          readOnly={userRole === "user"}
                        />
                        <div className="w-[20%]">°C</div>
                      </div>

                      <div className="flex items-center gap-1">
                        <FaArrowUpLong className="text-red-500 text-xl w-[15%]" />
                        <input
                          type="number"
                          required
                          value={sensorLimits[i].upper}
                          className="p-1 rounded-sm w-[65%] text-center text-[#3047C0] font-medium"
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (val < 0) {
                              handleSensorLimit(i, "upper", 0);
                            } else {
                              handleSensorLimit(
                                i,
                                "upper",
                                val.toString().replace(/^0+(\d)/, "$1")
                              );
                            }
                          }}
                          readOnly={userRole === "user"}
                        />
                        <div className="w-[20%]">°C</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col justify-between w-full md:w-1/2 gap-4 xl:gap-0">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                      <div>Sensor {i + 9}:</div>

                      <div className="flex items-center gap-1">
                        <FaArrowDownLong className="text-green-500 text-xl w-[15%]" />
                        <input
                          type="number"
                          required
                          value={sensorLimits[i + 8].lower}
                          className="p-1 rounded-sm w-[65%] text-center text-[#3047C0] font-medium"
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (val < 0) {
                              handleSensorLimit(i + 8, "lower", 0);
                            } else {
                              handleSensorLimit(
                                i + 8,
                                "lower",
                                val.toString().replace(/^0+(\d)/, "$1")
                              );
                            }
                          }}
                          readOnly={userRole === "user"}
                        />
                        <div className="w-[20%]">°C</div>
                      </div>

                      <div className="flex items-center gap-1">
                        <FaArrowUpLong className="text-red-500 text-xl w-[15%]" />
                        <input
                          type="number"
                          required
                          value={sensorLimits[i + 8].upper}
                          className="p-1 rounded-sm w-[65%] text-center text-[#3047C0] font-medium"
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (val < 0) {
                              handleSensorLimit(i + 8, "upper", 0);
                            } else {
                              handleSensorLimit(
                                i + 8,
                                "upper",
                                val.toString().replace(/^0+(\d)/, "$1")
                              );
                            }
                          }}
                          readOnly={userRole === "user"}
                        />
                        <div className="w-[20%]">°C</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`flex justify-end ${
                  userRole === "user" && "hidden"
                }`}
              >
                <button className="blue-button" type="submit">
                  Set Threshold
                </button>
              </div>
            </form>

            {/* mail settings */}
            <div className="bg-[#EAEDF9] p-4 rounded-md w-full xl:w-[40%] flex flex-col gap-4 text-xs 2xl:text-base">
              <div className="text-center text-base font-medium">
                {userRole === "user" ? "Mail Configuration" : "Mail Settings"}
              </div>

              {/* alert mail */}
              <div className="flex flex-col gap-4">
                {/* alert mail config */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-4">
                    <div className="w-[65%]">
                      <span className="font-medium">
                        Configured Alert Emails
                      </span>{" "}
                      (max-5):
                    </div>{" "}
                    <label
                      className={`w-[35%] hidden md:${
                        userRole === "user" ? "hidden" : "flex"
                      }`}
                    >
                      New Alert Mail
                    </label>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    {/* added mails */}
                    <div
                      className={`flex flex-col gap-2 ${
                        userRole === "user" ? "w-full" : "w-full md:w-[65%]"
                      }`}
                    >
                      <div
                        className="bg-white p-4 flex flex-col gap-4 h-[85px] overflow-auto"
                        style={{
                          scrollbarWidth: "thin",
                          scrollbarColor: "#E0E3F6 transparent",
                        }}
                      >
                        {dbAlertMails.map((mail, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center"
                          >
                            <li className="text-[#3047C0] font-medium">
                              {mail.Email}
                            </li>
                            <FaRegTrashCan
                              className={`text-xl text-[#3047C0] hover-effect hover:text-red-500 ${
                                userRole === "user" && "hidden"
                              }`}
                              onClick={() => {
                                setMailToDelete(mail.Email);
                                setMailIdToDelete(mail.id);
                                triggerConfirmation(null, "delete");
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* controls */}
                    <form
                      className={`flex flex-col gap-4 w-full md:w-[35%] ${
                        userRole === "user" && "hidden"
                      }`}
                      onSubmit={(e) => {
                        if (dbAlertMails && dbAlertMails.length >= 5) {
                          e.preventDefault();
                          toast.error(
                            <div className="text-gray-600 break-words whitespace-normal text-sm 2xl:text-base">
                              Maximum mail configuration reached!
                            </div>
                          );
                          setAlertMail("");
                        } else if (
                          dbAlertMails &&
                          dbAlertMails.some((mail) => mail.Email === alertMail)
                        ) {
                          e.preventDefault();
                          toast.error(
                            <div className="text-gray-600 break-words whitespace-normal text-sm 2xl:text-base">
                              {alertMail} is already configured!
                            </div>
                          );
                          setAlertMail("");
                        } else {
                          triggerConfirmation(e, "alertMail");
                        }
                      }}
                    >
                      <input
                        type="email"
                        required
                        placeholder="Enter Email..."
                        value={alertMail}
                        onChange={(e) => setAlertMail(e.target.value)}
                        className="p-1 rounded-sm text-center"
                      />

                      <button className="blue-button" type="submit">
                        + Add Email
                      </button>
                    </form>
                  </div>
                </div>

                {/* alert delay settings */}
                <div className={`${userRole === "user" && "hidden"}`}>
                  <div className="font-medium mb-2">Mail Alert Delay:</div>
                  <form
                    className="flex flex-col md:flex-row gap-4"
                    onSubmit={(e) => triggerConfirmation(e, "alertDelay")}
                  >
                    <div className="w-full md:w-[65%] flex flex-col gap-4">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1 w-1/2 hover-effect">
                          <input
                            type="radio"
                            name="delayOpt"
                            value="1 minute"
                            required
                            checked={alertDelay === "1 minute"}
                            onChange={(e) => setAlertDelay(e.target.value)}
                          />
                          <div className="mb-[1.5px]">1 minute</div>
                        </label>

                        <label className="flex items-center gap-1 w-1/2 hover-effect">
                          <input
                            type="radio"
                            name="delayOpt"
                            value="5 minutes"
                            required
                            checked={alertDelay === "5 minutes"}
                            onChange={(e) => setAlertDelay(e.target.value)}
                          />
                          <div className="mb-[1.5px]">5 minutes</div>
                        </label>

                        <label className="flex items-center gap-1 w-1/2 hover-effect">
                          <input
                            type="radio"
                            name="delayOpt"
                            value="10 minutes"
                            required
                            checked={alertDelay === "10 minutes"}
                            onChange={(e) => setAlertDelay(e.target.value)}
                          />
                          <div className="mb-[1.5px]">10 minutes</div>
                        </label>
                      </div>

                      <div className="flex gap-4">
                        <label className="flex items-center gap-1 w-1/2 hover-effect">
                          <input
                            type="radio"
                            name="delayOpt"
                            value="15 minutes"
                            required
                            checked={alertDelay === "15 minutes"}
                            onChange={(e) => setAlertDelay(e.target.value)}
                          />
                          <div className="mb-[1.5px]">15 minutes</div>
                        </label>

                        <label className="flex items-center gap-1 w-1/2 hover-effect">
                          <input
                            type="radio"
                            name="delayOpt"
                            value="30 minutes"
                            required
                            checked={alertDelay === "30 minutes"}
                            onChange={(e) => setAlertDelay(e.target.value)}
                          />
                          <div className="mb-[1.5px]">30 minutes</div>
                        </label>

                        <label className="flex items-center gap-1 w-1/2 hover-effect">
                          <input
                            type="radio"
                            name="delayOpt"
                            value="1 hour"
                            required
                            checked={alertDelay === "1 hour"}
                            onChange={(e) => setAlertDelay(e.target.value)}
                          />
                          <div className="mb-[1.5px]">1 hour</div>
                        </label>
                      </div>
                    </div>

                    <div className="w-full md:w-[35%] flex justify-end items-end">
                      <button className="blue-button w-full" type="submit">
                        Set Alert Delay
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* report mail */}
              <div className="flex flex-col gap-4">
                {/* report mail config */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-4">
                    <div className="w-[65%]">
                      <span className="font-medium">
                        Configured Report Emails
                      </span>{" "}
                      (max-5):
                    </div>{" "}
                    <label
                      className={`w-[35%] hidden md:${
                        userRole === "user" ? "hidden" : "flex"
                      }`}
                    >
                      New Report Mail
                    </label>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    {/* added mails */}
                    <div
                      className={`flex flex-col gap-2 ${
                        userRole === "user" ? "w-full" : "w-full md:w-[65%]"
                      }`}
                    >
                      <div
                        className="bg-white p-4 flex flex-col gap-4 h-[85px] overflow-auto"
                        style={{
                          scrollbarWidth: "thin",
                          scrollbarColor: "#E0E3F6 transparent",
                        }}
                      >
                        {dbReportMails.map((mail, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center"
                          >
                            <li className="text-[#3047C0] font-medium">
                              {mail.Email}
                            </li>
                            <FaRegTrashCan
                              className={`text-xl text-[#3047C0] hover-effect hover:text-red-500 ${
                                userRole === "user" && "hidden"
                              }`}
                              onClick={() => {
                                setMailToDelete(mail.Email);
                                setMailIdToDelete(mail.id);
                                triggerConfirmation(null, "delete");
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* controls */}
                    <form
                      className={`flex flex-col gap-4 w-full md:w-[35%] ${
                        userRole === "user" && "hidden"
                      }`}
                      onSubmit={(e) => {
                        if (dbReportMails && dbReportMails.length >= 5) {
                          e.preventDefault();
                          toast.error(
                            <div className="text-gray-600 break-words whitespace-normal text-sm 2xl:text-base">
                              Maximum mail configuration reached!
                            </div>
                          );
                          setAlertMail("");
                        } else if (
                          dbReportMails &&
                          dbReportMails.some(
                            (mail) => mail.Email === reportMail
                          )
                        ) {
                          e.preventDefault();
                          toast.error(
                            <div className="text-gray-600 break-words whitespace-normal text-sm 2xl:text-base">
                              {reportMail} is already configured!
                            </div>
                          );
                          setAlertMail("");
                        } else {
                          triggerConfirmation(e, "reportMail");
                        }
                      }}
                    >
                      <input
                        type="email"
                        required
                        placeholder="Enter Email..."
                        value={reportMail}
                        onChange={(e) => setReportMail(e.target.value)}
                        className="p-1 rounded-sm text-center"
                      />

                      <button className="blue-button" type="submit">
                        + Add Email
                      </button>
                    </form>
                  </div>
                </div>

                {/* report frequency settings */}
                <div
                  className={`${
                    userRole === "user" && "hidden"
                  } flex flex-col gap-2`}
                >
                  <div className="font-medium mb-2">Report Frequency:</div>
                  <form
                    className="flex flex-col md:flex-row md:items-center gap-4"
                    onSubmit={(e) => {
                      triggerConfirmation(e, "reportFrequency");
                    }}
                  >
                    <div className="w-full md:w-[65%] flex flex-col gap-4">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1 w-1/2 hover-effect">
                          <input
                            type="radio"
                            name="freqOpt"
                            value="daily"
                            required
                            checked={reportFrequency === "daily"}
                            onChange={(e) => setReportFrequency(e.target.value)}
                          />
                          <div className="mb-[1.5px]">Daily</div>
                        </label>

                        <label className="flex items-center gap-1 w-1/2 hover-effect">
                          <input
                            type="radio"
                            name="freqOpt"
                            value="weekly"
                            required
                            checked={reportFrequency === "weekly"}
                            onChange={(e) => setReportFrequency(e.target.value)}
                          />
                          <div className="mb-[1.5px]">Weekly</div>
                        </label>

                        <label className="flex items-center gap-1 w-1/2 hover-effect">
                          <input
                            type="radio"
                            name="freqOpt"
                            value="monthly"
                            required
                            checked={reportFrequency === "monthly"}
                            onChange={(e) => setReportFrequency(e.target.value)}
                          />
                          <div className="mb-[1.5px]">Monthly</div>
                        </label>
                      </div>
                    </div>

                    <div className="w-full md:w-[35%] flex justify-end items-end">
                      <button className="blue-button w-full" type="submit">
                        Set Frequency
                      </button>
                    </div>
                  </form>
                  <div className="font-medium whitespace-normal">
                    Next Report:{" "}
                    <span className="text-[#3047C0] whitespace-normal">
                      {nextReport}
                    </span>
                  </div>
                </div>
              </div>

              {/* alert info */}
              {userRole === "user" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <span className="font-medium">Mail Alert Delay:</span>{" "}
                    <span className="text-[#3047C0] font-medium">
                      {alertDelay}
                    </span>
                  </div>

                  <div>
                    <span className="font-medium">Report Frequency:</span>{" "}
                    <span className="text-[#3047C0] font-medium">
                      {reportFrequency}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* confirmation popup */}
      {confirmationPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-[#EAEDF9] rounded-md px-4 py-6 flex flex-col gap-6">
            <div className="text-sm md:text-base text-center">
              Are you sure you want to <br className="md:hidden" />{" "}
              {requestType === "threshold" ? (
                "update the threshold values?"
              ) : requestType === "alertMail" ? (
                <>
                  add{" "}
                  <span className="font-semibold text-[#3047C0]">
                    {alertMail}
                  </span>{" "}
                  for alert notifications?
                </>
              ) : requestType === "reportMail" ? (
                <>
                  add{" "}
                  <span className="font-semibold text-[#3047C0]">
                    {reportMail}
                  </span>{" "}
                  for auto report mail?
                </>
              ) : requestType === "alertDelay" ? (
                <>
                  set mail alert delay to{" "}
                  <span className="font-semibold text-[#3047C0]">
                    {alertDelay}
                  </span>
                  ?
                </>
              ) : requestType === "reportFrequency" ? (
                <>
                  set mail report frequency to{" "}
                  <span className="font-semibold text-[#3047C0]">
                    {reportFrequency}
                  </span>
                  ?
                </>
              ) : requestType === "reset" ? (
                <>reset your password ?</>
              ) : (
                <>
                  delete{" "}
                  <span className="font-semibold text-[#3047C0]">
                    {mailToDelete}
                  </span>
                  ?
                </>
              )}
            </div>

            <div className="flex gap-2 justify-end text-sm md:text-base">
              <button className="white-button" onClick={cancelSubmission}>
                Cancel
              </button>

              <button className="blue-button" onClick={confirmSubmission}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* reset popup */}
      {resetPassPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <form
            className="bg-[#EAEDF9] rounded-md px-4 py-6 flex flex-col gap-6"
            onSubmit={(e) => {
              triggerConfirmation(e, "reset");
              setResetPassPopup(false);
            }}
          >
            <div className="text-center font-medium">Set New Password</div>
            <div className="relative flex items-center">
              <label className="w-1/2">Enter Password</label>
              <input
                type={viewPassword2 ? "text" : "password"}
                value={resetPass}
                onChange={(e) => setResetPass(e.target.value)}
                className="w-1/2 p-1"
                required
              />

              <span
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[#3047C0] bg-white text-lg"
                onClick={() => setViewPassword2(!viewPassword2)}
              >
                {viewPassword2 ? <IoEyeOff /> : <IoEye />}
              </span>
            </div>

            <div className="flex gap-2 justify-end text-sm md:text-base">
              <div
                className="white-button"
                onClick={() => {
                  setResetPassPopup(false);
                  setResetPass("");
                }}
              >
                Cancel
              </div>

              <button className="blue-button" type="submit">
                Reset
              </button>
            </div>
          </form>
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        pauseOnHover={false}
        pauseOnFocusLoss={false}
        theme="light"
      />
    </div>
  );
};

export default Settings;
