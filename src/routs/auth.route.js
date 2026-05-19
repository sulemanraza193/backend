import { Router } from "express";
import { registerUser, loginUser, logoutUser, verifyEmail, refreshAccessToken, resetPassword, forgotPasswordRequest, getCurrentUser, changePassword, resendEmailVerification } from "../controllers/auth.controller.js";
import {
    userRegisterValidator,
    userLoginValidator,
    UserForgotPasswordValidator,
    userChangeCurrentPasswordValidator
} from "../validators/index.js";
import { validate } from "../middlerware/validator.js";
import { verifyJWT } from "../middlerware/auth.middleware.js";

const router = Router();

// unsecure routes
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, loginUser);
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(UserForgotPasswordValidator(), validate, forgotPasswordRequest);
router.route("/reset-password/:resetToken").post(resetPassword);


// protected or secure route
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/change-password").post(
    verifyJWT,
    userChangeCurrentPasswordValidator(),
    validate,
    changePassword
);
router.route("/resend-verification-email").post(verifyJWT, resendEmailVerification);


export default router;

