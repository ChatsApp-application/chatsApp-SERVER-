const jwt = require('jsonwebtoken');
// const User = require('../models/user');
// const ObjectId = require('mongodb').ObjectId;
// const getIo = require('../helpers/socket').getIo;

module.exports = socketIsAuth = userToken => {
	if (!userToken) throw new Error('User Is not Authenticated...');

	const decodedToken = jwt.decode(userToken, `${process.env.TOKEN_SECRET}`);

	if (!decodedToken) throw new Error('User is not Authenticated');

	return decodedToken.userId;
};
