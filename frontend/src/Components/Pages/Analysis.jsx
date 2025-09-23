import React, { useState, useEffect, useMemo, useRef } from "react";
import Navbar from "../Reusables/Navbar";
import API from "../../Api/axiosInterceptor";

import { PiSigmaBold } from "react-icons/pi";
import { TbClockPause } from "react-icons/tb";
import { LuCalendarSearch, LuChartLine } from "react-icons/lu";
import { FaHashtag } from "react-icons/fa6";
import { FaRedo } from "react-icons/fa";
import { AiOutlineSchedule } from "react-icons/ai";

import { Line } from "react-chartjs-2";
import zoomPlugin from "chartjs-plugin-zoom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

const Analysis = () => {
  const [selectedReportOption, setSelectedReportOption] =
    useState("processOption");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [count, setCount] = useState(100);
  const [avgFromDate, setAvgFromDate] = useState("");
  const [avgToDate, setAvgToDate] = useState("");
  const [avgOption, setAvgOption] = useState("");
  const [intFromDate, setIntFromDate] = useState("");
  const [intToDate, setIntToDate] = useState("");
  const [intOption, setIntOption] = useState("");
  const [analyticsData, setAnalyticsData] = useState([]);
  const [processInfo, setProcessInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [processConfig, setProcessConfig] = useState([]);

  const chartRef = useRef(null);

  const handlePlotGraph = async (initialCall = false) => {
    try {
      setLoading(true);
      const response = await API.get("/getReports", {
        params: {
          initialCall,
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
        },
      });
      // console.log("report data", response.data);
      if (initialCall) {
        setProcessConfig(response.data);
        return;
      }

      setAnalyticsData(response.data);
      if (response.data.length === 0) {
        alert("No data found!");
      }
    } catch (error) {
      console.error("handleReportDownload error catched!", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handlePlotGraph(true);
  }, []);

  // table headers
  const columns = analyticsData.length > 0 && Object.keys(analyticsData[0]);

  //line chart data
  const [lineData, setLineData] = useState({
    labels: [],
    datasets: [],
  });

  // line chart legend toggle
  const [hiddenDatasets, setHiddenDatasets] = useState({
    0: false,
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
    8: true,
    9: true,
    10: true,
    11: true,
    12: true,
    13: true,
    14: true,
    15: true,
  });

  const toggleDataset = (index) => {
    setHiddenDatasets((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
    if (chartRef.current) {
      chartRef.current.setDatasetVisibility(index, hiddenDatasets[index]);
      chartRef.current.update();
    }
  };

  //line chart colors
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

  // line chart grid hover
  const gridHoverLine = {
    id: "gridHoverLine",
    beforeDraw(chart) {
      const { ctx, chartArea } = chart;

      if (!chart._active || chart._active.length === 0) return;

      const mouseEvent = chart.tooltip;
      const x = mouseEvent.caretX;
      const y = chart._lastEvent?.y ?? mouseEvent.caretY;

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = "#1D2B73";
      ctx.lineWidth = 1.5;

      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);

      ctx.moveTo(chartArea.left, y);
      ctx.lineTo(chartArea.right, y);

      ctx.stroke();
      ctx.restore();
    },
  };

  ChartJS.register(gridHoverLine);

  //line chart data
  useEffect(() => {
    if (analyticsData && analyticsData.length > 0) {
      const reversedData = [...analyticsData].reverse();

      if (
        selectedReportOption !== "averageOption1" &&
        selectedReportOption !== "averageOption2"
      ) {
        const timestamps = reversedData.map((item) => item.Timestamp);

        const sensorKeys = Object.keys(reversedData[0]).filter((key) =>
          key.startsWith("S")
        );

        const datasets = sensorKeys.map((sensor, index) => ({
          label: sensor,
          data: reversedData.map((item) => item[sensor] || 0),
          borderColor: sensorColors[index],
          borderWidth: 2,
          pointRadius: 1,
          fill: false,
          hidden: sensor !== "S1",
        }));

        setLineData({
          labels: timestamps,
          datasets: datasets,
        });
      } else if (
        selectedReportOption === "averageOption1" ||
        selectedReportOption === "averageOption2"
      ) {
        const timestamps = reversedData.map((item) => item.dateRange);

        const sensorKeys = Object.keys(reversedData[0]).filter((key) =>
          key.startsWith("avg")
        );

        const datasets = sensorKeys.map((sensor, index) => ({
          label: sensor,
          data: reversedData.map((item) => item[sensor] || 0),
          borderColor: sensorColors[index],
          borderWidth: 2,
          pointRadius: 1,
          fill: false,
          hidden: sensor !== "avgS1",
        }));

        setLineData({
          labels: timestamps,
          datasets: datasets,
        });
      }
    }
  }, [analyticsData]);

  // line chart options
  const lineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
        },
        zoom: {
          pan: {
            enabled: false,
            mode: "xy",
          },
          pinch: {
            enabled: window.innerWidth >= 768,
          },
          zoom: {
            wheel: {
              enabled: false,
            },
            drag: {
              enabled: true,
              backgroundColor: "rgba(48, 71, 192, 0.2)",
              borderColor: "#3047C0",
              borderWidth: 1,
            },
            mode: "xy",
          },
          limits: {
            x: { min: "original", max: "original" },
            y: { min: "original", max: "original" },
          },
        },
      },
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          ticks: {
            font: {
              size: window.innerWidth > 1536 ? 8 : 7,
            },
            color: "#1D2B73",
          },
        },
        y: {
          ticks: {
            font: {
              size: window.innerWidth > 1536 ? 8 : 7,
            },
            color: "#1D2B73",
          },
          beginAtZero: false,
        },
      },
    }),
    []
  );

  // export line chart
  const handleChartExport = () => {
    if (chartRef.current) {
      const chartInstance = chartRef.current;
      const imageURL = chartInstance.toBase64Image();

      const link = document.createElement("a");
      link.href = imageURL;
      link.download = "jindal_chart.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen xl:h-screen bg-[#e9edf9] p-4 text-[#1D2B73] flex flex-col gap-4">
      <div className="xl:h-[8%] flex">
        <Navbar />
      </div>

      <div className="xl:h-[92%] p-0 xs:p-2 md:p-4">
        <div className="h-full flex flex-col bg-white rounded-xl">
          {/* options */}
          <div className="flex flex-col md:flex-row xl:h-[13%]">
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
                    setAnalyticsData([]);
                    setHiddenDatasets({
                      0: false,
                      1: true,
                      2: true,
                      3: true,
                      4: true,
                      5: true,
                      6: true,
                      7: true,
                      8: true,
                      9: true,
                      10: true,
                      11: true,
                      12: true,
                      13: true,
                      14: true,
                      15: true,
                    });
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
                    setAnalyticsData([]);
                    setHiddenDatasets({
                      0: false,
                      1: true,
                      2: true,
                      3: true,
                      4: true,
                      5: true,
                      6: true,
                      7: true,
                      8: true,
                      9: true,
                      10: true,
                      11: true,
                      12: true,
                      13: true,
                      14: true,
                      15: true,
                    });
                  }}
                >
                  <PiSigmaBold className="text-2xl md:text-5xl 2xl:text-6xl text-[#3047C0]" />
                  Average Data
                </button>
              </div>

              <div className="flex md:w-1/2">
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
                    setAnalyticsData([]);
                    setHiddenDatasets({
                      0: false,
                      1: true,
                      2: true,
                      3: true,
                      4: true,
                      5: true,
                      6: true,
                      7: true,
                      8: true,
                      9: true,
                      10: true,
                      11: true,
                      12: true,
                      13: true,
                      14: true,
                      15: true,
                    });
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
                    setAnalyticsData([]);
                    setHiddenDatasets({
                      0: false,
                      1: true,
                      2: true,
                      3: true,
                      4: true,
                      5: true,
                      6: true,
                      7: true,
                      8: true,
                      9: true,
                      10: true,
                      11: true,
                      12: true,
                      13: true,
                      14: true,
                      15: true,
                    });
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
                  setAnalyticsData([]);
                  setHiddenDatasets({
                    0: false,
                    1: true,
                    2: true,
                    3: true,
                    4: true,
                    5: true,
                    6: true,
                    7: true,
                    8: true,
                    9: true,
                    10: true,
                    11: true,
                    12: true,
                    13: true,
                    14: true,
                    15: true,
                  });
                }}
              >
                <FaHashtag className="text-2xl md:text-5xl 2xl:text-6xl text-[#3047C0]" />
                Count-wise Data
              </button>
            </div>
          </div>

          {/* main content */}
          <div className="xl:h-[87%] flex flex-col xl:flex-row gap-4 p-4">
            <div className="flex flex-col gap-4 w-full xl:w-[40%] h-full ">
              {/* process data */}
              {selectedReportOption === "processOption" && (
                <div className="xl:h-[10%] flex items-center">
                  <form
                    className=" flex md:justify-between gap-4 text-xs md:text-sm 2xl:text-base w-full xl:w-auto"
                    // onSubmit={handlePlotGraph}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handlePlotGraph();
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full">
                      <label className="w-full md:w-1/3">
                        Completed Processes:
                      </label>
                      <select
                        value={processInfo}
                        required
                        onChange={(e) => setProcessInfo(e.target.value)}
                        className="w-full md:w-2/3 p-1 rounded-sm text-center border border-gray-400"
                      >
                        <option value="">--Select--</option>
                        {processConfig.map((data, i) => (
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

                    <div className="flex justify-end items-end md:items-center">
                      <button className="reports-download rounded-sm">
                        <LuChartLine className="text-lg 2xl:text-xl" />
                        Plot
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* date picker */}
              {selectedReportOption === "datePicker" && (
                <div className="xl:h-[10%] flex items-center">
                  <form
                    className=" flex md:justify-between gap-4 text-xs md:text-sm 2xl:text-base w-full"
                    // onSubmit={handlePlotGraph}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handlePlotGraph();
                    }}
                  >
                    <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full">
                      <div className="flex gap-2 items-center">
                        <label className="font-medium w-1/5">From:</label>
                        <input
                          type="date"
                          className="p-1 rounded-sm border border-gray-400 w-4/5"
                          value={fromDate}
                          required
                          onChange={(e) => setFromDate(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-2 items-center">
                        <label className="font-medium w-1/5">To</label>
                        <input
                          type="date"
                          className="p-1 rounded-sm border border-gray-400 w-4/5"
                          value={toDate}
                          required
                          onChange={(e) => setToDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end items-end md:items-center md:w-full">
                      <button className="reports-download rounded-sm">
                        <LuChartLine className="text-lg 2xl:text-xl" />
                        Plot
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* count wise */}
              {(selectedReportOption === "countWise1" ||
                selectedReportOption === "countWise2") && (
                <div className="xl:h-[25%] flex items-center">
                  <form
                    className=" flex flex-col gap-2 md:gap-4 text-xs md:text-sm 2xl:text-base w-full"
                    // onSubmit={handlePlotGraph}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handlePlotGraph();
                    }}
                  >
                    {/* sub selection */}
                    <div className="flex">
                      <div
                        className={`report-option flex w-1/2 p-0.5 ${
                          selectedReportOption === "countWise1"
                            ? "bg-[#BFC6EB] border-b-[#3047C0] "
                            : "border-b-white bg-white"
                        }`}
                        onClick={() => {
                          setSelectedReportOption("countWise1");
                          setProcessInfo("");
                          setCount(100);
                        }}
                      >
                        <AiOutlineSchedule className="text-lg md:text-2xl 2xl:text-2xl text-[#3047C0]" />
                        Process-wise
                      </div>

                      <div
                        className={`report-option flex w-1/2 p-0.5 ${
                          selectedReportOption === "countWise2"
                            ? "bg-[#BFC6EB] border-b-[#3047C0] "
                            : "border-b-white bg-white"
                        }`}
                        onClick={() => {
                          setSelectedReportOption("countWise2");
                          setProcessInfo("");
                          setCount(100);
                        }}
                      >
                        <FaHashtag className="text-base md:text-xl 2xl:text-2xl text-[#3047C0]" />
                        Count-wise
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-2 w-full">
                      <div className="flex gap-2 w-full md:w-1/2">
                        <label className="analytics-radio w-1/2">
                          <input
                            type="radio"
                            name="countOption"
                            value={100}
                            checked={count === 100}
                            onChange={(e) => setCount(Number(e.target.value))}
                            required
                          />
                          <div className="ml-2 xl:ml-0 2xl:ml-2 text-center">
                            Last 100 Data
                          </div>
                        </label>

                        <label className="analytics-radio w-1/2">
                          <input
                            type="radio"
                            name="countOption"
                            value={250}
                            checked={count === 250}
                            onChange={(e) => setCount(Number(e.target.value))}
                            required
                          />
                          <div className="ml-2 xl:ml-0 2xl:ml-2 text-center">
                            Last 250 Data
                          </div>
                        </label>
                      </div>

                      <div className="flex gap-2 w-full md:w-1/2">
                        <label className="analytics-radio w-1/2">
                          <input
                            type="radio"
                            name="countOption"
                            value={500}
                            checked={count === 500}
                            onChange={(e) => setCount(Number(e.target.value))}
                            required
                          />
                          <div className="ml-2 xl:ml-0 2xl:ml-2 text-center">
                            Last 500 Data
                          </div>
                        </label>

                        <label className="analytics-radio w-1/2">
                          <input
                            type="radio"
                            name="countOption"
                            value={1000}
                            checked={count === 1000}
                            onChange={(e) => setCount(Number(e.target.value))}
                            required
                          />
                          <div className="ml-2 xl:ml-0 2xl:ml-2 text-center">
                            Last 1000 Data
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 w-full">
                      {selectedReportOption === "countWise1" ? ( // process wise count
                        <>
                          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <label className="w-1/3">
                              Completed Processes:
                            </label>
                            <select
                              value={processInfo}
                              required
                              onChange={(e) => setProcessInfo(e.target.value)}
                              className="w-2/3 p-1 rounded-sm text-center border border-gray-400"
                            >
                              <option value="">--Select--</option>
                              {processConfig.map((data, i) => (
                                <option
                                  key={i}
                                  value={`${data.StartTime}&${data.StoppedTime}`}
                                >
                                  {data.StartTime} - Tun:{data.TundishNo} -
                                  Heat:
                                  {data.HeatNo} - Gd:{data.Grade} - Cast:
                                  {data.CastReady} - Sec:{data.Section}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      ) : (
                        <div />
                      )}

                      <button className="reports-download rounded-sm">
                        <LuChartLine className="text-lg 2xl:text-xl" />
                        Plot
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* average option */}
              {(selectedReportOption === "averageOption1" ||
                selectedReportOption === "averageOption2") && (
                <div className="xl:h-[25%] flex items-center">
                  <form
                    className="flex flex-col gap-4 text-xs md:text-sm 2xl:text-base w-full "
                    // onSubmit={handlePlotGraph}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handlePlotGraph();
                    }}
                  >
                    {/* sub selection */}
                    <div className="flex">
                      <div
                        className={`report-option flex w-1/2 p-0.5 ${
                          selectedReportOption === "averageOption1"
                            ? "bg-[#BFC6EB] border-b-[#3047C0] "
                            : "border-b-white bg-white"
                        }`}
                        onClick={() => {
                          setSelectedReportOption("averageOption1");
                          setProcessInfo("");
                          setAvgOption("hour");
                          setAvgFromDate("");
                          setAvgToDate("");
                        }}
                      >
                        <AiOutlineSchedule className="text-lg md:text-2xl 2xl:text-2xl text-[#3047C0]" />
                        Process-wise
                      </div>

                      <div
                        className={`report-option flex w-1/2 p-0.5 ${
                          selectedReportOption === "averageOption2"
                            ? "bg-[#BFC6EB] border-b-[#3047C0] "
                            : "border-b-white bg-white"
                        }`}
                        onClick={() => {
                          setSelectedReportOption("averageOption2");
                          setProcessInfo("");
                          setAvgOption("hour");
                          setAvgFromDate("");
                          setAvgToDate("");
                        }}
                      >
                        <LuCalendarSearch className="text-base md:text-xl 2xl:text-2xl text-[#3047C0]" />
                        Date-wise
                      </div>
                    </div>

                    {selectedReportOption === "averageOption1" ? (
                      <div className="flex items-center gap-2 md:gap-4 w-full">
                        <label className="w-1/2 md:w-1/3">
                          Completed Processes:
                        </label>
                        <select
                          value={processInfo}
                          required
                          onChange={(e) => setProcessInfo(e.target.value)}
                          className="w-1/2 md:w-2/3 p-1 rounded-sm text-center border border-gray-400"
                        >
                          <option value="">--Select--</option>
                          {processConfig.map((data, i) => (
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
                    ) : (
                      <div className="flex gap-2 md:gap-4 text-[10px] leading-snug md:text-sm 2xl:text-base">
                        <div className="flex gap-1 md:gap-4 items-center w-1/2">
                          <label className="font-medium">From:</label>
                          <input
                            type="date"
                            className="p-1 rounded-sm w-full border border-gray-400"
                            value={avgFromDate}
                            required
                            onChange={(e) => setAvgFromDate(e.target.value)}
                          />
                        </div>

                        <div className="flex gap-1 md:gap-4 items-center w-1/2">
                          <label className="font-medium">To</label>
                          <input
                            type="date"
                            className="p-1 rounded-sm border border-gray-400 w-full"
                            value={avgToDate}
                            required
                            onChange={(e) => setAvgToDate(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 md:gap-4 w-full ">
                      <div>Average By:</div>
                      <label className="flex items-center gap-1 hover-effect">
                        <input
                          type="radio"
                          name="avgOption"
                          value="hour"
                          required
                          checked={avgOption === "hour"}
                          onChange={(e) => setAvgOption(e.target.value)}
                        />
                        <div className="md:mb-[1.5px]">Hour</div>
                      </label>

                      <label className="flex items-center gap-1 hover-effect">
                        <input
                          type="radio"
                          name="avgOption"
                          value="day"
                          required
                          checked={avgOption === "day"}
                          onChange={(e) => setAvgOption(e.target.value)}
                        />
                        <div className="md:mb-[1.5px]">Day</div>
                      </label>

                      <div className="flex justify-end w-full">
                        <button className="reports-download rounded-sm">
                          <LuChartLine className="text-lg 2xl:text-xl" />
                          Plot
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* interval option */}
              {(selectedReportOption === "intervalOption1" ||
                selectedReportOption === "intervalOption2") && (
                <div className="xl:h-[25%] flex items-center">
                  <form
                    className=" flex flex-col gap-4 text-xs md:text-sm 2xl:text-base w-full"
                    // onSubmit={handlePlotGraph}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handlePlotGraph();
                    }}
                  >
                    {/* sub selection */}
                    <div className="flex">
                      <div
                        className={`report-option flex w-1/2 p-0.5 ${
                          selectedReportOption === "intervalOption1"
                            ? "bg-[#BFC6EB] border-b-[#3047C0] "
                            : "border-b-white bg-white"
                        }`}
                        onClick={() => {
                          setSelectedReportOption("intervalOption1");
                          setProcessInfo("");
                          setIntOption("hour");
                          setIntFromDate("");
                          setIntToDate("");
                        }}
                      >
                        <AiOutlineSchedule className="text-lg md:text-2xl 2xl:text-2xl text-[#3047C0]" />
                        Process-wise
                      </div>

                      <div
                        className={`report-option flex w-1/2 p-0.5 ${
                          selectedReportOption === "intervalOption2"
                            ? "bg-[#BFC6EB] border-b-[#3047C0] "
                            : "border-b-white bg-white"
                        }`}
                        onClick={() => {
                          setSelectedReportOption("intervalOption2");
                          setProcessInfo("");
                          setIntOption("hour");
                          setIntFromDate("");
                          setIntToDate("");
                        }}
                      >
                        <LuCalendarSearch className="text-base md:text-xl 2xl:text-2xl text-[#3047C0]" />
                        Date-wise
                      </div>
                    </div>

                    {selectedReportOption === "intervalOption1" ? (
                      <div className="flex items-center gap-2 md:gap-4 w-full">
                        <label className="w-1/2 md:w-1/3">
                          Completed Processes:
                        </label>
                        <select
                          value={processInfo}
                          required
                          onChange={(e) => setProcessInfo(e.target.value)}
                          className="w-1/2 md:w-2/3 p-1 rounded-sm text-center border border-gray-400"
                        >
                          <option value="">--Select--</option>
                          {processConfig.map((data, i) => (
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
                    ) : (
                      <div className="flex gap-2 md:gap-4 text-[10px] leading-snug md:text-sm 2xl:text-base">
                        <div className="flex gap-1 md:gap-4 items-center w-1/2">
                          <label className="font-medium">From:</label>
                          <input
                            type="date"
                            className="p-1 rounded-sm w-full border border-gray-400"
                            value={intFromDate}
                            required
                            onChange={(e) => setIntFromDate(e.target.value)}
                          />
                        </div>

                        <div className="flex gap-1 md:gap-4 items-center w-1/2">
                          <label className="font-medium">To</label>
                          <input
                            type="date"
                            className="p-1 rounded-sm w-full border border-gray-400"
                            value={intToDate}
                            required
                            onChange={(e) => setIntToDate(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 md:gap-4 w-full">
                      <div className="text-[10px] leading-tight xl:text-sm 2xl:text-base">
                        Get 1 data for every:
                      </div>

                      <label className="flex items-center gap-2 md:gap-4">
                        <input
                          type="radio"
                          name="intOption"
                          value="hour"
                          required
                          checked={intOption === "hour"}
                          onChange={(e) => setIntOption(e.target.value)}
                        />
                        <div className="md:mb-[1.5px]">Hour</div>
                      </label>

                      <label className="flex items-center gap-1 hover-effect">
                        <input
                          type="radio"
                          name="intOption"
                          value="day"
                          required
                          checked={intOption === "day"}
                          onChange={(e) => setIntOption(e.target.value)}
                        />
                        <div className="md:mb-[1.5px]">Day</div>
                      </label>

                      <div className="flex justify-end w-full">
                        <button className="reports-download rounded-sm">
                          <LuChartLine className="text-lg 2xl:text-xl" />
                          Plot
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* heatmap indication */}
              <div className="h-[8%] text-[#3047C0] flex flex-wrap justify-center gap-2 2xl:gap-4 text-xs 2xl:text-base font-medium ">
                <div className="flex gap-1 2xl:gap-2 items-center">
                  <div className="h-3 w-3 bg-red-500" />
                  <div>{">"}400°C</div>
                </div>

                <div className="flex gap-1 2xl:gap-2 items-center">
                  <div className="h-3 w-3 bg-orange-500" />
                  <div>300°C - 399°C</div>
                </div>

                <div className="flex gap-1 2xl:gap-2 items-center">
                  <div className="h-3 w-3 bg-yellow-500" />
                  <div>200°C - 299°C</div>
                </div>

                <div className="flex gap-1 2xl:gap-2 items-center">
                  <div className="h-3 w-3 bg-yellow-300" />
                  <div>100°C - 199°C</div>
                </div>

                <div className="flex gap-1 2xl:gap-2 items-center">
                  <div className="h-3 w-3 bg-green-500" />
                  <div>{"<"}99°C</div>
                </div>
              </div>

              {/* table */}
              <div
                className={`${
                  selectedReportOption === "datePicker" ||
                  selectedReportOption === "processOption"
                    ? "h-[300px] md:h-[400px] xl:h-[82%]"
                    : "h-[300px] md:h-[400px] xl:h-[68%]"
                } overflow-auto border border-gray-200 rounded-sm`}
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#E0E3F6 transparent",
                }}
              >
                {analyticsData.length > 0 ? (
                  <table className="border-collapse border border-gray-300 text-xs 2xl:text-sm">
                    <thead className="sticky top-0">
                      <tr className="bg-[#BFC6EB]">
                        <th className="border border-gray-300 p-2 ">S.No</th>
                        {columns.map((col, index) => (
                          <th
                            key={index}
                            className="border border-gray-300 px-4 py-2"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.map((row, rowIndex) => (
                        <tr key={rowIndex} className="">
                          <td className="border border-gray-300 p-2 text-center ">
                            {rowIndex + 1}
                          </td>
                          {columns.map((col, colIndex) => (
                            <td
                              key={colIndex}
                              className={` px-4 py-2 ${
                                col === "Timestamp" || col === "dateRange"
                                  ? ""
                                  : row[col] < 100
                                  ? "bg-green-500"
                                  : row[col] >= 100 && row[col] < 200
                                  ? "bg-yellow-300"
                                  : row[col] >= 200 && row[col] < 300
                                  ? "bg-yellow-500"
                                  : row[col] >= 300 && row[col] < 400
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                              }`}
                            >
                              {row[col]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="bg-[#e9edf9] rounded-sm flex justify-center items-center h-full">
                    No data!
                  </div>
                )}
              </div>
            </div>

            {/* graph */}
            <div className="w-full xl:w-[60%] h-full md:p-2 flex flex-col">
              {analyticsData.length > 0 ? (
                <>
                  {/* graph top bar */}
                  <div className="xl:h-[8%] flex justify-between items-center px-2">
                    {/* data points */}
                    <div className="bg-[#E0E3F6] text-sm 2xl:text-base p-1 rounded-md">
                      Data Points:{" "}
                      <span className="font-medium">
                        {analyticsData.length}
                      </span>
                    </div>

                    <div className="flex gap-1">
                      {/* zoom reset */}
                      <button
                        className="bg-[#3047C0] text-white hover:bg-[#293ea7] py-1 px-2 rounded-sm hover-effect"
                        onClick={() => chartRef.current?.resetZoom()}
                      >
                        <FaRedo />
                      </button>
                      {/* export graph */}
                      <button
                        className="bg-[#3047C0] text-white hover:bg-[#293ea7] py-1 px-2 rounded-sm hover-effect"
                        onClick={handleChartExport}
                      >
                        Export
                      </button>
                    </div>
                  </div>

                  <div className="h-[350px] md:xl:h-[77%]">
                    <Line
                      ref={chartRef}
                      data={lineData}
                      options={lineOptions}
                      width={"100%"}
                    />
                  </div>

                  {chartRef.current && (
                    <div className="xl:h-[15%] flex justify-center flex-wrap gap-2 text-[10px] leading-tight md:text-sm 2xl:text-base text-[#3047C0] font-medium">
                      {chartRef.current.data.datasets.map((dataset, index) => (
                        <label
                          key={index}
                          className="flex items-center gap-1 cursor-pointer hover-effect"
                        >
                          <input
                            type="checkbox"
                            checked={!hiddenDatasets[index]}
                            onChange={() => toggleDataset(index)}
                          />
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: dataset.borderColor }}
                          ></span>
                          <span>{dataset.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-[350px] xl:h-[99%]">
                  <Line
                    data={{ datasets: [] }}
                    options={lineOptions}
                    width={"100%"}
                  />
                </div>
              )}
            </div>
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

export default Analysis;
