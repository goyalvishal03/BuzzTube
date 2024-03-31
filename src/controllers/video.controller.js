import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  removeFileFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import fs from "fs";

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body
  const videoFile = req.files?.videoFile[0]?.path
  if (!videoFile) throw new ApiError(400, "Please Select Video File")
  const thumbNail = req.files?.thumbNail[0]?.path
  if (!thumbNail) throw new ApiError(400, "Please select thumbnail for your video")

  // Video upload and Duration
  const uploadVideoToCloudinary = await uploadFileCloudinary(videoFile)

  if (!uploadFileCloudinary) throw new ApiError(500, "Not able to upload your video please try again after some time")

  // uploadVideoToCloudinary.url------
  const videoDuration = uploadVideoToCloudinary.duration
  const totalMinutes = Math.floor(videoDuration / 60)
  const remainingSecs = Math.round(videoDuration % 60)
  const durationString = `${totalMinutes}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`
  const [minutes, seconds] = durationString.split(":")
  const duration = parseInt(minutes) * 60 + parseInt(seconds)
  // convert this duration into minutes and secs or hours if needed

  // upload thumbnail
  const thumbNailUploadUrl = await uploadFileCloudinary(thumbNail)
  if (!thumbNailUploadUrl) throw new ApiError(500, "Not able to upload thumbnail please try after sometime")
  const owner = req.user?._id;
  const video = await Video.create(
      {
          videoFile: uploadVideoToCloudinary.url,
          thumbNail: thumbNailUploadUrl.url,
          owner,
          title,
          description,
          duration,
      }
  )
  const videoFileData = await Video.findOne(video._id).select("-isPublished")

  if (!videoFileData) throw new ApiError(500, "Error uploading your video try after some time")

  // Remove Temp file 
  fs.unlinkSync(videoFile)
  fs.unlinkSync(thumbNail)

  return res
      .status(200)
      .json(
          new ApiResponse(200, videoFileData, "Your video is uploaded successfully")
      )
})

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
  try {
      await User.findById(new mongoose.Types.ObjectId(userId))
      const sortMethod = sortType === 'desc' ? -1 : 1
      let pipeline = []
      if (query) {
          pipeline.push({
              $match: {
                  $or: [
                      {
                          title: {
                              $regex: query,
                              $options: "i",
                          },
                      },
                      {
                          description: {
                              $regex: query,
                              $options: "i",
                          },
                      },
                  ],
              },
          })
      }
      pipeline.push({
          $match: {
              isPublished: true
          }
      })
      pipeline.push({
          $skip: (page - 1) * parseInt(limit)
      })
      pipeline.push({
          $limit: parseInt(limit)
      })
      if (sortBy) {
          pipeline.push({
              $sort: {
                  [sortBy]: sortMethod
              }
          })
      }
      console.log(pipeline);
      const data = await Video.aggregate(pipeline)
      console.log(data);
      return res
          .status(200)
          .json(
              new ApiResponse(200, { data }, "Videos Fetched")
          )
  } catch (error) {
      return res
          .status(error.statusCode || 500)
          .json(
              new ApiResponse(error.statusCode || 500, null, error.message || "Error fetching videos try after sometime")
          )
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  // to check if video exists
  //if exists return the video object

  if (!videoId) {
    throw new ApiError(404, "video not found");
  }

  const video = await Video.findById({ _id: videoId });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video data fetched succesfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const { title, description } = req.body;
  if (!title || !description)
    throw new ApiError(404, "Title or Description required");
  if (!videoId) throw new ApiError(404, "No video found try again");
  const newThumbNail = req.file?.path;
  if (!newThumbNail) throw new ApiError(404, "No image found to upload");

  const newThumbNailUpload = await uploadFileCloudinary(newThumbNail);
  const video = await Video.findByIdAndUpdate(videoId, {
    $set: {
      thumbNail: newThumbNailUpload?.url,
      title: title,
      description: description,
    },
  });
  await removeFileFromCloudinary(video?.thumbNail);
  fs.unlinkSync(newThumbNail);
  return res.status(200).json(new ApiResponse(200, {}, "Thumbnail updated"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!videoId) {
    throw new ApiError(404, "no video found");
  }

  const video = await Video.findByIdAndDelete({ _id: videoId });
  if (!video) throw new ApiError(500, "error in deleting video");
  return res
    .status(200)
    .json(new ApiResponse(200, video, "video data fetched successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(404, "No video found")

  try {
    const video = await Video.findById(videoId)
    video.isPublished = !video.isPublished
    await video.save()
    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Video status changed")
        )
} catch (error) {
    throw new ApiError(500, "Error while changing video status try after some time")
}

});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
