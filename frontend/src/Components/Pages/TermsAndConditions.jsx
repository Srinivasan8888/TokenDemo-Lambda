import React from "react";
import API from "../../Api/axiosInterceptor";
import { useNavigate, useOutletContext } from "react-router-dom";

import xymaLogo from "../Assets/xymaLogoBlue.png";
import jindalLogo from "../Assets/jindalLogo.png";

import { GrDocumentText } from "react-icons/gr";

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const { userEmail } = useOutletContext();

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
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const updateThreshold = async (e, requestFor) => {
    try {
      if (e) {
        e.preventDefault();
      }
      const response = await API.post("/updateThreshold", {
        requestFor,
        userEmail,
      });
      //   console.log("accept response", response);
      if (response.status === 200) {
        console.log("navigated to main");
        // navigate("/");
        window.location.reload();
      }
      //   return response;
    } catch (error) {
      console.error("updateThreshold error catched!", error);
    }
  };

  console.log("user email in tc", userEmail);

  return (
    <div className="min-h-screen xl:h-screen bg-[#e9edf9] flex flex-col p-4">
      {/* top bar */}
      <div className="relative flex justify-between items-center h-[8%]">
        <img src={xymaLogo} className="max-w-[80px] 2xl:max-w-[100px]" />

        <div className="flex absolute text-[#1D2B73] font-semibold text-sm 2xl:text-base left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          SKIN TEMPERATURE MEASUREMENT
        </div>

        <img src={jindalLogo} className="max-w-[80px] 2xl:max-w-[100px]" />
      </div>

      {/* t&c */}
      <div className="flex justify-center items-center h-[92%]">
        <div className="h-[60%] w-[40%] p-4 flex flex-col gap-4 bg-white">
          <div className="flex items-center justify-center text-xl font-medium gap-4">
            <GrDocumentText className="text-6xl text-[#3047C0]" />
            Terms and Conditions
          </div>

          <div
            className="space-y-4 overflow-y-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#E0E3F6 transparent",
            }}
          >
            <section>
              <h3 className="font-semibold text-lg text-gray-900">
                User Monitoring & Activity Logging
              </h3>
              <p className="whitespace-normal">
                We monitor and record user interactions on this dashboard,
                including but not limited to:
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>Login and logout timestamps</li>
                <li>Initiation of processes or operations</li>
                <li>Report generation and download activity</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg text-gray-900">
                Location and IP Tracking
              </h3>
              <p className="whitespace-normal">
                We collect and store information about your access location and
                IP address for:
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>Security auditing</li>
                <li>Usage analytics</li>
                <li>Fraud prevention and accountability</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg text-gray-900">
                Data Usage and Storage
              </h3>
              <p className="whitespace-normal">
                All collected data is stored securely and used solely for
                operational, analytical, and security purposes. We do not sell
                or share your data with third parties without your explicit
                consent, unless required by law.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg text-gray-900">
                User Responsibility
              </h3>
              <p className="whitespace-normal">
                Users are responsible for maintaining the confidentiality of
                their login credentials. Any action performed under a logged-in
                account will be considered as performed by the account owner.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg text-gray-900">Consent</h3>
              <p className="whitespace-normal">
                By continuing to use this dashboard, you consent to the above
                practices.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg text-gray-900">
                Policy Changes
              </h3>
              <p className="whitespace-normal">
                We reserve the right to update these terms at any time. Users
                will be notified of any significant changes.
              </p>
            </section>
          </div>

          <div className="flex justify-end items-center gap-4">
            <button
              className="white-button border border-[#3047C0]"
              onClick={handleLogout}
            >
              Decline
            </button>
            <button
              className="blue-button"
              onClick={async () => {
                updateThreshold(null, "accept");
                // navigate("/");
              }}
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
