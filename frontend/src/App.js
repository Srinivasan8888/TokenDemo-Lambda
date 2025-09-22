import React, { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Login from "./Components/Pages/Login";
import MainPage from "./Components/Pages/MainPage";
import AdminPage from "./Components/Pages/AdminPage";
import Reports from "./Components/Pages/Reports";
import Analysis from "./Components/Pages/Analysis";
import Settings from "./Components/Pages/Settings";
import Sensor from "./Components/Pages/Sensor";
import TermsAndConditions from "./Components/Pages/TermsAndConditions";
import ProtectedRoute from "./Api/protectedRoute";
import API from "./Api/axiosInterceptor";

//mac commit
const NotFound = () => {
  return (
    <div className="h-screen flex justify-center items-center bg-gray-800 text-white text-2xl">
      404 - Page Doesn't Exist!
    </div>
  );
};

const App = () => {
  const [data, setData] = useState([]);
  const [lastData, setLastData] = useState([]);
  const [activityStatus, setActivityStatus] = useState("");
  const [sensorValues, setSensorValues] = useState({});
  const [thresholdStatus, setThresholdStatus] = useState({});
  const [processConfig, setProcessConfig] = useState([]);
  const [timeElapsed, setTimeElapsed] = useState("");
  // const [lowerSensors, setLowerSensors] = useState([]);
  // const [upperSensors, setUpperSensors] = useState([]);
  // const [logTime, setLogTime] = useState('');
  const [alertLogs, setAlertLogs] = useState([]);
  const [adminAlertLogs, setAdminAlertLogs] = useState([]);

  const getData = async () => {
    const intervalOption = localStorage.getItem("jindalIntervalOption");
    if (intervalOption) {
      try {
        const response = await API.get("/getData", {
          params: { intervalOption },
        });

        // console.log("response", response.data.alertLogs);

        if (response.status === 200) {
          setData(response.data.data);
          setLastData(response.data.lastData);
          setActivityStatus(response.data.activityStatus);
          setSensorValues(response.data.sensorValues);
          setThresholdStatus(response.data.thresholdStatus);
          setProcessConfig(response.data.processConfig);
          setTimeElapsed(response.data.timeElapsedString);
          setAlertLogs(response.data.alertLogs);
          setAdminAlertLogs(response.data.adminAlertLogs);
        }
      } catch (error) {
        console.error("Error fetching data", error);
      }
    }
  };

  useEffect(() => {
    getData();

    const interval = setInterval(getData, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // console.log("data -> ", data);
  // console.log("last data", lastData);
  // console.log("activity status", activityStatus);
  // console.log("sensor values", sensorValues);
  // console.log("threshold status", thresholdStatus);
  // console.log("process config", processConfig);

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["superAdmin", "admin", "user"]}
              requireTC={false}
            />
          }
        >
          <Route
            path="/terms-and-conditions"
            element={<TermsAndConditions />}
          />
        </Route>

        <Route
          path="/"
          element={
            <ProtectedRoute
              allowedRoles={["superAdmin", "admin", "user"]}
              requireTC={true}
            />
          }
        >
          <Route
            index
            element={
              <MainPage
                dataFromApp={data}
                lastData={lastData}
                activityStatus={activityStatus}
                sensorValues={sensorValues}
                thresholdStatus={thresholdStatus}
                processConfig={processConfig}
                timeElapsed={timeElapsed}
                alertLogs={alertLogs}
              />
            }
          />
          <Route
            path="reports"
            element={<Reports processConfig={processConfig} />}
          />
          <Route
            path="analysis"
            element={<Analysis processConfig={processConfig} />}
          />
          <Route
            path="sensor/:sensorId"
            element={
              <Sensor
                lastData={lastData}
                activityStatus={activityStatus}
                thresholdStatus={thresholdStatus}
              />
            }
          />

          <Route path="settings" element={<Settings />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["superAdmin"]} requireTC={true} />
          }
        >
          <Route
            path="/adminpage"
            element={<AdminPage alertLogs={adminAlertLogs} />}
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
