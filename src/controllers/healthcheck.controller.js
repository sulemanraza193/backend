import { ApiResponse } from "../utils/api_response.js";
import asyncHandler from "../utils/asyc_handler.js";

// const healthCheck = async (req, res, next) => {
//     try {
//         const user = await getUserFromDB()
//         res.status(200).json(new ApiResponse(200, null, "Server is running"))
//     } catch (error) {
//         next(error)

//     }
// }


const healthCheck = asyncHandler(async (req, res, next) => {
    res.status(200).json(new ApiResponse(200, { message: "Server is running 1.0" }))
})

export { healthCheck };