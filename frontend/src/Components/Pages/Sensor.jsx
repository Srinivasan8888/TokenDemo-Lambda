import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../Reusables/Navbar";
import API from "../../Api/axiosInterceptor";

import jindalModel from "../Assets/jindalModel.png";

import { IoIosArrowRoundUp, IoIosArrowRoundDown } from "react-icons/io";
import { BsDatabaseFillCheck, BsDatabaseFillX } from "react-icons/bs";
import { PiThermometerHot, PiSigma } from "react-icons/pi";
import { IoArrowUndo } from "react-icons/io5";
import { LuHistory } from "react-icons/lu";
import { FaRedo } from "react-icons/fa";

import { Line, Scatter } from "react-chartjs-2";
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
  Filler,
  ScatterController,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin,
  Filler,
  ScatterController
);

const Sensor = () => {
  const { sensorId } = useParams();
  const navigate = useNavigate();
  const lineChartRef = useRef(null);
  const scatterChartRef = useRef(null);

  const [sensorData, setSensorData] = useState([]);
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [avgValue, setAvgValue] = useState("");
  const [lastData, setLastData] = useState({});
  const [thresholdStatus, setThresholdStatus] = useState({});
  const [activityStatus, setActivityStatus] = useState("");

  const [dateRangeOption, setDateRangeOption] = useState(() => {
    const initialOpt = localStorage.getItem("jindlaDateOption");
    return initialOpt ? initialOpt : "1d";
  });

  const handleDateOption = (option) => {
    localStorage.setItem("jindlaDateOption", option);
    setDateRangeOption(option);
  };

  const fetchAverageData = async () => {
    try {
      const dateRange = localStorage.getItem("jindlaDateOption");
      console.log("api triggered for:", dateRange);

      const response = await API.get("/getSensorData", {
        params: {
          dateRange,
          sensorId,
        },
      });

      setLastData(response.data.lastData);
      setActivityStatus(response.data.activityStatus);
      setThresholdStatus(response.data.thresholdStatus);
      setSensorData(response.data.finalArray);
      setMinValue(
        response.data.sensorValues?.[sensorId]?.min !== undefined
          ? `${response.data.sensorValues[sensorId].min}°C`
          : "N/A"
      );
      setMaxValue(
        response.data.sensorValues?.[sensorId]?.max !== undefined
          ? `${response.data.sensorValues[sensorId].max}°C`
          : "N/A"
      );
      setAvgValue(
        response.data.sensorValues?.[sensorId]?.avg !== undefined
          ? `${response.data.sensorValues[sensorId].avg}°C`
          : "N/A"
      );
    } catch (error) {
      console.error("fetchAverageData error catched!", error);
    }
  };

  useEffect(() => {
    let timeoutId;
    let isMounted = true;

    const fetch = async () => {
      if (!isMounted) return;

      await fetchAverageData();
      if (isMounted) {
        timeoutId = setTimeout(fetch, 20000);
      }
    };

    fetch();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [dateRangeOption]);

  //line chart data
  const [lineData, setLineData] = useState({
    labels: [],
    datasets: [],
  });

  // scatter data
  const [scatterData, setScatterData] = useState({ labels: [], datasets: [] });

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
    if (sensorData?.length) {
      const reversedData = [...sensorData].reverse();

      const sensorKey = Object.keys(reversedData[0]).find((key) =>
        key.startsWith("avg")
      );

      setLineData({
        labels: reversedData.map((_, index) => index),
        datasets: [
          {
            label: sensorKey,
            data: reversedData.map((item) => item[sensorKey] || 0),
            borderColor: "#3047C0",
            backgroundColor: (context) => {
              const chart = context.chart;
              const { ctx, chartArea } = chart;

              if (!chartArea) {
                return "rgba(48, 71, 192, 0.2)";
              }

              const gradientFill = ctx.createLinearGradient(
                0,
                chartArea.top,
                0,
                chartArea.bottom
              );
              gradientFill.addColorStop(0, "rgba(48, 71, 192, 0.8)");
              gradientFill.addColorStop(1, "rgba(48, 71, 192, 0)");

              return gradientFill;
            },
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.4,
            fill: "origin",
          },
        ],
      });

      setScatterData({
        labels: reversedData.map((_, index) => index + 1),
        datasets: [
          {
            label: sensorKey,
            data: reversedData.map((item) => item[sensorKey] || 0),
            borderColor: "#3047C0",
            borderWidth: 2,
            pointRadius: 2,
            pointBackgroundColor: "#3047C0",
          },
        ],
      });
    }
  }, [sensorData]);

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
          callbacks: {
            title: (tooltipItems) => {
              const index = tooltipItems[0].dataIndex;
              return (
                sensorData?.[sensorData.length - 1 - index]?.dateRange || ""
              );
            },
          },
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
          title: {
            display: true,
            text: "Temperature (°C)",
            font: {
              size: window.innerWidth > 1536 ? 12 : 10,
            },
            color: "#1D2B73",
          },
          ticks: {
            font: {
              size: window.innerWidth > 1536 ? 8 : 7,
            },
            color: "#1D2B73",
          },
          beginAtZero: true,
        },
      },
    }),
    [sensorData]
  );

  // table column names
  const columns = sensorData.length > 0 && Object.keys(sensorData[0]);

  // console.log("columns", columns);
  // console.log("last data", lastData);
  // console.log("sensor id", sensorId);
  // console.log("last sensor data", lastData.S1);
  // console.log("sensor data", sensorData);

  return (
    <div
      className="min-h-screen xl:h-screen bg-[#e9edf9] p-4 text-[#1D2B73] flex flex-col gap-4  text-sm md:text-base 2xl:text-lg"
      style={{ whiteSpace: "nowrap" }}
    >
      <div className="xl:h-[8%] flex">
        <Navbar />
      </div>

      {/* main content */}
      <div className="xl:h-[92%] flex flex-col xl:flex-row gap-4">
        <div className="w-full xl:w-[30%] flex flex-col md:flex-row xl:flex-col gap-4">
          {/* sensor info */}
          <div className="bg-white rounded-xl p-4 xl:h-[40%] flex flex-col gap-4 md:gap-0 justify-between text-sm 2xl:text-base md:w-[50%] xl:w-auto">
            {/* title */}
            <div className="flex">
              <button
                className="flex items-center gap-2 2xl:gap-4 hover-effect"
                onClick={() => navigate("/")}
              >
                <div className="bg-[#EAEDF9] rounded-full p-1 text-[#3047C0] text-lg 2xl:text-xl">
                  <IoArrowUndo />
                </div>

                <div className="font-medium">
                  Sensor {sensorId.replace("S", "")} Hourly Average Data
                </div>
              </button>
            </div>

            {/* value */}
            <div className="bg-[#EAEDF9] px-3 py-3 md:py-6 xl:px-3 xl:py-3  flex gap-1 rounded-md">
              <div className="w-1/2 flex flex-col justify-center gap-2 items-center border border-r-gray-400 border-t-0 border-b-0 border-l-0">
                <div className="text-xs md:text-sm 2xl:text-base">
                  Current Temperature
                </div>
                <div className="flex gap-1 items-center font-semibold text-lg md:text-xl 2xl:text-2xl text-[#3047C0]">
                  <PiThermometerHot className="text-3xl md:text-4xl 2xl:text-5xl text-[#1D2B73]" />{" "}
                  {lastData ? `${lastData[sensorId]} °C` : "N/A"}
                </div>
              </div>

              <div className="w-1/2 flex flex-col gap-2 2xl:gap-4 text-xs 2xl:text-sm">
                <div className="flex items-center gap-2">
                  <IoIosArrowRoundUp className="text-3xl 2xl:text-4xl text-red-500 w-1/5" />
                  <span className="w-2/5">Max Temp </span>
                  <span className="font-semibold text-xs md:text-sm 2xl:text-base w-2/5 text-[#3047C0]">
                    {maxValue}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <IoIosArrowRoundDown className="text-3xl 2xl:text-4xl text-[#3047C0] w-1/5" />{" "}
                  <span className="w-2/5">Min Temp </span>{" "}
                  <span className="font-semibold text-xs md:text-sm 2xl:text-base w-2/5 text-[#3047C0]">
                    {minValue}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <PiSigma className="text-xl md:text-2xl text-[#1D2B73] w-1/5" />{" "}
                  <span className="w-2/5">Avg Temp </span>{" "}
                  <span className="font-semibold text-xs md:text-sm 2xl:text-base w-2/5 text-[#3047C0]">
                    {avgValue}
                  </span>
                </div>
              </div>
            </div>

            {/* last update */}
            <div className="bg-[#EAEDF9] px-3 py-3 md:py-6 xl:px-3 xl:py-3 flex items-center gap-2 rounded-md">
              <div className="w-1/2 flex items-center justify-center gap-1">
                <LuHistory className="text-xl 2xl:text-2xl" />
                Recent Data :
              </div>
              <div className="w-1/2 text-center font-medium text-[#3047C0] text-xs md:text-sm 2xl:text-base">
                {lastData ? lastData.Timestamp : "N/A"}
              </div>
            </div>
          </div>

          {/* table */}
          <div
            className="bg-white rounded-xl h-[300px] xl:h-[60%] md:w-[50%] xl:w-auto  overflow-auto border border-gray-300"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#E0E3F6 transparent",
            }}
          >
            {sensorData.length > 0 && (
              <table className="border-collapse border border-gray-300 text-xs 2xl:text-sm w-full">
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
                  {sensorData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="">
                      <td className="border border-gray-300 p-2 text-center">
                        {rowIndex + 1}
                      </td>
                      {columns.map((col, colIndex) => (
                        <td
                          key={colIndex}
                          className="border border-gray-300 px-4 py-2"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="w-full xl:w-[70%] flex flex-col gap-4">
          <div className="flex flex-col xl:flex-row gap-4 xl:h-[55%]">
            <div className="flex flex-col gap-4 w-full xl:w-[65%]">
              {/* config */}
              <div className="xl:h-[10%] flex flex-col md:flex-row items-start xs:items-start md:justify-between gap-4 md:items-center">
                <div className="flex flex-col items-start xs:flex-row gap-2 md:gap-4 xs:items-center">
                  <div className="font-medium">Date Range</div>

                  {/* date range options */}
                  <div className="flex gap-2 py-2 px-4 rounded-full bg-[#E0E3F6]">
                    <button
                      className={`date-range-button ${
                        dateRangeOption === "1d" && "bg-[#3047C0] text-white"
                      }`}
                      onClick={() => {
                        handleDateOption("1d");
                      }}
                    >
                      1D
                    </button>
                    <button
                      className={`date-range-button ${
                        dateRangeOption === "2d" && "bg-[#3047C0] text-white"
                      }`}
                      onClick={() => {
                        handleDateOption("2d");
                      }}
                    >
                      2D
                    </button>
                    <button
                      className={`date-range-button ${
                        dateRangeOption === "3d" && "bg-[#3047C0] text-white"
                      }`}
                      onClick={() => {
                        handleDateOption("3d");
                      }}
                    >
                      3D
                    </button>
                    <button
                      className={`date-range-button ${
                        dateRangeOption === "7d" && "bg-[#3047C0] text-white"
                      }`}
                      onClick={() => {
                        handleDateOption("7d");
                      }}
                    >
                      7D
                    </button>
                    <button
                      className={`date-range-button ${
                        dateRangeOption === "14d" && "bg-[#3047C0] text-white"
                      }`}
                      onClick={() => {
                        handleDateOption("14d");
                      }}
                    >
                      14D
                    </button>
                    <button
                      className={`date-range-button ${
                        dateRangeOption === "30d" && "bg-[#3047C0] text-white"
                      }`}
                      onClick={() => {
                        handleDateOption("30d");
                      }}
                    >
                      30D
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* zoom reset */}
                  <button
                    className="bg-[#3047C0] text-white hover:bg-[#293ea7] py-1 px-2 rounded-sm hover-effect"
                    onClick={() => {
                      scatterChartRef.current?.resetZoom();
                      lineChartRef.current?.resetZoom();
                    }}
                  >
                    <FaRedo />
                  </button>

                  {/* fetch api button */}
                  <button
                    className="bg-[#3047C0] text-white hover:bg-[#293ea7] py-1 px-2 rounded-sm hover-effect"
                    onClick={fetchAverageData}
                  >
                    Fetch Data
                  </button>
                </div>
              </div>

              {/* scatter chart */}
              <div className="bg-white rounded-xl p-2 md:p-4 h-[350px] md:h-[450px] xl:h-[90%]">
                <Scatter
                  ref={scatterChartRef}
                  data={scatterData}
                  options={lineOptions}
                  width={"100%"}
                />
              </div>
            </div>

            {/* 2d model */}
            <div className="w-full xl:w-[35%] flex flex-col gap-2 h-[350px] md:h-[450px] xl:h-auto">
              {/* activity status */}
              <div className="h-[10%] flex justify-between items-center">
                <div className="text-[#1D2B73] font-medium 2xl:text-xl">
                  XY001
                </div>

                {activityStatus && activityStatus === "active" ? (
                  <div className="flex gap-2 items-center text-white rounded-md py-1 px-4 text-sm 2xl:text-lg bg-green-500 font-medium">
                    <BsDatabaseFillCheck className="text-lg 2xl:text-2xl" />
                    Active{" "}
                  </div>
                ) : (
                  <div className="flex gap-2 items-center text-white rounded-md py-1 px-4 text-sm 2xl:text-lg bg-red-500 font-medium">
                    <BsDatabaseFillX className="text-lg 2xl:text-2xl" />
                    Inactive{" "}
                  </div>
                )}
              </div>

              <div className="relative h-[90%] bg-white rounded-xl p-4 flex items-center">
                <div className="relative">
                  <img src={jindalModel} />

                  <div className="absolute bottom-0 left-[55%] -translate-x-1/2 -translate-y-1/2 w-0.5 h-20 md:h-32 xl:h-20 bg-black rotate-[30deg]"></div>

                  <div
                    className={`absolute bottom-[70px] md:bottom-[140px] xl:bottom-[70px] 2xl:bottom-[80px] left-[58%] -translate-x-1/2 -translate-y-1/2 text-white p-2 rounded-md shadow-md flex flex-col 2xl:gap-2 items-center ${
                      thresholdStatus[sensorId] === "high"
                        ? "bg-red-500"
                        : thresholdStatus[sensorId] === "low"
                        ? "bg-green-500"
                        : thresholdStatus[sensorId] === "inRange"
                        ? "bg-[#3047C0]"
                        : "bg-gray-500"
                    }`}
                  >
                    <p className="text-xs 2xl:text-sm font-semibold">
                      Sensor: {sensorId}
                    </p>
                    <p className="text-xs 2xl:text-sm">
                      Temperature:{" "}
                      {lastData ? `${lastData[sensorId]}°C` : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-4 font-normal text-sm 2xl:text-base">
                  <div className="flex gap-1 items-center">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <div>High</div>
                  </div>

                  <div className="flex gap-1 items-center">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <div>In-Range</div>
                  </div>

                  <div className="flex gap-1 items-center">
                    <div className="h-2 w-2 rounded-full bg-[#3047C0]" />
                    <div>Low</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* line chart */}
          <div className="bg-white rounded-xl p-2 md:p-4 h-[350px] md:h-[450px] xl:h-[45%]">
            <Line
              ref={lineChartRef}
              data={lineData}
              options={lineOptions}
              width={"100%"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sensor;
