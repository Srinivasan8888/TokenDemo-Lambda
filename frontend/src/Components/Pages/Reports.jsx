import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import Navbar from "../Reusables/Navbar";
import API from "../../Api/axiosInterceptor";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import reportsVector from "../Assets/reportsVector.png";

import { PiSigmaBold } from "react-icons/pi";
import { TbClockPause } from "react-icons/tb";
import { LuCalendarSearch } from "react-icons/lu";
import { FaHashtag } from "react-icons/fa6";
import { BsFiletypeXlsx } from "react-icons/bs";
import { AiOutlineSchedule } from "react-icons/ai";

// -[#E0E3F6]

const Reports = ({ processConfig }) => {
  const [selectedReportOption, setSelectedReportOption] =
    useState("processOption");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [count, setCount] = useState(100);
  const [avgFromDate, setAvgFromDate] = useState("");
  const [avgToDate, setAvgToDate] = useState("");
  const [avgOption, setAvgOption] = useState("hour");
  const [intFromDate, setIntFromDate] = useState("");
  const [intToDate, setIntToDate] = useState("");
  const [intOption, setIntOption] = useState("hour");
  const [processInfo, setProcessInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const { userEmail, userName } = useOutletContext();

  const filteredProcessConfig = processConfig.filter(
    (data) => data.StoppedTime !== ""
  );

  const handleReportDownload = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await API.get("/getReports", {
        params: {
          fromReports: true,
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
        },
      });
      // console.log("report data", response.data);

      if (response.data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(response.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const info = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(info, `Jindal_Report.xlsx`);
      } else {
        alert("No data found!");
      }
    } catch (error) {
      alert("Error downloading reports!");
      console.error("handleReportDownload error catched!", error);
    } finally {
      setLoading(false);
    }
  };

  // console.log("process config", processConfig);
  // console.log("process info", processInfo);
  // console.log("filtered config", filteredProcessConfig);

  return (
    <div className="min-h-screen h-screen bg-[#e9edf9] p-4 text-[#1D2B73] flex flex-col gap-4">
      <div className="h-[8%] flex">
        <Navbar />
      </div>

      <div className=" h-[92%] p-0 xs:p-2 md:p-4 flex w-full">
        <div className="flex flex-col gap-4 md:gap-0 bg-white rounded-xl w-full">
          {/* report options */}
          <div className="flex flex-col md:flex-row h-[20%] md:h-[13%]">
            <div className="flex flex-col md:flex-row w-full md:w-[80%]">
              <div className="flex w-full md:w-1/2">
                <button
                  className={`report-option w-1/2 rounded-tl-xl ${
                    selectedReportOption === "processOption"
                      ? "bg-[#BFC6EB] border-b-[#3047C0] "
                      : "border-b-white"
                  }`}
                  onClick={() => {
                    setSelectedReportOption("processOption");
                    setCount();
                    setAvgFromDate("");
                    setAvgToDate("");
                    setAvgOption("");
                    setIntFromDate("");
                    setIntToDate("");
                    setIntOption("");
                    setProcessInfo("");
                  }}
                >
                  <AiOutlineSchedule className="text-2xl md:text-5xl 2xl:text-6xl text-[#3047C0]" />{" "}
                  Process Data
                </button>

                <button
                  className={`report-option w-1/2 rounded-tr-xl md:rounded-tr-none ${
                    selectedReportOption === "averageOption1" ||
                    selectedReportOption === "averageOption2"
                      ? "bg-[#BFC6EB] border-b-[#3047C0] "
                      : "border-b-white"
                  }`}
                  onClick={() => {
                    setSelectedReportOption("averageOption1");
                    setAvgOption("hour");
                    setFromDate("");
                    setToDate("");
                    setCount();
                    setIntFromDate("");
                    setIntToDate("");
                    setIntOption("");
                    setProcessInfo("");
                  }}
                >
                  <PiSigmaBold className="text-2xl md:text-5xl 2xl:text-6xl text-[#3047C0]" />
                  Average Data
                </button>
              </div>

              <div className="flex w-full md:w-1/2">
                <button
                  className={`report-option w-1/2 ${
                    selectedReportOption === "intervalOption1" ||
                    selectedReportOption === "intervalOption2"
                      ? "bg-[#BFC6EB] border-b-[#3047C0] "
                      : "border-b-white"
                  }`}
                  onClick={() => {
                    setSelectedReportOption("intervalOption1");
                    setIntOption("hour");
                    setFromDate("");
                    setToDate("");
                    setCount();
                    setAvgFromDate("");
                    setAvgToDate("");
                    setAvgOption("");
                    setProcessInfo("");
                  }}
                >
                  <TbClockPause className="text-2xl md:text-5xl 2xl:text-6xl text-[#3047C0]" />
                  Interval Data
                </button>

                <button
                  className={`report-option w-1/2 ${
                    selectedReportOption === "datePicker"
                      ? "bg-[#BFC6EB] border-b-[#3047C0] "
                      : "border-b-white"
                  }`}
                  onClick={() => {
                    setSelectedReportOption("datePicker");
                    setCount();
                    setAvgFromDate("");
                    setAvgToDate("");
                    setAvgOption("");
                    setIntFromDate("");
                    setIntToDate("");
                    setIntOption("");
                    setProcessInfo("");
                  }}
                >
                  <LuCalendarSearch className="text-2xl md:text-5xl 2xl:text-6xl text-[#3047C0]" />{" "}
                  Date-wise Data
                </button>
              </div>
            </div>

            <div className="flex w-full md:h-auto md:w-[20%]">
              <button
                className={`report-option w-full md:rounded-tr-xl ${
                  selectedReportOption === "countWise1" ||
                  selectedReportOption === "countWise2"
                    ? "bg-[#BFC6EB] border-b-[#3047C0] "
                    : "border-b-white"
                }`}
                onClick={() => {
                  setSelectedReportOption("countWise1");
                  setCount(100);
                  setFromDate("");
                  setToDate("");
                  setAvgFromDate("");
                  setAvgToDate("");
                  setAvgOption("");
                  setIntFromDate("");
                  setIntToDate("");
                  setIntOption("");
                  setProcessInfo("");
                }}
              >
                <FaHashtag className="text-2xl md:text-5xl 2xl:text-6xl text-[#3047C0]" />
                Count-wise Data
              </button>
            </div>
          </div>

          {/* report content */}
          <div className="h-[80%] md:h-[87%] flex flex-col justify-center md:flex-row px-0 py-4 md:px-0 md:py-0">
            {/* image */}
            <div className="w-full h-[40%] xs:h-1/2 md:h-auto md:w-[45%] flex items-center justify-center">
              <img
                src={reportsVector}
                className="max-w-[150px] xs:max-w-[180px] md:max-w-[300px] xl:max-w-[500px] 2xl:max-w-[650px]"
                alt="reports-Img"
              />
            </div>

            {/* process option */}
            {selectedReportOption === "processOption" && (
              <div className="w-full h-[60%] xs:h-1/2 md:h-auto md:w-[55%] flex justify-center items-center">
                <form
                  className="reports-selection"
                  onSubmit={handleReportDownload}
                >
                  <div className="reports-title">Select Process</div>

                  <div className="flex flex-col xs:flex-row md:flex-col lg:flex-row items-center gap-2 xs:gap-0 md:gap-2 lg:gap-0">
                    <label className="w-full xs:w-1/2 md:w-full lg:w-1/2">
                      Completed Processes:
                    </label>
                    <select
                      value={processInfo}
                      required
                      onChange={(e) => setProcessInfo(e.target.value)}
                      className="w-full xs:w-1/2 md:w-full lg:w-1/2 p-1 rounded-sm text-center"
                    >
                      <option value="">--Select--</option>
                      {filteredProcessConfig.map((data, i) => (
                        <option
                          key={i}
                          value={`${data.StartTime}&${data.StoppedTime}`}
                        >
                          {data.StartTime} - Tun:{data.TundishNo} - Heat:
                          {data.HeatNo} - Gd:{data.Grade} - Cast:
                          {data.CastReady} - Sec:{data.Section}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-center">
                    <button className="reports-download">
                      <BsFiletypeXlsx className="text-lg 2xl:text-2xl" />
                      Download Excel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* datepicker */}
            {selectedReportOption === "datePicker" && (
              <div className="w-full h-[60%] xs:h-1/2 md:h-auto md:w-[55%] flex justify-center items-center">
                <form
                  className="reports-selection xl:h-[80%] justify-center"
                  onSubmit={handleReportDownload}
                >
                  <div className="flex flex-col gap-4 xs:gap-6 md:gap-12 2xl:gap-14">
                    <div className="reports-title">Select Date Range</div>

                    <div className="flex items-center">
                      <label className="w-1/2">From</label>
                      <input
                        type="date"
                        className="reports-input"
                        value={fromDate}
                        required
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center">
                      <label className="w-1/2">To</label>
                      <input
                        type="date"
                        className="reports-input"
                        value={toDate}
                        required
                        onChange={(e) => setToDate(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-center">
                      <button className="reports-download">
                        <BsFiletypeXlsx className="text-lg 2xl:text-2xl" />
                        Download Excel
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* count wise */}
            {(selectedReportOption === "countWise1" ||
              selectedReportOption === "countWise2") && (
              <div className="w-full h-[60%] xs:h-1/2 md:h-auto md:w-[55%] flex justify-center items-center">
                <form
                  className="w-[90%] xl:w-[60%] xl:h-[80%] bg-[#EAEDF9] rounded-xl flex flex-col"
                  onSubmit={handleReportDownload}
                >
                  {/* top bar */}
                  <div className="flex">
                    <div
                      className={`report-option w-1/2 rounded-tl-xl   ${
                        selectedReportOption === "countWise1"
                          ? "bg-[#BFC6EB] border-b-[#3047C0] "
                          : "border-b-[#E0E3F6] bg-[#E0E3F6]"
                      }`}
                      onClick={() => {
                        setSelectedReportOption("countWise1");
                        setProcessInfo("");
                        setCount(100);
                      }}
                    >
                      <AiOutlineSchedule className="text-xl md:text-3xl 2xl:text-4xl text-[#3047C0]" />
                      Process-wise
                    </div>
                    <div
                      className={`report-option w-1/2 rounded-tr-xl   ${
                        selectedReportOption === "countWise2"
                          ? "bg-[#BFC6EB] border-b-[#3047C0] "
                          : "border-b-[#E0E3F6] bg-[#E0E3F6]"
                      }`}
                      onClick={() => {
                        setSelectedReportOption("countWise2");
                        setProcessInfo("");
                        setCount(100);
                      }}
                    >
                      <FaHashtag className="text-xl md:text-3xl 2xl:text-4xl text-[#3047C0]" />
                      Count-wise
                    </div>
                  </div>

                  <div
                    className={`p-4 md:p-8 2xl:p-12 flex flex-1 flex-col justify-center text-xs md:text-base 2xl:text-xl ${
                      selectedReportOption === "countWise1"
                        ? "gap-4 xs:gap-6 md:gap-6 2xl:gap-8"
                        : "gap-4 xs:gap-8 md:gap-10 2xl:gap-14"
                    }`}
                  >
                    {selectedReportOption === "countWise1" && ( // process wise count
                      <>
                        <div className="reports-title">Select Process</div>

                        <div className="flex flex-col xs:flex-row items-center md:flex-col lg:flex-row xs:gap-0 md:gap-2 lg:gap-0 gap-2 ">
                          <label className="w-full xs:w-1/2 md:w-full lg:w-1/2">
                            Completed Processes:
                          </label>
                          <select
                            value={processInfo}
                            required
                            onChange={(e) => setProcessInfo(e.target.value)}
                            className="w-full xs:w-1/2 md:w-full lg:w-1/2 p-1 rounded-sm text-center"
                          >
                            <option value="">--Select--</option>
                            {filteredProcessConfig.map((data, i) => (
                              <option
                                key={i}
                                value={`${data.StartTime}&${data.StoppedTime}`}
                              >
                                {data.StartTime} - Tun:{data.TundishNo} - Heat:
                                {data.HeatNo} - Gd:{data.Grade} - Cast:
                                {data.CastReady} - Sec:{data.Section}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    <div
                      className={`reports-title ${
                        selectedReportOption === "countWise1" && "hidden"
                      }`}
                    >
                      Select Data Count
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center justify-center gap-1 w-1/2 hover-effect">
                        <input
                          type="radio"
                          name="countOption"
                          value={100}
                          checked={count === 100}
                          onChange={(e) => setCount(Number(e.target.value))}
                          required
                        />
                        <div className="mb-[1.5px]">Last 100 Data</div>
                      </label>

                      <label className="flex items-center gap-1 w-1/2 hover-effect">
                        <input
                          type="radio"
                          name="countOption"
                          value={250}
                          checked={count === 250}
                          onChange={(e) => setCount(Number(e.target.value))}
                          required
                        />
                        <div className="mb-[1.5px]">Last 250 Data</div>
                      </label>
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center justify-center gap-1 w-1/2 hover-effect">
                        <input
                          type="radio"
                          name="countOption"
                          value={500}
                          checked={count === 500}
                          onChange={(e) => setCount(Number(e.target.value))}
                          required
                        />
                        <div className="mb-[1.5px]">Last 500 Data</div>
                      </label>

                      <label className="flex items-center gap-1 w-1/2 hover-effect">
                        <input
                          type="radio"
                          name="countOption"
                          value={1000}
                          checked={count === 1000}
                          onChange={(e) => setCount(Number(e.target.value))}
                          required
                        />
                        <div className="mb-[1.5px]">Last 1000 Data</div>
                      </label>
                    </div>

                    <div className="flex justify-center">
                      <button className="reports-download">
                        <BsFiletypeXlsx className="text-lg 2xl:text-2xl" />
                        Download Excel
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* average option */}
            {(selectedReportOption === "averageOption1" ||
              selectedReportOption === "averageOption2") && (
              <div className="w-full h-[60%] xs:h-1/2 md:h-auto md:w-[55%] flex justify-center items-center ">
                <form
                  className="w-[90%] xl:w-[60%] xl:h-[80%] bg-[#EAEDF9] rounded-xl flex flex-col"
                  onSubmit={handleReportDownload}
                >
                  {/* top bar */}
                  <div className="flex">
                    <div
                      className={`report-option w-1/2 rounded-tl-xl   ${
                        selectedReportOption === "averageOption1"
                          ? "bg-[#BFC6EB] border-b-[#3047C0] "
                          : "border-b-[#E0E3F6] bg-[#E0E3F6]"
                      }`}
                      onClick={() => {
                        setSelectedReportOption("averageOption1");
                        setProcessInfo("");
                        setAvgOption("hour");
                        setAvgFromDate("");
                        setAvgToDate("");
                      }}
                    >
                      <AiOutlineSchedule className="text-xl md:text-3xl 2xl:text-4xl text-[#3047C0]" />
                      Process-wise
                    </div>
                    <div
                      className={`report-option w-1/2 rounded-tr-xl   ${
                        selectedReportOption === "averageOption2"
                          ? "bg-[#BFC6EB] border-b-[#3047C0] "
                          : "border-b-[#E0E3F6] bg-[#E0E3F6]"
                      }`}
                      onClick={() => {
                        setSelectedReportOption("averageOption2");
                        setProcessInfo("");
                        setAvgOption("hour");
                        setAvgFromDate("");
                        setAvgToDate("");
                      }}
                    >
                      <LuCalendarSearch className="text-xl md:text-3xl 2xl:text-4xl text-[#3047C0]" />
                      Date-wise
                    </div>
                  </div>

                  <div
                    className={`p-4 md:p-10 2xl:p-12 flex flex-1 flex-col justify-center text-xs md:text-base 2xl:text-xl ${
                      selectedReportOption === "averageOption1"
                        ? "gap-4 xs:gap-8 md:gap-10 2xl:gap-14"
                        : "gap-4 xs:gap-6 md:gap-8 2xl:gap-12"
                    }`}
                  >
                    {selectedReportOption === "averageOption1" ? (
                      // process wise average
                      <>
                        <div className="reports-title">Select Process</div>

                        <div className="flex flex-col xs:flex-row md:flex-col lg:flex-row items-center gap-2 xs:gap-0 md:gap-2 lg:gap-0">
                          <label className="w-full xs:w-1/2 md:w-full lg:w-1/2">
                            Completed Processes:
                          </label>
                          <select
                            value={processInfo}
                            required
                            onChange={(e) => setProcessInfo(e.target.value)}
                            className="w-full xs:w-1/2 md:w-full lg:w-1/2 p-1 rounded-sm text-center"
                          >
                            <option value="">--Select--</option>
                            {filteredProcessConfig.map((data, i) => (
                              <option
                                key={i}
                                value={`${data.StartTime}&${data.StoppedTime}`}
                              >
                                {data.StartTime} - Tun:{data.TundishNo} - Heat:
                                {data.HeatNo} - Gd:{data.Grade} - Cast:
                                {data.CastReady} - Sec:{data.Section}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      // date wise average
                      <>
                        <div className="reports-title">Select Date Range</div>

                        <div className="flex items-center">
                          <label className="w-1/2">From</label>
                          <input
                            type="date"
                            className="reports-input"
                            value={avgFromDate}
                            required
                            onChange={(e) => setAvgFromDate(e.target.value)}
                          />
                        </div>

                        <div className="flex items-center">
                          <label className="w-1/2">To</label>
                          <input
                            type="date"
                            className="reports-input"
                            value={avgToDate}
                            required
                            onChange={(e) => setAvgToDate(e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    <div className="flex items-center">
                      <div className="w-1/2">Average By:</div>
                      <div className="w-1/2 flex">
                        <label className="flex items-center gap-1 w-1/2 hover-effect">
                          <input
                            type="radio"
                            name="avgOption"
                            value="hour"
                            required
                            checked={avgOption === "hour"}
                            onChange={(e) => setAvgOption(e.target.value)}
                          />
                          <div className="mb-[1.5px]">Hour</div>
                        </label>

                        <label className="flex items-center gap-1 w-1/2 hover-effect">
                          <input
                            type="radio"
                            name="avgOption"
                            value="day"
                            required
                            checked={avgOption === "day"}
                            onChange={(e) => setAvgOption(e.target.value)}
                          />
                          <div className="mb-[1.5px]">Day</div>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <button className="reports-download">
                        <BsFiletypeXlsx className="text-lg 2xl:text-2xl" />
                        Download Excel
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* interval option */}
            {(selectedReportOption === "intervalOption1" ||
              selectedReportOption === "intervalOption2") && (
              <div className="w-full h-[60%] xs:h-1/2 md:h-auto md:w-[55%] flex justify-center items-center">
                <form
                  className="w-[90%] xl:w-[60%] xl:h-[80%] bg-[#EAEDF9] rounded-xl flex flex-col"
                  onSubmit={handleReportDownload}
                >
                  {/* top bar */}
                  <div className="flex">
                    <div
                      className={`report-option w-1/2 rounded-tl-xl   ${
                        selectedReportOption === "intervalOption1"
                          ? "bg-[#BFC6EB] border-b-[#3047C0] "
                          : "border-b-[#E0E3F6] bg-[#E0E3F6]"
                      }`}
                      onClick={() => {
                        setSelectedReportOption("intervalOption1");
                        setProcessInfo("");
                        setIntOption("hour");
                        setIntFromDate("");
                        setIntToDate("");
                      }}
                    >
                      <AiOutlineSchedule className="text-xl md:text-3xl 2xl:text-4xl text-[#3047C0]" />
                      Process-wise
                    </div>
                    <div
                      className={`report-option w-1/2 rounded-tr-xl   ${
                        selectedReportOption === "intervalOption2"
                          ? "bg-[#BFC6EB] border-b-[#3047C0] "
                          : "border-b-[#E0E3F6] bg-[#E0E3F6]"
                      }`}
                      onClick={() => {
                        setSelectedReportOption("intervalOption2");
                        setProcessInfo("");
                        setIntOption("hour");
                        setIntFromDate("");
                        setIntToDate("");
                      }}
                    >
                      <LuCalendarSearch className="text-xl md:text-3xl 2xl:text-4xl text-[#3047C0]" />
                      Date-wise
                    </div>
                  </div>

                  <div
                    className={`p-4 md:p-10 2xl:p-12 flex flex-1 flex-col justify-center  text-xs md:text-base 2xl:text-xl ${
                      selectedReportOption === "intervalOption1"
                        ? "gap-2 xs:gap-8 md:gap-10 2xl:gap-14"
                        : "gap-2 xs:gap-6 md:gap-8 2xl:gap-12"
                    }`}
                  >
                    {selectedReportOption === "intervalOption1" ? (
                      <>
                        <div className="reports-title">Select Process</div>

                        <div className="flex flex-col xs:flex-row md:flex-col lg:flex-row items-center gap-2 xs:gap-0 md:gap-2 lg:gap-0">
                          <label className="w-full xs:w-1/2 md:w-full lg:w-1/2">
                            Completed Processes:
                          </label>
                          <select
                            value={processInfo}
                            required
                            onChange={(e) => setProcessInfo(e.target.value)}
                            className="w-full xs:w-1/2 md:w-full lg:w-1/2 p-1 rounded-sm text-center"
                          >
                            <option value="">--Select--</option>
                            {filteredProcessConfig.map((data, i) => (
                              <option
                                key={i}
                                value={`${data.StartTime}&${data.StoppedTime}`}
                              >
                                {data.StartTime} - Tun:{data.TundishNo} - Heat:
                                {data.HeatNo} - Gd:{data.Grade} - Cast:
                                {data.CastReady} - Sec:{data.Section}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="reports-title">
                          Select Time Interval
                        </div>

                        <div className="flex items-center">
                          <label className="w-1/2">From</label>
                          <input
                            type="date"
                            className="reports-input"
                            value={intFromDate}
                            required
                            onChange={(e) => setIntFromDate(e.target.value)}
                          />
                        </div>

                        <div className="flex items-center">
                          <label className="w-1/2">To</label>
                          <input
                            type="date"
                            className="reports-input"
                            value={intToDate}
                            required
                            onChange={(e) => setIntToDate(e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    <div className="flex flex-col xs:flex-row items-center gap-1 xs:gap-0">
                      <div className="w-full xs:w-1/2 text-xs md:text-sm 2xl:text-base">
                        Get 1 data for every:
                      </div>

                      <div className="w-full xs:w-1/2 flex">
                        <label className="flex items-center gap-1 w-1/2 hover-effect">
                          <input
                            type="radio"
                            name="intOption"
                            value="hour"
                            required
                            checked={intOption === "hour"}
                            onChange={(e) => setIntOption(e.target.value)}
                          />
                          <div className="mb-[1.5px]">Hour</div>
                        </label>

                        <label className="flex items-center gap-1 w-1/2 hover-effect">
                          <input
                            type="radio"
                            name="intOption"
                            value="day"
                            required
                            checked={intOption === "day"}
                            onChange={(e) => setIntOption(e.target.value)}
                          />
                          <div className="mb-[1.5px]">Day</div>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <button className="reports-download">
                        <BsFiletypeXlsx className="text-lg 2xl:text-2xl" />
                        Download Excel
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-10 text-white">
          Loading...
        </div>
      )}
    </div>
  );
};

export default Reports;
