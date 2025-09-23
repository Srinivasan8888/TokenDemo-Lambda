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

//mac commit
const NotFound = () => {
  return (
    <div className="h-screen flex justify-center items-center bg-gray-800 text-white text-2xl">
      404 - Page Doesn't Exist!
    </div>
  );
};

const App = () => {
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
            element={<MainPage />}
          />
          <Route
            path="reports"
            element={<Reports />}
          />
          <Route
            path="analysis"
            element={<Analysis />}
          />
          <Route
            path="sensor/:sensorId"
            element={<Sensor />}
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
            element={<AdminPage />}
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
