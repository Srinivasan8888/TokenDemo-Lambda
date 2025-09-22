import axios from "axios";

const API_URL = process.env.REACT_APP_JINDAL_API_URL;

const API = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// request interceptor
API.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// response interceptor
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401) {
      const errorMessage = error.response.data.error.message;

      if (errorMessage === "jwt expired" && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const { data } = await axios.post(`${API_URL}/refreshToken`, {
            refreshToken: localStorage.getItem("refreshToken"),
          });

          localStorage.setItem("accessToken", data.newAccessToken);
          localStorage.setItem("refreshToken", data.newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${data.newAccessToken}`;
          return API(originalRequest);
        } catch (refreshError) {
          console.error(
            "Refresh token failed - response interceptor",
            refreshError
          );
          // alert("catched error");
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
          return Promise.reject(refreshError);
        }
      } else if (errorMessage === "Session expired") {
        localStorage.clear();

        // alert("Another device logged in with your credentials!");
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }

        return Promise.reject(error);
      } else if (errorMessage === "Unauthorized") {
        localStorage.clear();

        // alert("unauthorized!");
        // if (!window.location.pathname.includes("/login")) {
        //   window.location.href = "/login";
        // }

        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
