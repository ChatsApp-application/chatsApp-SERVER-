const jwt = require('jsonwebtoken');

const sendError = require('../helpers/sendError');
const isAuth = (req, res, next) => {
	try {
		const authHeader = req.get('Authorization');
		console.log('isAuth -> authHeader', authHeader);
		if (!authHeader) sendError('User is not authenticated', 401);

		// expext the token in the Authorization header with this name Barear-tokenHash
		const token = authHeader.split(' ')[1];
		if (!token) sendError('No Token was given, user is not authenticated', 401);

		const decodedToken = jwt.decode(token, `${process.env.TOKEN_SECRET}`);
		if (!decodedToken) sendError('Token is fake, user is not authenticated', 401);

		// make the userId live to the next middleware
		req.userId = decodedToken.userId;
		console.log('isAuth -> decodedToken.userId', decodedToken.userId);
		next();
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		// throw the error as it is not an async code
		throw error;
	}
};

module.exports = isAuth;
