import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  const currentUserId = req.user._id;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "invalid channel id");
  }

  const subscription = await Subscription.findOne({
    subscriber: currentUserId,
    channel: channelId,
  });

  if (subscription) {
    //user is subscribed , unscrie then.
    await subscription.deleteOne();
    res.join(new ApiResponse(true, "unsubscribed succesfully"));
  } else {
    //user is not subscribed , create a new subscription
    await Subscription.create({
      subscriber: currentUserId,
      channel: channelId,
    });
    res.json(new ApiResponse(true, "subdcribed succesfully"));
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "invalid channel id");
  }

  const subscribers = await Subscription.find({ channel: channelId })
    .select("subscriber")
    .populate({
      path: "subscriber",
      select: "username fullName avatar",
    });

  res.json(new ApiResponse(true, subscribers));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber id");
  }

  const subscriptions = await Subscription.find({ subscriber: subscriberId })
    .select("channel")
    .populate({
      path: "channel",
      select: "username fullName avatar",
    });

  res.json(new ApiResponse(true, subscriptions));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
