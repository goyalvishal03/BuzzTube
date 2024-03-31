import connectDB from "../db/index.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    try {
        await connectDB()
        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "Everything working fine")
            )
    } catch (error) {
        return res
            .status(500)
            .json(
                new ApiError(500, {}, "Error connecting to the database")
            )
    }
})

export {
    healthcheck
    }
    