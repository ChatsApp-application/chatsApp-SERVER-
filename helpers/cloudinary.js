var cloudinary = require('cloudinary').v2;

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_KEY,
	api_secret: process.env.CLOUDINARY_SECRET
});

const cloudinaryUpload = (file, folder) => {
	return new Promise(resolve => {
		cloudinary.uploader.upload(
			file,
			result => {
				resolve({ url: result.url, id: result.public_id });
			},
			{
				resource_type: 'auto',
				folder: folder
			}
		);
	});
};

module.exports = cloudinaryUpload;
