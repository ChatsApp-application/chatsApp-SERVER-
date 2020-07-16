const sendError = (errorMessage, errorStatusCode) => {
	const error = new Error(errorMessage);
	error.statusCode = errorStatusCode;
	throw error;
};

module.exports = sendError;
