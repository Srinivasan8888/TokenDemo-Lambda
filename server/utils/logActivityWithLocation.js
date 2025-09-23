import userActivityModel from "../Models/UserActivityModel.js";

const logActivityWithLocation = async (req, activityInfo) => {
    try {
        const ipAddress =
            req.headers["x-forwarded-for"]?.split(",")[0] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            req.ip;

        if (!ipAddress) {
            console.log("Ip not found!");
            return null;
        }

        // const response = await axios.get(
        //     "http://database.xyma.live/sensor/getLocationInfo", { params: { Ip: ipAddress } }
        // );

        // if (response.status === 200) {
        //     activityInfo.Ip = response.data.Ip;
        //     activityInfo.City = response.data.City;
        //     activityInfo.Region = response.data.Region;
        //     activityInfo.Country = response.data.Country;
        //     activityInfo.Latitude = response.data.Latitude;
        //     activityInfo.Longitude = response.data.Longitude;
        //     activityInfo.Isp = response.data.Isp;

        //     await userActivityModel.create(activityInfo);
        //     console.log("User activity logged!");
        // }
    } catch (error) {
        console.error("logActivityWithLocation error catched!", error.message);
        return null;
    }
};

export default logActivityWithLocation;
