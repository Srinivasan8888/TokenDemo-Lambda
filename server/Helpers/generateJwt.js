import jwt from "jsonwebtoken";
import createError from "http-errors";
import getRedisClient, { ensureRedisConnection } from "./initRedis.js";

export const createAccessToken = async (userId, role) => {
  const payload = { role };
  const secretKey = process.env.ACCESS_SECRET_KEY;

  if (!secretKey) {
    console.error("ACCESS_SECRET_KEY is not defined");
    throw createError.InternalServerError("JWT secret key not configured");
  }

  const options = {
    expiresIn: "1d",
    issuer: "xyma",
    audience: userId,
  };

  try {
    const token = await jwt.sign(payload, secretKey, options);
    console.log("[JWT] Access token created | user:", userId);

    // Try to persist session in Redis, but do not fail login if Redis is down
    try {
      const client = await ensureRedisConnection();
      await client.set(`accessToken:${userId}`, token, "EX", 24 * 60 * 60);
      console.log("[JWT] Access token stored in Redis | user:", userId);
    } catch (redisError) {
      console.warn("[JWT] Failed to store access token in Redis | user:", userId, "| err:", redisError.message);
    }

    return token;
  } catch (error) {
    console.error("[JWT] createAccessToken signing error:", error.message);
    throw createError.InternalServerError("Failed to create access token");
  }
};

export const verifyAccessToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return next(createError.Unauthorized());
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.ACCESS_SECRET_KEY, async (err, payload) => {
      if (err) {
        const message =
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        console.log("JWT verification failed:", message);
        return next(createError.Unauthorized(message));
      }

      try {
        const userId = payload.aud;
        const client = await ensureRedisConnection();
        const storedToken = await client.get(`accessToken:${userId}`);

        if (token !== storedToken) {
          console.log("Session expired for user:", userId);
          return next(createError.Unauthorized("Session expired"));
        }

        req.payload = payload;
        next();
      } catch (redisError) {
        console.error("Redis error during token verification:", redisError.message);
        return next(createError.InternalServerError("Token verification failed"));
      }
    });
  } catch (error) {
    console.error("verifyAccessToken error:", error.message);
    return next(createError.InternalServerError());
  }
};

export const createRefreshToken = async (userId, role) => {
  const payload = { role };
  const secretKey = process.env.REFRESH_SECRET_KEY;

  if (!secretKey) {
    console.error("REFRESH_SECRET_KEY is not defined");
    throw createError.InternalServerError("JWT refresh secret key not configured");
  }

  const options = {
    expiresIn: "2d",
    issuer: "xyma",
    audience: userId,
  };

  try {
    const token = await jwt.sign(payload, secretKey, options);
    console.log("[JWT] Refresh token created | user:", userId);

    // Try to persist refresh token in Redis, but do not fail login if Redis is down
    try {
      const client = await ensureRedisConnection();
      await client.set(userId, token, "EX", 2 * 24 * 60 * 60);
      console.log("[JWT] Refresh token stored in Redis | user:", userId);
    } catch (redisError) {
      console.warn("[JWT] Failed to store refresh token in Redis | user:", userId, "| err:", redisError.message);
    }

    return token;
  } catch (error) {
    console.error("[JWT] createRefreshToken signing error:", error.message);
    throw createError.InternalServerError("Failed to create refresh token");
  }
};

export const verifyRefreshToken = async (refreshToken) => {
  try {
    const payload = await jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET_KEY
    );

    const userId = payload.aud;
    const role = payload.role;
    
    // Ensure Redis connection before retrieving token
    const client = await ensureRedisConnection();
    const result = await client.get(userId);

    if (refreshToken === result) {
      console.log("Refresh token verified for user:", userId);
      return { userId, role };
    } else {
      console.log("Refresh token mismatch for user:", userId);
      throw createError.Unauthorized("Invalid refresh token");
    }
  } catch (error) {
    console.error("verifyRefreshToken error:", error.message);
    throw createError.Unauthorized("Invalid refresh token");
  }
};

// verify insert api key
export const verifyApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
      return res.status(403).json({ message: "Forbidden: Invalid API key" });
    }

    next();
  } catch (error) {
    next(error);
  }
};
