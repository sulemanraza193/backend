import { body } from "express-validator";

const userRegisterValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),

        body("username")
            .trim()
            .notEmpty()
            .withMessage("Username is required")
            .isLowercase()
            .withMessage("Username must be in lowercase")
            .isLength({ min: 3 })
            .withMessage("Username must be at least 3 characters"),

        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password is required")
            .isLength({ min: 6 })
            .withMessage("Password must be at least 6 characters long"),

        body("fullName")   // fixed
            .optional()
            .trim(),
    ];
};

const userLoginValidator = () => {
    return [
        body("email")
            .isEmail()
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is Invalid"),
        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password is required")
    ];
};

const userChangeCurrentPasswordValidator = () => {
    return [
        body("currentPassword").trim().notEmpty().withMessage("Current password is required"),
        body("newPassword").trim().notEmpty().withMessage("New password is required").isLength({ min: 6 }).withMessage("New password must be at least 6 characters long")
    ]
}

const UserForgotPasswordValidator = () => {
    return [
        body("email")
            .isEmail()
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is Invalid")
    ]
}

const UserResetForgotPasswordValidator = () => {
    return [
        body("newPassword").trim().notEmpty().withMessage("New password is required").isLength({ min: 6 }).withMessage("New password must be at least 6 characters long")
    ]

}

export { userRegisterValidator, userLoginValidator, userChangeCurrentPasswordValidator, UserForgotPasswordValidator, UserResetForgotPasswordValidator };