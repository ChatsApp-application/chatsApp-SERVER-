const jwt = require('jsonwebtoken');
// const User = require('../models/user');
// const ObjectId = require('mongodb').ObjectId;
// const getIo = require('../helpers/socket').getIo;

module.exports = socketIsAuth = userToken => {
	const errorMessage = 'User is not authenticated...';
	if (!userToken) throw new Error(errorMessage);

	const decodedToken = jwt.decode(userToken, `${process.env.TOKEN_SECRET}`);

	if (!decodedToken) throw new Error(errorMessage);

	return decodedToken.userId;
};
