import React, { useState, useEffect } from "react";
import axios from "axios";

import xymaLogo from "../Assets/xymaLogoWhite.png";
import loginCover from "../Assets/loginCover.jpg";

import { useNavigate } from "react-router-dom";
import { FaCircleChevronLeft } from "react-icons/fa6";
import { IoEye, IoEyeOff } from "react-icons/io5";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [forgotPasswordUI, setForgotPasswordUI] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [viewPassword, setViewPassword] = useState(false);

  const API_URL = process.env.REACT_APP_JINDAL_API_URL;

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.clear();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      setViewPassword(false);
    }, 1000);

    return () => clearTimeout(delay);
  }, [viewPassword]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_URL}/userLogin`, {
        username,
        password,
      });

      if (response.data.accessToken && response.data.refreshToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        localStorage.setItem("jindalIntervalOption", "1h");
        localStorage.setItem("jindlaDateOption", "1d");
        localStorage.setItem("loggedInTime", response.data.timeStamp);
        localStorage.setItem("3dConfig", "s1,s2,s3");

        if (response.data.role === "superAdmin") {
          navigate("/adminpage");
        } else {
          navigate("/");
        }
      }

      setUsername("");
      setPassword("");
    } catch (error) {
      alert("Login Failed");
      console.error("Login error", error);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_URL}/forgotPassword`, {
        userName: forgotUsername,
      });
      setForgotUsername("");

      if (response.status === 200) {
        alert("Request received");
      }
    } catch (error) {
      if (error.response?.data?.message === "Invalid User!") {
        alert("Invalid User!");
      } else {
        alert("Request Failed");
      }
      console.error("Error from handleForgotPassword", error);
    }
  };

  return (
    <div
      className="min-h-screen xl:h-screen flex justify-center items-center text-white text-sm md:text-base"
      style={{
        backgroundImage: `url(${loginCover})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex gap-4 md:gap-8 ">
        {/* image section */}
        {/* <img src={loginImage} className="w-1/2" /> */}
        {forgotPasswordUI === false ? (
          // login ui
          <form
            className=" bg-[#3e5cc9]/80 backdrop-blur-sm rounded-2xl py-6 px-12 md:px-20  flex flex-col gap-4"
            onSubmit={handleLogin}
          >
            <div className="flex justify-center items-center">
              <img src={xymaLogo} className="max-w-[110px]" />
            </div>
            <div className="text-center text-xl font-medium">Login</div>
            <div className="flex flex-col gap-2">
              <label htmlFor="username">Username</label>
              <input
                type="email"
                id="username"
                value={username}
                required
                onChange={(e) => setUsername(e.target.value)}
                className=" rounded-md p-1 text-[#1B308D]"
              />
            </div>

            <div className="relative flex flex-col gap-2">
              <label htmlFor="password">Password</label>
              <input
                type={viewPassword ? "text" : "password"}
                id="password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className={`rounded-md p-1 text-[#1B308D] font-medium`}
              />
              <span
                className="absolute right-3 top-9 md:top-10 cursor-pointer text-[#3047C0] bg-white"
                onClick={() => setViewPassword(!viewPassword)}
              >
                {viewPassword ? <IoEyeOff /> : <IoEye />}
              </span>
              <div className="flex justify-end">
                <div
                  className="text-xs text-white cursor-pointer hover-effect hover:text-[#1D2B73] font-medium"
                  onClick={() => setForgotPasswordUI(true)}
                >
                  Forgot Password?
                </div>
              </div>
            </div>

            <button className="w-full hover-effect bg-[#1B308D] hover:bg-[#e9edf9] hover:text-[#1B308D] rounded-md p-2 font-medium ">
              Login
            </button>
          </form>
        ) : (
          // forgot password ui
          <form
            className="relative bg-[#3e5cc9]/80 backdrop-blur-sm rounded-2xl py-10 px-12 md:px-20 flex flex-col gap-6"
            onSubmit={handleForgotPassword}
          >
            <div
              className="absolute top-3 left-3 bg-white text-[#1B308D] hover:text-white hover:bg-[#1B308D] text-2xl cursor-pointer hover-effect rounded-full"
              onClick={() => {
                setForgotPasswordUI(false);
                setForgotUsername("");
              }}
            >
              <FaCircleChevronLeft />
            </div>

            <div className="flex justify-center items-center">
              <img src={xymaLogo} className="max-w-[110px]" />
            </div>

            <div className="text-center text-xl font-medium">
              Password Reset
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="username2">Username</label>
              <input
                type="email"
                id="username2"
                value={forgotUsername}
                required
                onChange={(e) => setForgotUsername(e.target.value)}
                className=" rounded-md p-1 text-[#1B308D]"
              />
            </div>

            <button className="hover-effect bg-[#1B308D] hover:bg-[#e9edf9] hover:text-[#1B308D] rounded-md p-2 font-medium mb-1">
              Request Password Reset
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
