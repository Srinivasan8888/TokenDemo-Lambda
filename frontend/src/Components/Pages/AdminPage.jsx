import React, { useState, useEffect, useRef } from "react";
import API from "../../Api/axiosInterceptor";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import xymaLogoWhite from "../Assets/xymaLogoBlue.png";
import jindalLogo from "../Assets/jindalLogo.png";

import { IoMdHome, IoMdLogOut } from "react-icons/io";
import { FaBell } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { GrEdit } from "react-icons/gr";

const AdminPage = () => {
  const navigate = useNavigate();
  const divRef = useRef(null);

  const [Email, setEmail] = useState("");
  const [Password, setPassword] = useState("");
  const [Role, setRole] = useState("");
  const [Name, setName] = useState("");

  const [users, setUsers] = useState([]);
  const [alertLogs, setAlertLogs] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [mailLogs, setMailLogs] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [idToDelete, setIdToDelete] = useState("");
  const [userToDelete, setUserToDelete] = useState("");
  const [idToReset, setIdToReset] = useState("");
  const [userToReset, setUserToReset] = useState("");
  const [deletePopup, setDeletePopup] = useState(false);
  const [resetPopup, setResetPopup] = useState(false);

  const [selectedUser, setSelectedUser] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");

  useEffect(() => {
    getAdminData();

    const interval = setInterval(getAdminData, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [selectedUser, selectedActivity]);

  const getAdminData = async () => {
    try {
      const response = await API.get("/getAdminData", {
        params: {
          selectedUser,
          selectedActivity,
        },
      });

      if (response.status === 200) {
        setUsers(response.data.users);
        setAlertLogs(response.data.alertLogs);
        setUserActivity(response.data.userActivity);
        setMailLogs(response.data.mailLogs);
      }
    } catch (error) {
      console.error("Error from getAdminData", error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post("/userSignup", {
        Email,
        Password,
        Role,
        Name,
      });

      if (response.status === 201) {
        toast.success(
          <div className="text-gray-600 break-words whitespace-normal text-sm 2xl:text-base">
            {response.data.message}
          </div>
        );
      }
      getAdminData();

      setEmail("");
      setPassword("");
      setRole("");
      setName("");
    } catch (error) {
      alert("Error in adding users!");
      console.error("Error from handleAddUser", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await API.delete("/deleteUser", { data: { userId } });

      if (response.status === 200) {
        toast.success(
          <div className="text-gray-600 break-words whitespace-normal text-sm 2xl:text-base">
            {response.data.message}
          </div>
        );
      }
      getAdminData();
    } catch (error) {
      alert("Error in deleting users!");
      console.error("Error from handleDeleteUser", error);
    }
  };

  const handleChangePassword = async (userId, newPassword) => {
    try {
      const response = await API.post("/changePassword", {
        userId,
        newPassword,
      });
      setResetPopup(false);
      if (response.data.success) {
        alert("Password changed successfully!");
      }
    } catch (error) {
      alert("Error in changing password!");
      console.error("Error from handleChangePassword", error);
    }
  };

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

  // console.log("user activity", userActivity);
  // console.log("mail logs", mailLogs);
  console.log("user email", users);
  // console.log("selected user", selectedUser);
  // console.log("selected activity", selectedActivity);

  return (
    <div className="min-h-screen xl:h-screen bg-[#e9edf9] text-[#1D2B73] p-4 flex flex-col gap-4 text-sm 2xl:text-base">
      {/* top bar */}
      <div className="relative flex justify-between items-center xl:h-[8%]">
        <img src={xymaLogoWhite} className="max-w-[80px] 2xl:max-w-[100px]" />

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden xl:block text-[#1D2B73] font-semibold">
          SKIN TEMPERATURE MEASUREMENT / ADMIN
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#E0E3F6] py-2 px-4 rounded-full flex gap-2">
            <button
              className="nav-button "
              onClick={() => {
                navigate("/");
              }}
            >
              <IoMdHome className="text-base 2xl:text-2xl" />{" "}
              <span className="hidden md:block">Dashboard</span>
            </button>

            <button className="nav-button" onClick={handleLogout}>
              <IoMdLogOut className="text-base 2xl:text-2xl" />
              <span className="hidden md:block">Logout</span>
            </button>
          </div>

          <img src={jindalLogo} className="max-w-[80px] 2xl:max-w-[100px]" />
        </div>
      </div>

      <div className="xl:hidden font-medium text-center text-sm md:text-lg">
        SKIN TEMPERATURE MEASUREMENT / ADMIN
      </div>

      {/* main content */}
      <div className="xl:h-[92%] flex flex-col xl:flex-row gap-4 p-4 bg-white rounded-xl w-full ">
        <div className="w-full xl:w-[30%] flex flex-col md:flex-row xl:flex-col gap-4">
          {/* add user */}
          <form
            className="bg-[#EAEDF9] rounded-md xl:h-1/2 flex flex-col justify-between gap-4 xl:gap-2 2xl:gap-4 p-4 xl:p-2 2xl:p-4 md:w-1/2 xl:w-auto"
            onSubmit={handleAddUser}
          >
            <div className="text-center text-base 2xl:text-lg font-medium">
              Add Credential
            </div>

            <div className="flex flex-col gap-4 xl:gap-2 2xl:gap-4">
              <div className="flex items-center">
                <label className="w-1/3 ">Email</label>
                <input
                  type="email"
                  placeholder="Email..."
                  value={Email}
                  required
                  className="w-2/3  rounded-md p-2"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="flex items-center">
                <label className="w-1/3">Password</label>
                <input
                  type="password"
                  value={Password}
                  required
                  placeholder="Password..."
                  className="w-2/3  rounded-md p-2"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center">
                <label className="w-1/3">Name</label>
                <input
                  type="text"
                  value={Name}
                  required
                  placeholder="Name..."
                  className="w-2/3  rounded-md p-2"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center">
              <label className="w-1/3">Role</label>

              <div className="w-2/3 flex gap-4 xl:gap-2 2xl:gap-4 py-2 flex-wrap xl:flex-nowrap">
                <div className="flex gap-1 hover-effect">
                  <input
                    type="radio"
                    value="user"
                    name="role"
                    id="userRadio"
                    className="cursor-pointer"
                    required
                    onChange={(e) => setRole(e.target.value)}
                    checked={Role === "user"}
                  />
                  <label htmlFor="userRadio" className="cursor-pointer">
                    User
                  </label>
                </div>

                <div className="flex gap-1 hover-effect">
                  <input
                    type="radio"
                    value="admin"
                    name="role"
                    id="adminRadio"
                    className="cursor-pointer"
                    required
                    onChange={(e) => setRole(e.target.value)}
                    checked={Role === "admin"}
                  />
                  <label htmlFor="adminRadio" className="cursor-pointer">
                    Admin
                  </label>
                </div>

                <div className="flex gap-1 hover-effect">
                  <input
                    type="radio"
                    value="superAdmin"
                    name="role"
                    id="superAdminRadio"
                    className="cursor-pointer"
                    required
                    onChange={(e) => setRole(e.target.value)}
                    checked={Role === "superAdmin"}
                  />
                  <label htmlFor="superAdminRadio" className="cursor-pointer">
                    Super-Admin
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="blue-button">
                Add Credential
              </button>
            </div>
          </form>

          {/* alert logs */}
          <div className="xl:h-1/2 flex flex-col gap-4 bg-[#EAEDF9] p-4 rounded-md md:w-1/2 xl:w-auto">
            <div className="font-medium flex gap-2 items-center justify-between text-base 2xl:text-lg">
              <div className="w-10" />

              <div className="flex gap-2 items-center justify-center text-base 2xl:text-lg">
                Alert Logs{" "}
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
                // onClick={() => setClearPopup(true)}
                disabled={alertLogs?.length === 0}
              >
                <FaRegTrashCan />
                Clear
              </button>
            </div>

            <div
              className="flex flex-col gap-4 text-white overflow-auto text-xs 2xl:text-sm h-[300px] xl:h-auto"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#E0E3F6 transparent",
              }}
            >
              {alertLogs?.length > 0 ? (
                alertLogs.map((alert, i) => (
                  <div key={i} className="flex flex-col gap-4">
                    {alert.UpperSensors.length > 0 && (
                      <div className="bg-red-500 rounded-md p-2 flex flex-col gap-2">
                        <div className="underline font-medium text-yellow-200 whitespace-normal">
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
                      <div className="bg-[#3047C0] rounded-md p-2 flex flex-col gap-2">
                        <div className="underline font-medium text-yellow-200 whitespace-normal">
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

        <div className="xl:w-[70%] flex flex-col gap-4 ">
          <div className=" xl:h-[40%] flex flex-col md:flex-row gap-4">
            {/* report logs */}
            <div className="w-full md:w-[40%] p-2 bg-[#EAEDF9] rounded-md flex flex-col gap-2 ">
              <div className="text-center text-base 2xl:text-lg font-medium">
                Report logs
              </div>

              <div
                className="overflow-auto h-[300px] xl:h-auto"
                style={{ scrollbarWidth: "none" }}
              >
                <table className="w-full border-collapse text-sm 2xl:text-base">
                  <thead className="bg-[#3047C0] text-white sticky top-0">
                    <tr>
                      <th className="border border-gray-400 px-4 py-2">S.No</th>
                      <th className="border border-gray-400 px-4 py-2">Time</th>
                      <th className="border border-gray-400 px-4 py-2">Sent</th>
                      <th className="border border-gray-400 px-4 py-2">
                        Failed
                      </th>
                      <th className="border border-gray-400 px-4 py-2">
                        Error
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {mailLogs.length > 0 ? (
                      mailLogs.map((data, index) => (
                        <tr key={data._id} className="text-center">
                          <td className="border border-gray-400 px-4 py-2">
                            {index + 1}
                          </td>

                          <td className="border border-gray-400 px-4 py-2">
                            {data.Time}
                          </td>

                          <td className="border border-gray-400 px-4 py-2 whitespace-normal">
                            {data.Accepted}
                          </td>

                          <td className="border border-gray-400 px-4 py-2">
                            {data.Rejected}
                          </td>

                          <td className="border border-gray-400 px-4 py-2">
                            {data.Errors}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="border border-gray-400 px-4 py-2 text-center"
                        >
                          No reports sent
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* available users */}
            <div className="p-2 bg-[#EAEDF9] rounded-md flex flex-col gap-2 w-full md:w-[58.5%] ">
              <div className="text-center text-base 2xl:text-lg font-medium">
                Available Users
              </div>
              {/* table */}
              <div
                className="overflow-auto h-[300px] xl:h-auto"
                style={{ scrollbarWidth: "none" }}
              >
                <table className="w-full border-collapse text-sm 2xl:text-base">
                  <thead className="bg-[#3047C0] text-white sticky top-0">
                    <tr>
                      <th className="border border-gray-400 px-4 py-2 ">
                        S.No
                      </th>
                      <th className="border border-gray-400 px-4 py-2">
                        Username
                      </th>
                      <th className="border border-gray-400 px-4 py-2">Name</th>
                      <th className="border border-gray-400 px-4 py-2">Role</th>
                      <th className="border border-gray-400 px-4 py-2">
                        AcceptedTC
                      </th>
                      <th className="border border-gray-400 px-4 py-2">
                        Delete
                      </th>
                      <th className="border border-gray-400 px-4 py-2">
                        Reset Pass
                      </th>
                    </tr>
                  </thead>

                  <tbody className="">
                    {users.length > 0 ? (
                      users.map((user, index) => (
                        <tr key={user._id} className="text-center">
                          <td className="border border-gray-400 px-4 py-2">
                            {index + 1}
                          </td>
                          <td className="border border-gray-400 px-4 py-2">
                            {user.Email}
                          </td>
                          <td className="border border-gray-400 px-4 py-2">
                            {user.Name}
                          </td>
                          <td
                            className={`border border-gray-400 px-4 py-2 ${
                              user.Role === "superAdmin"
                                ? "text-[#3047C0] font-semibold"
                                : ""
                            }`}
                          >
                            {user.Role}
                          </td>
                          <td className="border border-gray-400 px-4 py-2">
                            {user.AcceptedTC}
                          </td>
                          <td className="border border-gray-400 px-4 py-2">
                            <button
                              className="blue-button bg-red-500"
                              onClick={() => {
                                setIdToDelete(user._id);
                                setUserToDelete(user.Email);
                                setDeletePopup(true);
                              }}
                            >
                              <FaRegTrashCan className="text-xl 2xl:text-2xl" />
                            </button>
                          </td>
                          <td className="border border-gray-400 px-4 py-2">
                            <button
                              className="blue-button"
                              onClick={() => {
                                setResetPopup(true);
                                setIdToReset(user._id);
                                setUserToReset(user.Email);
                              }}
                            >
                              <GrEdit className="text-xl 2xl:text-2xl" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="border border-gray-400 px-4 py-2 text-center"
                        >
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* user activity */}
          <div
            className="xl:h-[60%] bg-[#EAEDF9] p-4 rounded-md flex flex-col gap-4"
            ref={divRef}
          >
            <div className=" flex flex-col md:flex-row gap-2 justify-between items-center">
              <div className="text-base font-medium flex justify-between">
                User Activity
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                {/* email dd */}
                <div className="flex items-center gap-2">
                  <label>User:</label>
                  <select
                    className="p-1 rounded-md"
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    <option value="">--All--</option>

                    {users?.map((data, i) => (
                      <option key={i} value={data.Email}>
                        {data.Email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* activity type dd */}
                <div className="flex items-center gap-2">
                  <label>Activity:</label>
                  <select
                    className="p-1 rounded-md"
                    onChange={(e) => setSelectedActivity(e.target.value)}
                  >
                    <option value="">--All--</option>

                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
                    <option value="processStart">Process Start</option>
                    <option value="processStop">Process Stop</option>
                    <option value="logThrehsold">Alert Log Threshold</option>
                    <option value="clearAlertLogs">Alert Logs Clear</option>
                    <option value="thresholdUpdate">Mail Threshold</option>
                    <option value="alertMailAdd">Alert Mail Add</option>
                    <option value="alertMailDelete">Alert Mail Delete</option>
                    <option value="alertDelayUpdate">Alert Delay</option>
                    <option value="reportFrequencyUpdate">
                      Reports Frequency
                    </option>
                    <option value="reportMailAdd">Reports Mail Add</option>
                    <option value="verifyOldPass">Verify Old Password</option>
                    <option value="resetPass">Reset Password</option>
                    <option value="reportsDownload">Reports Download</option>
                  </select>
                </div>
              </div>
            </div>

            <div
              className="overflow-auto h-[300px] xl:h-auto flex flex-col gap-4"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#E0E3F6 transparent",
              }}
            >
              {userActivity?.map((data, i) => (
                <div
                  className="rounded-md bg-white p-2 flex flex-col gap-4"
                  key={i}
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div>
                        User:{" "}
                        <span className="text-[#3047C0] font-medium">
                          {data.Email}
                        </span>
                      </div>
                      <div>
                        Activity:{" "}
                        <span className="text-[#3047C0] font-medium">
                          {data.ActivityType}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                      <div>
                        City:{" "}
                        <span className="text-[#3047C0] font-medium">
                          {data.City ?? "N/A"}
                        </span>
                      </div>
                      <div>
                        Region:{" "}
                        <span className="text-[#3047C0] font-medium">
                          {data.Region ?? "N/A"}
                        </span>
                      </div>
                      <div>
                        Country:{" "}
                        <span className="text-[#3047C0] font-medium">
                          {data.Country ?? "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-2 rounded-md  shadow-lg whitespace-normal ${
                      data.ActivityType === "login"
                        ? "border border-green-500"
                        : data.ActivityType === "logout"
                        ? "border border-red-500"
                        : "border border-[#3047C0]"
                    }`}
                  >
                    {data.Action}
                  </div>

                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      ISP:{" "}
                      <span className="text-[#3047C0] font-medium whitespace-normal">
                        {data.Isp ?? "N/A"}{" "}
                      </span>
                    </div>
                    <div>
                      IP:{" "}
                      <span className="text-[#3047C0] font-medium">
                        {data.Ip ?? "N/A"}{" "}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div>
                      Location:{" "}
                      <span className="text-[#3047C0] font-medium">
                        {data.Latitude ?? "N/A"} : {data.Longitude ?? "N/A"}{" "}
                      </span>
                    </div>
                    <div className="text-sm text-start md:text-end">
                      Time:{" "}
                      <span className="text-[#3047C0] font-medium">
                        {data.Time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* delete popup */}
      {deletePopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-[#EAEDF9] rounded-xl p-4 md:p-6 flex flex-col gap-4 md:gap-6 mx-4 md:mx-0">
            <div className=" text-center">
              Are you sure you want to delete "
              <span className="text-[#3047C0] font-medium">{userToDelete}</span>
              "?
            </div>
            <div className="flex justify-end gap-2 md:gap-4">
              <button
                className="white-button"
                onClick={() => {
                  setDeletePopup(false);
                  setIdToDelete("");
                  setUserToDelete("");
                }}
              >
                Cancel
              </button>
              <button
                className="blue-button"
                onClick={() => {
                  handleDeleteUser(idToDelete);
                  setDeletePopup(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* reset popup */}
      {resetPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <form
            className="bg-[#EAEDF9] rounded-xl py-4 px-4 md:py-6 md:px-8 flex flex-col gap-4 md:gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleChangePassword(idToReset, newPassword);
            }}
          >
            <div className="font-medium">
              Set new password for "{userToReset}"
            </div>
            <input
              type="password"
              value={newPassword}
              required
              placeholder="New password..."
              className="rounded-sm p-1 text-sm 2xl:text-base"
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <div className="flex justify-end gap-2 md:gap-4">
              <div
                className="white-button"
                onClick={() => {
                  setResetPopup(false);
                  setIdToReset("");
                  setUserToReset("");
                }}
              >
                Cancel
              </div>
              <button type="submit" className="blue-button">
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

export default AdminPage;
