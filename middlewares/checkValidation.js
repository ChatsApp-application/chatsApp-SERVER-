const { validationResult } = require('express-validator');
const sendError = require('../helpers/sendError');

const checkValidation = (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		const errorMessage = errors.array()[0].msg;

		return sendError(errorMessage, 422);
	}

	next();
};

module.exports = checkValidation;
