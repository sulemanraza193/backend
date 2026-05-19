import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/api_response.js"
import { ApiError } from "../utils/api_error.js"
import asyncHandler from "../utils/asyc_handler.js";
import { sendEmail } from "../utils/mail.js"
import Mailgen from "mailgen"
import { emailVerificationMailgenContent } from "../utils/mail.js"
import isEmail from "validator/lib/isEmail.js";
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { forgotPasswordMailgenContent } from "../utils/mail.js"

// function to generate access and refresh token
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, "Failed to generate access and refresh token", [error.message]);
    }
};
// register user controller
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, role } = req.body

    const userExist = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (userExist) throw new ApiError("user alreagy exist", 409, [])

    const user = await User.create({
        username,
        email,
        password,
        isEmailVerified: false,
    })

    const { unHashedToken, hashedToken, expiryToken } =
        user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken
    user.emailVerificationTokenExpiry = expiryToken

    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user.email,
        subject: "Email verification",
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`

        )
    })

    const createUser = await User.findById(user._id).select("-password -__v -emailVerificationToken -emailVerificationTokenExpiry")

    if (!createUser) throw new ApiError("failed to create user", 500, [])

    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                { user: createUser },
                "user created successfully and verification email sent to your email inbox"
            ))



})

// login user controller
const loginUser = asyncHandler(async (req, res,) => {
    const { email, password, username } = req.body

    if (!email) {
        throw new ApiError(400, "email is required")
    }

    const user = await User.findOne({ email })
    if (!user) {
        throw new ApiError(404, "user not found")
    }

    if (!password) {
        throw new ApiError(400, "password is required")
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if (!isPasswordCorrect) {
        throw new ApiError(401, "password is incorrect")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedIn = await User.findById(user._id)
        .select("-password -__v -emailVerificationToken -emailVerificationTokenExpiry")

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedIn,
                    accessToken,
                    refreshToken,
                }
            ),
            "user logged in successfully"
        )

})

// logout user controller
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: null,
            }
        },
        {
            new: true,
        }

    );
    const options = {
        http: true,
        secure: true,
    }
    return res
        .status(200)
        .clearCoookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "user logged out successfully"))
})

// current user

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, { user: req.user }, "current user fetched successfully"))
})

// email verification controller
const verifyEmail = asyncHandler(async (req, res) => {
    const { verificationToken } = req.params

    if (!verifyToken) {
        throw new ApiError(400, "Email verification token is missing")
    }

    let hashedToken = crypto
        .createHash("sh256")
        .update(verifyToken)
        .digest("hex")

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationTokenExpiry: { $gt: Date.now() }

    })

    if (!user) {
        throw new ApiError(400, "Token is invalid or expired")
    }

    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;

    user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    isEmailVerified: true
                },
                "email verified successfully"))


})

//resend email verification token controller

const resendEmailVerification = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id)



    if (!user) {
        throw new ApiError(400, "User not found")
    }

    if (user.isEmailVerified) {
        throw new ApiError(400, "Email is already verified")
    }

    const { unHashedToken, hashedToken, expiryToken } =
        user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken
    user.emailVerificationTokenExpiry = expiryToken

    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user.email,
        subject: "Email verification",
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`

        )
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "verification email resent to your email inbox"
            ))
})

// refresh token controller

const refreshAccessToken = asyncHandler(async (req, res) => {
    const inComingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!inComingRefreshToken) {
        throw new ApiError(400, "Refresh token is missing");
    }

    try {
        const decodedToken = jwt.verify(
            inComingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );

        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(404, "Invalid refresh token");
        }

        if (user.refreshToken !== inComingRefreshToken) {
            throw new ApiError(400, "Refresh token is expired");
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            );

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

// forgot password

const forgotPasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const { unHashedToken, hashedToken, expiryToken } = user.generateTemporaryToken();

    // ✅ Fixed - match schema field names
    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = expiryToken;

    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user.email,
        subject: "Password reset request",
        mailgenContent: forgotPasswordMailgenContent(
            user.username,
            `${process.env.FORGOT_PASSWORD_URL}/${unHashedToken}`,
        )
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset request email sent to your email inbox"
            )
        );
});

// reset password controller

const resetPassword = asyncHandler(async (req, res) => {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    let hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    console.log("resetToken from params:", resetToken);
    console.log("hashedToken:", hashedToken);

    const user = await User.findOne({
        forgotPasswordRequestToken: hashedToken,
        forgotPasswordRequestTokenExpiry: { $gt: Date.now() }
    });

    const anyUser = await User.findOne({ email: "razasalman4355@gmail.com" });
    console.log("forgotPasswordToken in DB:", anyUser?.forgotPasswordToken);
    console.log("forgotPasswordExpiry in DB:", anyUser?.forgotPasswordExpiry);
    console.log("hashedToken we computed:", hashedToken);
    console.log("is expired?", anyUser?.forgotPasswordExpiry < Date.now());

    if (!user) {
        throw new ApiError(400, "Token is invalid or expired");
    }

    user.forgotPasswordRequestToken = undefined;
    user.forgotPasswordRequestTokenExpiry = undefined;
    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset successfully"
            )
        );
});

// change password controller

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Old password is incorrect")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed successfully"
            )
        )
});


export { registerUser, loginUser, logoutUser, getCurrentUser, verifyEmail, resendEmailVerification, refreshAccessToken, forgotPasswordRequest, resetPassword, changePassword }

