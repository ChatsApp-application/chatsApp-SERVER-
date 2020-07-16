const getIo = require('../helpers/socket').getIo;
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const User = require('../models/user');

exports.userOfline = async userId => {
	console.log(userId, 'make him ofline');
	try {
		await User.updateUserWithCondition({ _id: new ObjectId(userId) }, { $set: { online: false } });
		getIo().emit('userIsOfline', { userId: userId, error: null });
	} catch (error) {
		getIo().emit('userIsOfline', { userId: userId, error: error.message });
	}
};
