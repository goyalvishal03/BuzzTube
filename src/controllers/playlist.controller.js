import mongoose from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import { Video } from "../models/video.model.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    //TODO: create playlist
    if (!name && !description) throw new ApiError(404, "Provide name or description")
    const userId = req.user?._id
    console.log(req.user);
    const playList = await Playlist.create(
        {
            name: name,
            description: description,
            owner: new mongoose.Types.ObjectId(userId)
        }
    )
    await playList.save()
    const findPlayList = await Playlist.findById(playList?._id)
    if (!findPlayList) throw new ApiError(500, "Error creating playlist")

    return res
        .status(200)
        .json(
            new ApiResponse(200, { playList }, "Playlist created")
        )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!userId) throw new ApiError(404, "User playlist not found")

    const data = await Playlist.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videos",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            userName: 1,
                                            fullName: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                owner: {
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                }
            }
        ]
    )


    if (!data) throw new ApiError(500, "No playlist found")
    return res
        .status(200)
        .json(
            new ApiResponse(200, { data }, "Playlist fetched")
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!playlistId) throw new ApiError(404, "No playlist found")

    const data = await Playlist.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(playlistId)
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videos",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            userName: 1,
                                            fullName: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                owner: {
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                }
            }
        ]
    )
    if (!data) throw new ApiError(404, "No playlist found")
    return res
        .status(200)
        .json(
            new ApiResponse(200, { data }, "Playlist fetched")
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    try {
        await Playlist.findById(playlistId)
        await Video.findById(videoId)
    } catch (error) {
        return res.status(404).json(new ApiError(404, "Playlist or video not found"))
    }

    const checkVideo = await Playlist.findOne(
        {
            videos: new mongoose.Types.ObjectId(videoId)
        }
    )

    if (checkVideo) {
        return res.status(400).json(new ApiResponse(400, {}, "Video already in playlist"))
    }

    const addVideo = await Playlist.findByIdAndUpdate(playlistId,
        {
            $push: { videos: videoId }
        }, { new: true })
    console.log(addVideo);
    if (!addVideo) throw new ApiError(500, "Error adding video to playlist")
    return res
        .status(200)
        .json(
            new ApiResponse(200, { addVideo }, "Video Added Successfully")
        )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    try {
        await Playlist.findById(playlistId)
        await Video.findById(videoId)
    } catch (error) {
        throw new ApiError(404, "Playlist or video not found")
    }
    const removeVideoStatus = await Playlist.updateOne(
        {
            _id: new mongoose.Types.ObjectId(playlistId)
        },
        {
            $pull: {
                videos: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            new: true
        }
    )
    if (!removeVideoStatus) throw new ApiError(500, "Error removing video")
    return res
        .status(200)
        .json(
            new ApiResponse(200, { removeVideoStatus }, "Video removed from playlist")
        )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    try {
        await Playlist.findById(playlistId)
    } catch (error) {
        throw new ApiError(404, "No playlist found")
    }
    const deletePlayList = await Playlist.findByIdAndDelete(playlistId)
    if (!deletePlayList) throw new ApiError(500, "Error deleting playlist")
    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Playlist deleted")
        )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    try {
        await Playlist.findById(playlistId)
    } catch (error) {
        throw new ApiError(404, "No playlist found")
    }
    const updatePlaylistStatus = await Playlist.findByIdAndUpdate(playlistId, {
        $set: {
            name: name,
            description: description
        }
    },
        {
            new: true
        }
    )
    if (!updatePlaylistStatus) throw new ApiError(500, "Error updating playlist")
    return res
        .status(200)
        .json(
            new ApiResponse(200, { updatePlaylistStatus }, "Playlist updated")
        )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}