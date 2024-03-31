import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { tweetData } = req.body;
  const userId = req.user?._id;
  if (!tweetData) throw new ApiError(404, " please provide data");

  const createTweet = await Tweet.create({
    owner: userId,
    content: tweetData,
  });

  const data = await createTweet.save();
  if (!data) throw new ApiError(500, " error saving tweet");
  return res
    .status(200)
    .json(new ApiResponse(200, data, "tweet posted successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const userId = req.user?._id

    const data = await Tweet.aggregate(
        [
            {
                $match: {
                    owner: userId
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "userTweets"
                }
            },
            {
                $project: {
                    "_id": 0,
                    "content": 1,
                    "userTweets.userName": 1
                }
            }
        ]
    )
    console.log(data);
    if (!data) throw new ApiError(500, "Error fetching your tweets")

    return res
        .status(200)
        .json(
            new ApiResponse(200, { data }, "Tweets fetched successfully")
        )
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params
  if (!tweetId) throw new ApiError(404, "Tweet not found or deleted")

  const { tweetContent } = req.body
  if (!tweetContent) throw new ApiError(404, "Provide new tweet data")

  const updateTweet = await Tweet.findByIdAndUpdate(tweetId, {
      $set: {
          content: tweetContent
      }
  }, { new: true })
  if (!updateTweet) throw new ApiError(500, "Error updating your tweet try after sometime")

  return res
      .status(200)
      .json(
          new ApiResponse(200, updateTweet, "Tweet updated successfully")
      )
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params
    if (!tweetId) throw new ApiError(404, "No tweet found")

    const tweetStatus = await Tweet.findByIdAndDelete(tweetId)
    if (!tweetStatus) throw new ApiError(500, "Error deleting your tweet")

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Tweet deleted")
        )

});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
