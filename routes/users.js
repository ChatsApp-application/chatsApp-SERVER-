const express = require('express');
const { body } = require('express-validator');
const usersControllers = require('../controllers/users');
const isAuth = require('../middlewares/isAuth');
const checkValidation = require('../middlewares/checkValidation');
const router = express.Router();
const multerUpload = require('../middlewares/multerUpload');
// GET @ /users/userAfterLogin
router.get('/userAFterLogin', isAuth, usersControllers.getUserAfterLogin);

// PATCH @ /users/editUserProfile
router.patch(
	'/editUserProfile',
	[
		body('firstName', 'FirstName must not be empty and in characters').trim().notEmpty().isAlpha(),
		body('lastName', 'LastName must not be empty and in characters').trim().notEmpty().isAlpha(),
		body('country', 'Country must not be empty, only in characters').trim().isAlpha(),
		body('age', 'Age must be in numbers').trim().isNumeric(),
		body('gender', 'Gender must not be empty').trim().notEmpty(),
		body('bio', 'Your bio can not exceed 50 characters').trim().isLength({ max: 50 })
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

// // GET @ /users/friendRequests
// router.get('/friendRequests', isAuth, usersControllers.getUserFriendRequests);

// DELETE @/users/rejectfriendRequest
router.delete('/rejectfriendRequest', isAuth, usersControllers.deleteRejectFriendRequest);

// // GET @ /users/userNotifications
// router.get('/userNotifications', isAuth, usersControllers.getUserNotifications);

// PATCH @ /users/acceptFriendRequest
router.patch('/acceptFriendRequest', isAuth, usersControllers.patchAcceptFriendRequest);

//  DELETE @ /users/removeNotification/:notificationId
router.delete('/removeNotification/:notificationId', isAuth, usersControllers.deleteRemoveNotification);

// POST @ /users/uploadPP
router.post('/uploadPP', isAuth, multerUpload.single('image'), usersControllers.uploadPP);

// PATCH @ /users/editPP/:publicId
router.patch('/editPP/:publicId', isAuth, multerUpload.single('image'), usersControllers.editPP);

module.exports = router;
