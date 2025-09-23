import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import Navbar from "../Reusables/Navbar";
import API from "../../Api/axiosInterceptor";
import ThreeDModel from "../Reusables/ThreeDModel";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  FaRedo,
  FaChevronCircleLeft,
  FaChevronCircleRight,
  FaBell,
} from "react-icons/fa";
import { LuHistory } from "react-icons/lu";
import { MdUpload } from "react-icons/md";
import { PiSigmaBold } from "react-icons/pi";
import { BsDatabaseFillCheck, BsDatabaseFillX } from "react-icons/bs";
import {
  FaTemperatureArrowUp,
  FaTemperatureArrowDown,
  FaRegTrashCan,
} from "react-icons/fa6";
import { IoArrowRedo, IoPlay, IoStop } from "react-icons/io5";

import { Line } from "react-chartjs-2";
import zoomPlugin from "chartjs-plugin-zoom";
import annotationPlugin from "chartjs-plugin-annotation";
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
  zoomPlugin,
  annotationPlugin
);

//-[#3047C0] - bg + text - main blue
//-[#EAEDF9] - cards - light blue
//-[#1D2B73] - heading - dark blue
// -[#e9edf9] - main bg'
// -[#E0E3F6]

const MainPage = () => {
  const [dataFromApp, setDataFromApp] = useState([]);
  const [lastData, setLastData] = useState([]);
  const [activityStatus, setActivityStatus] = useState("");
  const [sensorValues, setSensorValues] = useState({});
  const [thresholdStatus, setThresholdStatus] = useState({});
  const [processConfig, setProcessConfig] = useState([]);
  const [timeElapsed, setTimeElapsed] = useState("");
  const [alertLogs, setAlertLogs] = useState([]);

  const [lowerLimit, setLowerLimit] = useState("");
  const [upperLimit, setUpperLimit] = useState("");
  const [scrollPosition, setScrollPosition] = useState(0);
  const [startClicked, setStartClicked] = useState(false);
  const [stopPopup, setStopPopup] = useState(false);
  const [clearPopup, setClearPopup] = useState(false);

  // process states
  const [tundishNo, setTundishNo] = useState("");
  const [heatNo, setHeatNo] = useState("");
  const [grade, setGrade] = useState("");
  const [castReady, setCastready] = useState("yes");
  const [selectedSection, setSelectedSection] = useState("");
  const [acceptedTC, setAcceptedTC] = useState("");

  // live interval option
  const [liveIntervalOption, setLiveIntervalOption] = useState(() => {
    const initialOption = localStorage.getItem("jindalIntervalOption");
    return initialOption ? initialOption : "1h";
  });

  const handleLiveIntervalOption = (option) => {
    localStorage.setItem("jindalIntervalOption", option);
    chartRef.current?.resetZoom();
    setLiveIntervalOption(option);
  };

  const chartRef = useRef(null);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const { userEmail, userName } = useOutletContext();

  const getData = async () => {
    const intervalOption = localStorage.getItem("jindalIntervalOption");
    if (intervalOption) {
      try {
        const response = await API.get("/getData", {
          params: { intervalOption },
        });

        if (response.status === 200) {
          setDataFromApp(response.data.data);
          setLastData(response.data.lastData);
          setActivityStatus(response.data.activityStatus);
          setSensorValues(response.data.sensorValues);
          setThresholdStatus(response.data.thresholdStatus);
          setProcessConfig(response.data.processConfig);
          setTimeElapsed(response.data.timeElapsedString);
          setAlertLogs(response.data.alertLogs);
        }
      } catch (error) {
        console.error("Error fetching data", error);
      }
    }
  };

  useEffect(() => {
    let timeoutId;
    let isMounted = true;

    const fetch = async () => {
      if (!isMounted) return;

      await getData();
      if (isMounted) {
        timeoutId = setTimeout(fetch, 2000);
      }
    };

    fetch();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [liveIntervalOption]);

  const isProcessRunning = processConfig?.[0]?.StoppedTime === "";

  console.log("data length", dataFromApp.length);

  // min max value scroll
  const handleScroll = (direction) => {
    const clientWidth = scrollRef.current.clientWidth;
    const newPosition =
      direction === "left"
        ? scrollPosition - clientWidth
        : scrollPosition + clientWidth;

    setScrollPosition(newPosition);
    scrollRef.current.scrollTo({ left: newPosition, behavior: "smooth" });
  };

  // console.log("liveIntervalOption", liveIntervalOption);
  // console.log("data from mainpage", dataFromApp);
  // console.log("last data", lastData);
  // console.log("activity status", activityStatus);
  // console.log("lower limit", lowerLimit);
  // console.log("upper limit", upperLimit);
  // console.log("sensor values", sensorValues);
  // console.log("threshold status main page", thresholdStatus);
  // console.log("process config", processConfig?.CastReady);
  // console.log("Accepted tc", acceptedTC);

  // cards map
  const sensorCards = Array.from({ length: 16 }, (_, i) => `S${i + 1}`);

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
    if (dataFromApp && dataFromApp.length > 0) {
      const reversedData = [...dataFromApp].reverse();

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
    }
  }, [dataFromApp]);

  // line chart options
  const lineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 600,
      },
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
        annotation: {
          annotations: {
            thresholdLine1: {
              type: "line",
              yMin: lowerLimit,
              yMax: lowerLimit,
              borderColor: "green",
              borderWidth: 1.5,
              borderDash: [5, 5],
              label: {
                display: false,
              },
            },
            thresholdLine2: {
              type: "line",
              yMin: upperLimit,
              yMax: upperLimit,
              borderColor: "red",
              borderWidth: 1.5,
              borderDash: [5, 5],
              label: {
                display: false,
              },
            },
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
    [lowerLimit, upperLimit]
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

  // threshold api
  const updateThreshold = async (e, requestFor) => {
    try {
      if (e) {
        e.preventDefault();
      }
      // console.log("api triggered");
      const response = await API.post("/updateThreshold", {
        requestFor,
        lowerLimit,
        upperLimit,
        userEmail,
        userName,
      });

      if (response.status === 200) {
        setLowerLimit(parseInt(response.data.data.MinLimit));
        setUpperLimit(parseInt(response.data.data.MaxLimit));
        setAcceptedTC(response.data.acceptedTC);
      }
      // updateThreshold(null, "get");
    } catch (error) {
      console.error("updateThreshold error catched!", error);
    }
  };

  useEffect(() => {
    updateThreshold(null, "get");
  }, []);

  // process config api
  const updateProcessConfig = async (e, requestFor) => {
    e?.preventDefault();
    try {
      const response = await API.post("/updateProcessConfig", {
        requestFor,
        tundishNo,
        heatNo,
        grade,
        castReady,
        selectedSection,
        userEmail,
        userName,
      });

      if (response.status === 200) {
        toast.success(
          <div className="text-gray-600 break-words whitespace-normal text-sm 2xl:text-base">
            {response.data.message}
          </div>
        );
      }

      setStartClicked(false);
      setTundishNo("");
      setHeatNo("");
      setGrade("");
      setCastready("yes");
      setSelectedSection("");
      setStopPopup(false);
      setClearPopup(false);
    } catch (error) {
      toast.error(
        <div className="text-gray-800 break-words whitespace-normal">
          Server Error!
        </div>
      );
      console.error("updateProcessConfig error catched!", error);
    }
  };

  return (
    <div className="min-h-screen xl:h-screen bg-[#e9edf9] p-4 text-[#1D2B73] flex flex-col gap-4">
      {/* top bar */}
      <div className="xl:h-[8%] flex">
        <Navbar />
      </div>

      {/* main content - section 1 */}
      <div className="xl:h-[40%] flex flex-col md:flex-row gap-4">
        {/* cards */}
        <div className="w-full md:w-[60%] xl:w-[75%] bg-white rounded-xl grid grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4 p-4">
          {sensorCards.map((sensor, index) => (
            <div
              key={sensor}
              className="card-style relative hover-effect cursor-pointer"
              onClick={() => {
                navigate(`/sensor/${sensor}`);
                localStorage.setItem("jindlaDateOption", "1d");
              }}
            >
              <div className="text-[10px] leading-tight xl:leading-normal xl:text-xs 2xl:text-sm">
                Sensor {index + 1}
              </div>
              <div
                className={`card-value ${
                  thresholdStatus[sensor] === "high"
                    ? "text-red-500"
                    : thresholdStatus[sensor] === "low"
                    ? "text-[#3047C0]"
                    : thresholdStatus[sensor] === "inRange"
                    ? "text-green-500"
                    : "text-gray-500"
                }`}
              >
                {lastData && lastData[sensor] !== undefined
                  ? `${lastData[sensor]}°C`
                  : "N/A"}
              </div>

              <button className="absolute top-1 right-1 2xl:top-2 2xl:right-2 text-[#3047C0] hover:scale-125 duration-200 text-base md:text-lg 2xl:text-xl">
                <IoArrowRedo />
              </button>
            </div>
          ))}

          {/* threhsold settings */}
          <div className="card-style p-2 col-span-2 md:col-span-4 xl:col-span-2 text-[8px] leading-tight xs:leading-normal xs:text-xs 2xl:text-sm bg-[#3047C0] text-white ">
            <div className="font-semibold">Set Threshold</div>
            <form
              className="flex items-center gap-4 2xl:gap-4"
              onSubmit={(e) => updateThreshold(e, "update")}
            >
              <div className="flex flex-col md:flex-row gap-1 2xl:gap-2 items-center">
                <label className="font-medium">Lower Lim</label>
                <input
                  type="number"
                  value={lowerLimit}
                  min="0"
                  required
                  className="p-1 rounded-sm w-10 xs:w-12 text-[#1D2B73]"
                  onChange={(e) => {
                    let val = Number(e.target.value);
                    if (val < 0) {
                      setLowerLimit(0);
                    } else {
                      setLowerLimit(val.toString().replace(/^0+(\d)/, "$1"));
                    }
                  }}
                />
              </div>

              <div className="flex flex-col md:flex-row gap-1 2xl:gap-2 items-center">
                <label className="font-medium">Upper Lim</label>
                <input
                  type="number"
                  value={upperLimit}
                  min="0"
                  required
                  className="p-1 rounded-sm w-10 xs:w-12 text-[#1D2B73]"
                  onChange={(e) => {
                    let val = Number(e.target.value);
                    if (val < 0) {
                      setUpperLimit(0);
                    } else {
                      setUpperLimit(val.toString().replace(/^0+(\d)/, "$1"));
                    }
                  }}
                />
              </div>

              <button
                type="submit"
                className="text-white border border-white text-lg p-1 rounded-sm hover-effect"
              >
                <MdUpload />
              </button>
            </form>
          </div>
        </div>

        <div className="w-full md:w-[40%] xl:w-[25%] h-[300px] md:h-[500px] xl:h-auto  flex flex-col gap-2">
          {/*  start stop */}
          <div className="relative flex justify-between items-center h-[20%] px-4 bg-[#E0E3F6] rounded-xl ">
            <div className="flex flex-row md:flex-col xl:flex-row items-center md:items-start xl:items-center gap-2">
              <div className="font-semibold">Process:</div>
              <div className="flex gap-2 items-center">
                <button
                  className={`process-button  ${
                    isProcessRunning &&
                    "cursor-not-allowed hover:scale-100 opacity-50"
                  }  ${
                    startClicked
                      ? "text-[#3047C0] bg-white"
                      : "bg-[#3047C0] text-white"
                  }`}
                  onClick={() => setStartClicked((prev) => !prev)}
                  disabled={isProcessRunning}
                >
                  <IoPlay /> Start
                </button>

                <button
                  className={`process-button text-[#3047C0] bg-white ${
                    !isProcessRunning &&
                    "cursor-not-allowed hover:scale-100 opacity-50"
                  }`}
                  onClick={() => setStopPopup(true)}
                  disabled={!isProcessRunning}
                >
                  <IoStop /> Stop
                </button>
              </div>
            </div>

            {/* activity status */}
            {activityStatus && activityStatus === "active" ? (
              <div className="text-green-500 text-2xl">
                <BsDatabaseFillCheck />
              </div>
            ) : (
              <div className="text-red-500 text-2xl">
                <BsDatabaseFillX />
              </div>
            )}

            {/* start dropdown */}
            <form
              className={`absolute top-[110%] left-0 w-full bg-[#EAEDF9] border-2 border-white rounded-md z-10 shadow-2xl transition-all duration-300 flex flex-col gap-6 ${
                startClicked ? "opacity-100 p-4" : "max-h-0 opacity-0 p-0"
              }`}
              onSubmit={(e) => updateProcessConfig(e, "start")}
            >
              {startClicked && (
                <>
                  <div className="flex items-center">
                    <label className="w-[40%] text-[#3047C0]">Tundish No</label>
                    <input
                      type="text"
                      required
                      value={tundishNo}
                      onChange={(e) => setTundishNo(e.target.value)}
                      className="w-[60%] reports-input"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[40%] text-[#3047C0]">Heat No</label>
                    <input
                      type="text"
                      required
                      value={heatNo}
                      onChange={(e) => setHeatNo(e.target.value)}
                      className="w-[60%] reports-input"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-[40%] text-[#3047C0]">Grade</label>
                    <input
                      type="text"
                      required
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-[60%] reports-input"
                    />
                  </div>

                  <div className="flex items-center">
                    <div className="w-[40%] text-[#3047C0]">Ready to Cast</div>
                    <div className="w-[60%] flex items-center gap-4">
                      <label className="flex items-center gap-1 hover-effect">
                        <input
                          type="radio"
                          name="castOption"
                          value="yes"
                          required
                          checked={castReady === "yes"}
                          onChange={(e) => setCastready(e.target.value)}
                        />
                        <div className="mb-[1.5px]">Yes</div>
                      </label>

                      <label className="flex items-center gap-1 hover-effect">
                        <input
                          type="radio"
                          name="castOption"
                          value="no"
                          required
                          checked={castReady === "no"}
                          onChange={(e) => setCastready(e.target.value)}
                        />
                        <div className="mb-[1.5px]">No</div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-[40%] text-[#3047C0]">Section</div>
                    <select
                      className="w-[60%] p-1 rounded-sm text-center"
                      required
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                    >
                      <option value="">--Select--</option>
                      <option value="sectionA">Section A</option>
                      <option value="sectionB">Section B</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <div
                      className="text-[#3047C0] py-1 px-4 rounded-md bg-white hover-effect"
                      onClick={() => {
                        setStartClicked(false);
                        setTundishNo("");
                        setHeatNo("");
                        setGrade("");
                        setCastready("yes");
                        setSelectedSection("");
                      }}
                    >
                      Cancel
                    </div>
                    <button className="bg-[#3047C0] py-1 px-4 rounded-md text-white hover-effect">
                      Start
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* alerts */}
          <div className="flex flex-col gap-2 bg-white p-4 h-[80%] rounded-xl">
            <div className="font-medium flex gap-2 items-center justify-between text-base 2xl:text-lg">
              <div className="w-10" />

              <div className="flex gap-2 items-center justify-center">
                Alerts{" "}
                <div className="relative">
                  <FaBell className="text-[#3047C0] text-xl" />
                  <div className="absolute -top-1 -right-1 rounded-full bg-red-500 text-[8px] py-0.5 px-1 leading-none text-white">
                    {alertLogs?.length}
                  </div>
                </div>
              </div>

              <button
                className={`text-sm 2xl:text-base flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-md ${
                  alertLogs?.length === 0
                    ? "opacity-50 cursor-not-allowed hover-scale-100"
                    : "hover-effect"
                }`}
                onClick={() => setClearPopup(true)}
                disabled={alertLogs?.length === 0}
              >
                <FaRegTrashCan />
                Clear
              </button>
            </div>

            <div
              className="flex flex-col gap-4 text-white xl:h-[170px] 2xl:h-auto overflow-auto text-xs 2xl:text-sm"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#E0E3F6 transparent",
              }}
            >
              {alertLogs?.length > 0 ? (
                alertLogs.map((alert, i) => (
                  <div key={i} className="flex flex-col gap-4">
                    {alert.UpperSensors.length > 0 && (
                      <div className="bg-red-500 rounded-md p-2">
                        <div className="underline font-medium text-yellow-200">
                          Below sensors crossed the upper limit{" "}
                          {alert.UpperLimit}°C
                        </div>

                        <div className="flex gap-0.5 flex-wrap">
                          {alert.UpperSensors.map((data, i) => (
                            <div key={i}>
                              {data}
                              {i !== alert.UpperSensors.length - 1 && ","}
                            </div>
                          ))}
                        </div>

                        <div>
                          Time:{" "}
                          <span className="text-yellow-200">
                            {alert.LogTime}
                          </span>
                        </div>
                      </div>
                    )}

                    {alert.LowerSensors.length > 0 && (
                      <div className="bg-[#3047C0] rounded-md p-2">
                        <div className="underline font-medium text-yellow-200 ">
                          Below sensors crossed the lower limit{" "}
                          {alert.LowerLimit}°C
                        </div>

                        <div className="flex gap-1 flex-wrap">
                          {alert.LowerSensors.map((data, i) => (
                            <div key={i}>
                              {data}
                              {i !== alert.LowerSensors.length - 1 && ","}
                            </div>
                          ))}
                        </div>

                        <div>
                          Time:{" "}
                          <span className="text-yellow-200">
                            {alert.LogTime}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex justify-center items-center flex-1 text-[#3047C0]">
                  No new alerts!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* main content - section 2 */}
      <div className="xl:h-[52%] flex flex-col-reverse xl:flex-row gap-4">
        {/* model */}
        <div className="w-full xl:w-[40%] bg-white rounded-xl p-2 2xl:p-4 flex flex-col justify-between gap-2">
          {/* process info */}
          <div className="flex flex-col gap-2 text-xs 2xl:text-sm font-medium">
            <div className="font-medium flex justify-between items-center">
              <div className="flex flex-wrap gap-4 items-center ">
                <div>
                  Process Status:{" "}
                  {isProcessRunning ? (
                    <span className="text-green-500">Running</span>
                  ) : (
                    <span className="text-red-500">Stopped</span>
                  )}
                </div>

                <div>
                  Start Date:{" "}
                  <span className="text-[#3047C0]">
                    {isProcessRunning ? processConfig?.[0]?.StartTime : "N/A"}
                  </span>
                </div>
              </div>

              <div>
                Ready to Cast:{" "}
                <span className="text-[#3047C0]">
                  {isProcessRunning ? processConfig?.[0]?.CastReady : "N/A"}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center flex-wrap xs:flex-nowrap gap-2">
              <div className="flex justify-between items-center gap-4">
                <div>
                  Tundish No:{" "}
                  <span className="text-[#3047C0]">
                    {isProcessRunning ? processConfig?.[0]?.TundishNo : "N/A"}
                  </span>
                </div>

                <div>
                  Heat No:{" "}
                  <span className="text-[#3047C0]">
                    {isProcessRunning ? processConfig?.[0]?.HeatNo : "N/A"}
                  </span>
                </div>

                <div>
                  Grade:{" "}
                  <span className="text-[#3047C0]">
                    {isProcessRunning ? processConfig?.[0]?.Grade : "N/A"}
                  </span>
                </div>
              </div>

              <div>
                Section:{" "}
                <span className="text-[#3047C0]">
                  {isProcessRunning ? processConfig?.[0]?.Section : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* <div className="h-[300px] md:h-[350px] xl:h-auto xl:flex xl:flex-1"> */}
          <div className="xl:flex xl:flex-1">
            <ThreeDModel
              lastData={lastData}
              thresholdStatus={thresholdStatus}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:gap-0 justify-between items-center  ">
            <div className="flex gap-4 font-normal text-sm 2xl:text-base">
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

            {/* last updated */}
            <div className="bg-[#EAEDF9] rounded-md p-2 text-xs 2xl:text-base flex gap-2">
              <div className="flex gap-0.5 items-center">
                <LuHistory />
                Recent data:
              </div>

              {lastData && (
                <div className="font-semibold text-[#3047C0]">
                  {lastData.Timestamp}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* chart */}
        <div className="w-full xl:w-[60%] bg-white rounded-xl p-2 flex flex-col gap-4 xl:gap-0">
          {/* chart top bar */}
          <div className="xl:h-[13%]  text-sm 2xl:text-base text-[#1D2B73] flex flex-col-reverse gap-4 xl:gap-0 xl:flex-row justify-between items-center">
            {/* min max values */}
            <div className="flex gap-2 w-full xl:w-[65%] font-medium">
              <button
                className="text-[#3047C0] hover:text-[#293ea7] text-lg 2xl:text-2xl hover-effect"
                onClick={() => handleScroll("left")}
              >
                <FaChevronCircleLeft />
              </button>
              <div
                ref={scrollRef}
                className="overflow-auto flex gap-2"
                style={{ scrollbarWidth: "none" }}
              >
                {sensorValues &&
                  Object.keys(sensorValues).map((sensorKey) => (
                    <div
                      key={sensorKey}
                      className="bracket-border flex items-center gap-1 text-[10px] leading-normal md:text-xs md:leading-none 2xl:text-sm px-1"
                    >
                      <div className="text-base">{sensorKey}:</div>
                      <div className="flex flex-col text-[#3047C0]">
                        <div className="flex items-center">
                          <FaTemperatureArrowUp className="text-red-500" />{" "}
                          {sensorValues[sensorKey].max}
                          °C
                        </div>
                        <div className="flex items-center">
                          <FaTemperatureArrowDown className="text-green-500" />{" "}
                          {sensorValues[sensorKey].min}°C
                        </div>
                      </div>
                      <div className="flex items-center text-[#3047C0]">
                        <PiSigmaBold className="text-[#1D2B73]" />
                        {sensorValues[sensorKey].avg}°C
                      </div>
                    </div>
                  ))}
              </div>
              <button
                className="text-[#3047C0] hover:text-[#293ea7] text-lg 2xl:text-2xl hover-effect"
                onClick={() => handleScroll("right")}
              >
                <FaChevronCircleRight />
              </button>
            </div>

            <div
              className={`flex items-center justify-between xl:justify-end gap-4 w-full xl:w-[35%] `}
            >
              {isProcessRunning ? (
                <div className="flex font-medium text-[#3047C0]">
                  {timeElapsed}
                </div>
              ) : (
                <div className={`flex gap-2`}>
                  <button
                    className={`interval-button ${
                      liveIntervalOption === "1h" && "bg-[#3047C0] text-white"
                    }`}
                    onClick={() => handleLiveIntervalOption("1h")}
                  >
                    1H
                  </button>
                  <button
                    className={`interval-button ${
                      liveIntervalOption === "3h" && "bg-[#3047C0] text-white"
                    }`}
                    onClick={() => handleLiveIntervalOption("3h")}
                  >
                    3H
                  </button>
                  <button
                    className={`interval-button ${
                      liveIntervalOption === "6h" && "bg-[#3047C0] text-white"
                    }`}
                    onClick={() => handleLiveIntervalOption("6h")}
                  >
                    6H
                  </button>
                  <button
                    className={`interval-button ${
                      liveIntervalOption === "12h" && "bg-[#3047C0] text-white"
                    }`}
                    onClick={() => handleLiveIntervalOption("12h")}
                  >
                    12H
                  </button>
                </div>
              )}
              {/* interval selection */}

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
          </div>

          {/* line chart */}
          <div className="h-[250px] md:h-[300px] xl:h-[69%] ">
            {dataFromApp.length > 0 ? (
              <Line
                ref={chartRef}
                data={lineData}
                options={lineOptions}
                width={"100%"}
              />
            ) : (
              <div className="flex justify-center h-full items-center text-sm 2xl:text-base text-[#3047C0]">
                No data available!
              </div>
            )}
          </div>

          <div className="xl:h-[18%] flex justify-center flex-wrap gap-2 text-xs md:text-sm 2xl:text-base text-[#3047C0] font-medium ">
            {chartRef.current &&
              chartRef.current.data.datasets.map((dataset, index) => (
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
        </div>
      </div>

      {/* stop popup */}
      {stopPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-[#EAEDF9] rounded-md px-4 py-6 flex flex-col gap-6">
            <div>Are you sure you want to stop the process?</div>
            <div className="flex gap-2 justify-end">
              <button
                className="white-button"
                onClick={() => setStopPopup(false)}
              >
                Cancel
              </button>

              <button
                className="blue-button"
                onClick={() => updateProcessConfig(null, "stop")}
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* clear popup */}
      {clearPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-[#EAEDF9] rounded-md px-4 py-6 flex flex-col gap-6">
            <div>Are you sure you want to clear all the alert logs?</div>
            <div className="flex gap-2 justify-end">
              <button
                className="white-button"
                onClick={() => setClearPopup(false)}
              >
                Cancel
              </button>

              <button
                className="blue-button"
                onClick={() => updateProcessConfig(null, "clear")}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* terms and conditions */}

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

export default MainPage;
