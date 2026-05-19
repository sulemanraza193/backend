import { validationResult } from "express-validator";
import { ApiError } from "../utils/api_error.js";

export const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }

    const extractErrors = errors.array().map(err => ({
        [err.path]: err.msg
    }));

    throw new ApiError(422, "Received data is invalid", extractErrors);
};