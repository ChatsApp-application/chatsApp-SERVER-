const sendError = require('../helpers/sendError');
const jwt = require('jsonwebtoken');
const bcyrpt = require('bcryptjs');
const User = require('../models/user');
const getIo = require('../helpers/socket').getIo;

exports.postSignUp = async (req, res, next) => {
	const { firstName, lastName, age, country, email, password, gender } = req.body;

	try {
		// check if this email is taken by some user
		const foundUser = await User.getUserWithCondition({ email: email });

		if (foundUser) sendError('This email is taken, choose an alternative', 403);

		const hashedPassword = await bcyrpt.hash(password, 12);

		const user = new User(firstName, lastName, +age, country, gender, email, hashedPassword);

		// add the user to the database
		const addingResult = await user.addUser();

		const insertedUserId = addingResult.insertedId;

		res.status(201).json({ message: 'User Signed up successfully.', userId: insertedUserId });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.postSignin = async (req, res, next) => {
	const { email, password } = req.body;

	try {
		// check if we have this user in our database
		const foundUser = await User.getUserWithConditionForLogin({ email: email });

		if (!foundUser) sendError('User with given email does not exist!', 401);

		// check for the validity of the password
		const matched = await bcyrpt.compare(password, foundUser.password);

		// if not matched, send error
		if (!matched) sendError('Wrong Password', 401);

		// else... make a token, send it to the client
		const token = jwt.sign(
			{
				firstName: foundUser.firstName,
				lastName: foundUser.lastName,
				country: foundUser.country,
				email: email,
				userId: foundUser._id.toString()
			},
			`${process.env.TOKEN_SECRET}`,
			{
				expiresIn: '30d'
			}
		);

		// set online to TRUE

		await User.updateUserWithCondition({ email: email }, { $set: { online: true } });

		// emit an event to inform all users that this user is online
		getIo().emit('userOnline', { userId: foundUser._id });
		res.status(200).json({
			message: `${foundUser.firstName} ${foundUser.lastName} has logged in successfully`,
			token: token,
			userId: foundUser._id.toString()
		});
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};
