import { User } from "../models/user.model.js";
import { ApiError } from "../utils/api_error.js";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";


export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    console.log("token:", token); // what does this print in your terminal?

    if (!token) {
        throw new ApiError(401, "Unauthorized access");
    }

    try {
        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );

        const foundUser = await User.findById(decodedToken?._id).select(
            "-password -refreshToken -__v -emailVerificationToken -emailVerificationTokenExpiry"
        );

        if (!foundUser) {
            throw new ApiError(401, "Invalid access token");
        }

        req.user = foundUser;
        next();
    } catch (error) {
        // Re-throw ApiErrors as-is, only wrap jwt errors
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(401, error?.message || "Invalid or expired access token");
    }
});