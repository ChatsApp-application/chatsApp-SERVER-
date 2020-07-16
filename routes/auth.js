const express = require('express');
const { body } = require('express-validator');
const mongodb = require('mongodb');
const authControllers = require('../controllers/auth');
const checkValidation = require('../middlewares/checkValidation');
const ObjectId = mongodb.ObjectId;

const router = express.Router();
// POST @ /sinup
router.post(
	'/signup',
	[
		body('firstName', 'FirstName must not be empty and in characters').trim().notEmpty().isAlpha(),
		body('lastName', 'LastName must not be empty and in characters').trim().notEmpty().isAlpha(),
		body('email', 'Email is not a valid email').trim().isEmail(),
		body('country', 'Country must not be empty, only in characters').trim().isAlpha(),
		body('age', 'Age must be in numbers').trim().isNumeric(),
		body('gender', 'Gender must not be empty').trim().notEmpty(),
		body('password', 'Password must be 6 characters at least').trim().isLength({ min: 6 })
	],
	checkValidation,
	authControllers.postSignUp
);

// POST @ /auth/signin
router.post(
	'/signin',
	[
		body('email', 'Email must be a valid email').isEmail(),
		body('password', 'Please write down your password').notEmpty()
	],
	checkValidation,
	authControllers.postSignin
);

module.exports = router;
