import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import API from "./axiosInterceptor";

const ProtectedRoute = ({ allowedRoles, requireTC }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [acceptedTC, setAcceptedTC] = useState(false);

  useEffect(() => {
    const verifyAccessToken = async () => {
      try {
        const response = await API.get("/verifyToken");
        if (response.status === 200) {
          setIsAuthenticated(true);
          setUserRole(response.data.role);
          setUserName(response.data.name);
          setUserEmail(response.data.email);

          if (response.data.acceptedTC === "yes") {
            setAcceptedTC(true);
          } else {
            setAcceptedTC(false);
          }
        }
      } catch (error) {
        console.error("Token verfication failed - protected route", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    verifyAccessToken();
  }, []);

  if (loading)
    return (
      <div className="h-screen flex justify-center items-center bg-[#e9edf9] thetext-[#1D2B73]">
        Loading ...
      </div>
    );

  if (!isAuthenticated || !allowedRoles.includes(userRole)) {
    console.log("inside first if");
    return <Navigate to="/login" replace />;
  } else if (requireTC && !acceptedTC) {
    console.log("inside second if");
    return <Navigate to="/terms-and-conditions" replace />;
  } else if (!requireTC && acceptedTC) {
    console.log("inside 3rd if");
    return <Navigate to="/" replace />;
  } else {
    console.log("inside else");
    return <Outlet context={{ userRole, userName, userEmail }} />;
  }
};
export default ProtectedRoute;
