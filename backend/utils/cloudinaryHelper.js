let cloudinaryPackage = null;

try {
  cloudinaryPackage = require('cloudinary');
} catch (error) {
  cloudinaryPackage = null;
}

const cloudinary = cloudinaryPackage?.v2 || null;

const hasCloudinaryConfig = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

if (cloudinary && hasCloudinaryConfig()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const uploadBufferToCloudinary = (buffer, options = {}) => {
  if (!buffer) {
    throw new Error('No file buffer provided for Cloudinary upload');
  }

  if (!cloudinary) {
    throw new Error(
      'Cloudinary SDK is not installed. Run `npm install` in backend to add the `cloudinary` package.'
    );
  }

  if (!hasCloudinaryConfig()) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env.'
    );
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'vijomedix/hospital-logos',
        resource_type: options.resourceType || 'image',
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

module.exports = {
  uploadBufferToCloudinary,
  hasCloudinaryConfig,
};
