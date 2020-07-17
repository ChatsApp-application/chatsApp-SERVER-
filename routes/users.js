const express = require('express');
const { body } = require('express-validator');
const usersControllers = require('../controllers/users');
const isAuth = require('../middlewares/isAuth');
const checkValidation = require('../middlewares/checkValidation');
const router = express.Router();

// GET @ /users/userAfterLogin
router.get('/userAFterLogin', isAuth, usersControllers.getUserAfterLogin);

// PATCH @ /users/editUserProfile
router.patch(
	'/editUserProfile',
	[
		body('firstName', 'FirstName must not be empty and in characters').trim().notEmpty().isAlpha(),
		body('lastName', 'LastName must not be empty and in characters').trim().notEmpty().isAlpha(),
		body('email', 'Email is not a valid email').trim().isEmail(),
		body('country', 'Country must not be empty, only in characters').trim().isAlpha(),
		body('age', 'Age must be in numbers').trim().isNumeric(),
		body('gender', 'Gender must not be empty').trim().notEmpty(),
		body('password', 'Password must be 6 characters at least').trim().isLength({ min: 6 }),
		body('bio', 'Your bio can not excced 20 characters').trim().isLength({ max: 20 })
	],
	checkValidation,
	isAuth,
	usersControllers.patchEditUserProfile
);

// GET @ / users/findPeople
router.get('/findPeople', isAuth, usersControllers.findPeople);

// GET @ / users/userFriends
router.get('/userFriends', isAuth, usersControllers.getFriends);

// GET @ / users/visitProfile/userId
router.get('/visitProfile/:userId', isAuth, usersControllers.visitProfile);

// GET @ /users/unfriend/:friendId
router.patch('/unFriend/:friendId', isAuth, usersControllers.patchUnfriend);

// GET @ /users/sendFriendRequest/:userToAddId
router.patch('/sendFriendRequest/:userToAddId', isAuth, usersControllers.patchSendFriendRequest);

// GET @ /users/friendRequests
router.get('/friendRequests', isAuth, usersControllers.getUserFriendRequests);

// DELETE @/users/rejectfriendRequest
router.delete('/rejectfriendRequest', isAuth, usersControllers.deleteRejectFriendRequest);

// GET @ /users/userNotifications
router.get('/userNotifications', isAuth, usersControllers.getUserNotifications);

// PATCH @ /users/acceptFriendRequest
router.patch('/acceptFriendRequest', isAuth, usersControllers.patchAcceptFriendRequest);

//  DELETE @ /users/removeNotification/:notificationId
router.delete('/removeNotification/:notificationId', isAuth, usersControllers.deleteRemoveNotification);

module.exports = router;
