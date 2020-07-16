const User = require('../models/user');
const FriendRequest = require('../models/friendRequest');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const sendError = require('../helpers/sendError');
const { updateUserWithCondition } = require('../models/user');
const { getIo } = require('../helpers/socket');
const Notification = require('../models/notifications');
const findMutualFriends = require('../helpers/functions').findMutualFriends;

exports.patchEditUserProfile = async (req, res, next) => {
	const userId = req.userId;

	const { firstName, lastName, age, gender, bio, country } = req.body;

	const newUser = { firstName: firstName, lastName: lastName, age: age, gender: gender, country: country, bio: bio };

	await User.updateUserWithCondition({ _id: new ObjectId(userId) }, { $set: newUser });

	res.status(200).json({ message: 'user updated his profile successfully', userId: userId.toString() });
	try {
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.findPeople = async (req, res, next) => {
	let { userId } = req;
	userId = userId.toString();
	console.log('exports.findPeople -> userId', userId);

	// grap the user with its id
	// get the user.friendRequestsUsers array
	// grap all users(filter him and his friends)
	// loop through the users array, map it to {..., sent:Boolean} check if any user in the friendRequestUsers is located in the all users array, if found change the sent to true

	try {
		const user = await User.getUserAggregatedFixed(userId);

		console.log('exports.findPeople -> user', user);
		if (!user) sendError('User with given Id does not exist', 404);

		const userFriendsArr = user.friends; // Array of userIds

		// get all users but himself and his friends
		const allUsers = await User.getUsersAggregated([
			{
				$match: {
					$and: [ { _id: { $nin: userFriendsArr } }, { _id: { $not: { $eq: new ObjectId(userId) } } } ]
				}
			},
			{ $project: { password: 0, email: 0, notifications: 0, chats: 0, groups: 0 } }
		]);
		console.log('exports.findPeople -> allUsers', allUsers);

		const friendRequestsUsersArr = user.friendRequestsUsers; //Array of userIds(people who sent him a friend request)

		let people;
		if (friendRequestsUsersArr.length > 0) {
			people = allUsers.map(person => {
				for (let friendId of friendRequestsUsersArr) {
					if (friendId.toString() === person._id.toString()) {
						return { ...person, sent: true };
					} else {
						return { ...person, sent: false };
					}
				}
			});
		} else {
			console.log('what!!', false);
			people = allUsers.map(person => {
				return { ...person, sent: false };
			});
		}

		// get the mutual friends
		if (people.length > 0) {
			people = people.map(person => {
				let mutualFriends = findMutualFriends(user, person);
				// return only some fields
				return {
					_id: person._id,
					firstName: person.firstName,
					lastName: person.lastName,
					age: person.age,
					country: person.country,
					gender: person.gender,
					sent: person.sent,
					mutualFriends
				};
			});
		}

		res.status(200).json({ people: people });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.visitProfile = async (req, res, next) => {
	const { userId } = req.params;

	try {
		const user = await User.getUserAggregated([
			{ $match: { _id: new ObjectId(userId) } },
			{
				$project: {
					password: 0,
					email: 0,
					notifications: 0,
					friendRequests: 0,
					chats: 0,
					groups: 0,
					friendRequestsUsers: 0
				}
			},
			{ $lookup: { from: 'users', localField: 'friends', foreignField: '_id', as: 'userFriends' } },
			{
				$project: {
					friends: 0,
					'userFriends.password': 0,
					'userFriends.friendRequestsUsers': 0,
					'userFriends.notifications': 0,
					'userFriends.notifications': 0,
					'userFriends.friends': 0,
					'userFriends.chats': 0,
					'userFriends.groups': 0
				}
			}
		]);

		res.status(200).json({ user: user });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.getFriends = async (req, res, next) => {
	const { userId } = req;

	try {
		// get user friends

		const user = await User.getUserAggregated([
			{ $match: { _id: new ObjectId(userId) } },
			{ $project: { password: 0 } },
			{ $lookup: { from: 'users', localField: 'friends', foreignField: '_id', as: 'userFriends' } },
			{
				$project: {
					friends: 0,
					'userFriends.password': 0,
					'userFriends.email': 0,
					'userFriends.notifications': 0,
					'userFriends.friendRequestsUsers': 0,
					'userFriends.chats': 0,
					'userFriends.groups': 0
				}
			}
		]);

		let userFriends = user.userFriends; // [{}, {}]

		// each user friend has an array of his friends ids, loop through the userFriends, and execute the findMutual to each on each one

		if (userFriends.length > 0) {
			userFriends = userFriends.map(userFriend => {
				const matualFriends = findMutualFriends(user, userFriend);
				return { ...userFriend, matualFriends };
			});
		}

		res.status(200).json({ friends: userFriends });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

// we need a socket here..
exports.patchUnfriend = async (req, res, next) => {
	const { userId } = req;
	const { friendId } = req.params;

	try {
		// remove the friendID from the user`s friends arr
		await updateUserWithCondition({ _id: new ObjectId(userId) }, { $pull: { friends: new ObjectId(friendId) } });

		// remove the userId from the friends` friends Arr
		await updateUserWithCondition({ _id: new ObjectId(friendId) }, { $pull: { friends: new ObjectId(userId) } });

		// emit this to all his friends so we can remove him from all his friends clients
		getIo().emit('unFriend', { userId: userId, friendId: friendId });

		res.status(200).json({ message: `Friend removed successfully`, userId: userId, friendId: friendId });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

// we need a socket here
exports.patchSendFriendRequest = async (req, res, next) => {
	const userId = req.userId;
	const { userToAddId } = req.params;
	console.log('exports.patchSendFriendRequest -> userToAddId', userToAddId);
	console.log('exports.patchSendFriendRequest -> userId', typeof userId);

	try {
		const friendRequest = new FriendRequest(new ObjectId(userId), new ObjectId(userToAddId));

		// add the notification in the notifications collection
		const addingResult = await friendRequest.addFriendRequest();

		// get the notificationId
		const friendRequestId = addingResult.ops[0]._id;

		// add this friendRequest to the userToAdd friendRequests array
		await User.updateUserWithCondition(
			{ _id: new ObjectId(userToAddId) },
			{
				$addToSet: { friendRequests: new ObjectId(friendRequestId) }
			}
		);

		// add the userToAddId in the friendRequestsUser array to make him recogonized as (sent)
		await User.updateUserWithCondition(
			{ _id: new ObjectId(userId) },
			{ $addToSet: { friendRequestsUsers: new ObjectId(userToAddId) } }
		);

		// emit an event with the new notification to userToAddId => the frontend will only increase the numbers of notifications by 1
		getIo().emit('friendRequestNotification', { from: userId, to: userToAddId });

		res.status(200).json({
			message: 'Friend request sent successfully',
			from: userId,
			to: userToAddId,
			addingResult: addingResult
		});
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.getUserFriendRequests = async (req, res, next) => {
	const userId = req.userId;

	try {
		const user = await User.getUser(userId);
		const userFriendRequests = user.friendRequests;

		let friendRequests = [];
		if (userFriendRequests.length > 0) {
			friendRequests = await FriendRequest.getFriendRequestsAggregated([
				{ $match: { _id: { $in: userFriendRequests } } },
				{ $lookup: { from: 'users', localField: 'from', foreignField: '_id', as: 'fromUser' } },
				{
					$project: {
						from: 1,
						to: 1,
						date: 1,
						'fromUser._id': 1,
						'fromUser.firstName': 1,
						'fromUser.lastName': 1,
						'fromUser.country': 1
					}
				}
			]);
		}
		res.status(200).json({ friendRequests: friendRequests });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.deleteRejectNotification = async (req, res, next) => {
	const userId = req.userId;
	const { friendRequestId, fromId } = req.body;
	try {
		// remove the friendRequest from the friendRequest collection
		await FriendRequest.removeFriendRequest(friendRequestId);

		// remove this notification from the user.friendRequest array
		await User.removeFriendRequest(userId, friendRequestId);

		// create a notifictaion object, add it to the notifications collection

		const notification = new Notification(new ObjectId(userId), new ObjectId(fromId)); // from is the user who rejected, to is the user who sent the notification(we want to notify him)

		const addingNotificationResult = await notification.addNotification();
		const insertedNotificationId = addingNotificationResult.insertedId;

		// add the notificationId to the user.notifications array
		// got to the fromId which is the user who sent this friend request, remove userId from his friendRequestsUsers array
		await User.updateUserWithCondition(
			{ _id: new ObjectId(fromId) },
			{
				$pull: { friendRequestsUsers: new ObjectId(userId) },
				$addToSet: { notifications: new ObjectId(insertedNotificationId) }
			}
		);

		// emit a socket event with the notification id, fromId, toId
		getIo().emit('informingNotification', { from: userId, to: fromId });

		res.status(200).json({
			message: 'Friend request rejected successfully',
			friendRequestId: friendRequestId.toString(),
			fromId: fromId.toString()
		});
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.getUserNotifications = async (req, res, next) => {
	const userId = req.userId;

	try {
		// get the user, get the user.notifications users ids array
		// get all notifications whose ids are in the given id, if not found, return []

		const user = await User.getUser(userId);
		const userNotifications = user.notifications; // [id, id, ...]

		let notifications = [];

		// lookup in users to get the real data of the fromId
		if (userNotifications.length > 0) {
			notifications = await Notification.getNotificationsAggregated([
				{ $match: { _id: { $in: userNotifications } } },
				{ $lookup: { from: 'users', localField: 'from', foreignField: '_id', as: 'fromUser' } },
				{
					$project: {
						from: 1,
						to: 1,
						date: 1,
						'fromUser._id': 1,
						'fromUser.firstName': 1,
						'fromUser.lastName': 1,
						'fromUser.country': 1
					}
				}
			]);
			console.log('exports.getUserNotifications -> notifications', notifications);
		}

		res.status(200).json({ userId: userId, notifications: notifications });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};
