import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded
    // console.log("file is uploaded", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);

    return null;
  }
};

const removeFileFromCloudinary = async (cloudinaryPath) => {
  if (!cloudinaryPath) return null;
  const public_idWithExtension = cloudinaryPath.substring(
    cloudinaryPath.lastIndexOf("/") + 1
  );
  const public_id = public_idWithExtension.split(".").slice(0, -1).join(".");
  await cloudinary.uploader.destroy(public_id);
  return 1;
};
// cloudinary.uploader.upload(
//   "https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" },
//   function (error, result) {
//     console.log(result);
//   }
// );

export { uploadOnCloudinary, removeFileFromCloudinary };
