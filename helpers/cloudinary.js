const { options } = require('../routes/auth');

var cloudinary = require('cloudinary').v2;

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_KEY,
	api_secret: process.env.CLOUDINARY_SECRET
});

const cloudinaryUploader = (file, folder) => {
	return new Promise((resolve, reject) => {
		cloudinary.uploader.upload(file, { folder: folder, type: 'upload' }, (err, result) => {
			console.log('cloudinaryUploader -> err', err);
			if (err) reject('File have not been uploaded.');
			resolve(result);
		});
	});
};

const cloudinaryRemoval = publikId => {
	return new Promise((resolve, reject) => {
		cloudinary.uploader.destroy(`chatsApp/${publikId}`, {}, (err, result) => {
			console.log('err', err);
			if (err) reject('File did not removed from the cloud');
			resolve('file have been removed');
		});
	});
};
module.exports = { cloudinaryUploader: cloudinaryUploader, cloudinaryRemoval: cloudinaryRemoval };
