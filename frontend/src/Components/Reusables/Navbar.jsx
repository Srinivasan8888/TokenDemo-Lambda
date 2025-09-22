import React, { useState } from "react";
import API from "../../Api/axiosInterceptor";
import { useNavigate, useLocation } from "react-router-dom";
import { useOutletContext } from "react-router-dom";

import jindalLogo from "../Assets/jindalLogo.png";
import xymaLogo from "../Assets/xymaLogoBlue.png";

import { IoMdHome, IoMdLogOut } from "react-icons/io";
import { IoSearch } from "react-icons/io5";
import { FaUser, FaChartArea } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { BiSolidReport } from "react-icons/bi";
import { RiMenuFold3Line, RiMenuFold4Line } from "react-icons/ri";
import { ImExit } from "react-icons/im";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userRole, userName } = useOutletContext();

  const handleLogout = async () => {
    try {
      await API.delete("/logout", {
        data: {
          refreshToken: localStorage.getItem("refreshToken"),
          accessToken: localStorage.getItem("accessToken"),
        },
        withCredentials: true,
      });
      localStorage.clear();
      navigate("/login");
      // window.location.reload();
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <>
      {/* desktop navbar */}
      <div className="hidden md:flex flex-col gap-2 xl:flex-row w-full text-base 2xl:text-xl">
        <div className="relative md:flex items-center justify-between gap-4 w-full">
          <div className="flex gap-6 items-center">
            {/* xyma logo */}
            <img src={xymaLogo} className="max-w-[80px] 2xl:max-w-[100px]" />

            {/* nav buttons */}
            <div className="bg-[#E0E3F6] py-2 px-4 rounded-full flex gap-2">
              <button
                className={`nav-button  ${
                  (location.pathname === "/" ||
                    location.pathname.includes("sensor")) &&
                  "bg-[#3047C0] text-white"
                }`}
                onClick={() => navigate("/")}
              >
                <IoMdHome className="text-base 2xl:text-2xl" /> Dashboard
              </button>

              <button
                className={`nav-button  ${
                  location.pathname === "/reports" && "bg-[#3047C0] text-white"
                }`}
                onClick={() => navigate("/reports")}
              >
                <BiSolidReport className="text-base 2xl:text-2xl" /> Reports
              </button>

              <button
                className={`nav-button  ${
                  location.pathname === "/analysis" && "bg-[#3047C0] text-white"
                }`}
                onClick={() => navigate("/analysis")}
              >
                <FaChartArea className="text-base 2xl:text-2xl" />{" "}
                Data&nbsp;Trend
              </button>
            </div>
          </div>

          {/* title */}
          <p className="hidden xl:flex absolute text-[#1D2B73] font-semibold text-sm 2xl:text-base left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            SKIN TEMPERATURE MEASUREMENT
          </p>

          <div className="flex gap-6 items-center">
            {/* tool buttons */}
            <div className="flex items-center gap-2">
              {userRole === "superAdmin" && (
                <button
                  onClick={() => navigate("/adminpage")}
                  className="text-[#3047C0] font-semibold underline hover-effect mr-2 hidden xl:flex"
                >
                  Admin
                </button>
              )}

              <div className="hidden xl:flex gap-2 items-center bg-white rounded-full py-1 px-4 text-[#3047C0] ">
                <FaUser />
                <div className="font-medium text-sm 2xl:text-base">
                  {userName}
                </div>
              </div>

              <button className="tools-button">
                <IoSearch className="text-base 2xl:text-2xl" />
              </button>

              <button
                className={`tools-button hover-effect hover:bg-[#3047C0] hover:text-white ${
                  location.pathname === "/settings" && "bg-[#3047C0] text-white"
                }`}
                onClick={() => navigate("/settings")}
              >
                <FaGear className="" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {/* jindal logo */}
              <img
                src={jindalLogo}
                className="max-w-[80px] 2xl:max-w-[100px]"
              />

              {/* logout */}
              <button
                className={`bg-[#3047C0] rounded-full w-8 h-8 2xl:w-10 2xl:h-10 flex justify-center items-center text-white text-xl 2xl:text-2xl hover:bg-white hover:text-[#3047C0] hover:scale-110 duration-200`}
                onClick={handleLogout}
              >
                <IoMdLogOut />
              </button>
            </div>
          </div>
        </div>

        {/* profile, title, admin navigate button for tab */}
        <div className="flex items-center justify-between xl:hidden">
          <div className="flex gap-2 items-center bg-white rounded-full py-1 px-4 text-[#3047C0] ">
            <FaUser />
            <div className="font-medium text-sm 2xl:text-base">{userName}</div>
          </div>

          <p className="text-[#1D2B73] font-semibold text-sm text-center">
            SKIN TEMPERATURE MEASUREMENT
          </p>

          <div>
            {userRole === "superAdmin" && (
              <button
                onClick={() => navigate("/adminpage")}
                className="text-[#3047C0] font-semibold underline hover-effect mr-2"
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </div>

      {/* mobile navbar */}
      <div className="md:hidden w-full flex flex-col gap-2">
        <div className="flex justify-between items-center">
          {/* xyma logo */}
          <img src={xymaLogo} className="max-w-[75px]" />
          <div className="flex items-center gap-1">
            {/* jindal logo */}
            <img src={jindalLogo} className="max-w-[75px]" />

            {/* menu */}
            <button className="text-2xl" onClick={() => setSidebarOpen(true)}>
              <RiMenuFold3Line />
            </button>
          </div>
        </div>

        {/* title */}
        <p className="text-[#1D2B73] text-center font-semibold text-sm">
          SKIN TEMPERATURE MEASUREMENT
        </p>

        {/* sidebar */}
        <div
          className={`fixed top-0 right-0 w-[55%] text-sm p-4 h-full flex flex-col justify-between bg-[#e9edf9] shadow-lg z-20 transform ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          } transition-transform duration-300 ease-in-out`}
        >
          <div className="flex flex-col gap-12">
            {/* user */}
            <div className="flex justify-between items-center text-[#3047C0]">
              <div className="flex gap-1 items-center">
                <div className="bg-white p-1 text-base rounded-full">
                  <FaUser />
                </div>
                <div className="text-[#1D2B73] font-medium">{userName}</div>
              </div>

              <button
                className="text-2xl"
                onClick={() => setSidebarOpen(false)}
              >
                <RiMenuFold4Line />
              </button>
            </div>

            {/* navigation */}
            <div className="flex flex-col gap-6">
              <button
                className={`nav-button-mobile  ${
                  location.pathname === "/" && "bg-[#3047C0] text-white"
                }`}
                onClick={() => navigate("/")}
              >
                <IoMdHome className="text-lg" /> Dashboard
              </button>

              <button
                className={`nav-button-mobile  ${
                  location.pathname === "/reports" && "bg-[#3047C0] text-white"
                }`}
                onClick={() => navigate("/reports")}
              >
                <BiSolidReport className="text-lg" /> Reports
              </button>

              <button
                className={`nav-button-mobile  ${
                  location.pathname === "/analysis" && "bg-[#3047C0] text-white"
                }`}
                onClick={() => navigate("/analysis")}
              >
                <FaChartArea className="text-lg" /> Data Trend
              </button>

              {/* <button
                className={`nav-button-mobile`}
                // onClick={() => navigate("/settings")}
              >
                <FaUser className="text-lg" /> Profile
              </button> */}

              <button
                className={`nav-button-mobile  ${
                  location.pathname === "/settings" && "bg-[#3047C0] text-white"
                }`}
                onClick={() => navigate("/settings")}
              >
                <FaGear className="text-lg" /> Settings
              </button>

              {userRole === "superAdmin" && (
                <button
                  className={`nav-button-mobile `}
                  onClick={() => navigate("/adminpage")}
                >
                  <FaUser className="text-lg" /> Admin
                </button>
              )}

              <button className={`nav-button-mobile`} onClick={handleLogout}>
                <ImExit className="text-lg" /> Logout
              </button>
            </div>
          </div>

          {/* footer */}
          <div className="text-[10px] leading-tight text-center">
            <p>© 2025 XYMA Analytics Pvt Ltd,</p>
            <p>IIT Madras Research Park,</p>
            <p>Chennai - 600113</p>
          </div>
        </div>

        {/* overlay */}
        {sidebarOpen && (
          <div
            className="fixed top-0 left-0 w-full h-full bg-black/40 z-10"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </>
  );
};

export default Navbar;
