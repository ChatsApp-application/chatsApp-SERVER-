const multer = require('multer');
const path = require('path');
const rootDir = path.dirname(process.mainModule.filename);
const { v4: uuidv4 } = require('uuid');

const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, `${rootDir}/images`);
	},
	filename: (req, file, cb) => {
		cb(null, `${uuidv4()}-${file.originalname}`);
	}
});

const fileFilter = (req, file, cb) => {
	console.log('fileFilter -> file', file);
	console.log('does i make sense ?');
	if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
		cb(null, true);
	} else {
		cb('File type is not supported.', false);
	}
};

module.exports = multer({ storage: fileStorage, fileFilter: fileFilter });
