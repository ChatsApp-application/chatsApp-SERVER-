const fs = require('fs');
const User = require('../models/user');
const FriendRequest = require('../models/friendRequest');
const Notification = require('../models/notifications');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const sendError = require('../helpers/sendError');
const { getIo } = require('../helpers/socket');
const ChatRoom = require('../models/chatRoom');
const checkRelation = require('../helpers/functions').checkRelation;
const findMutualFriends = require('../helpers/functions').findMutualFriends;
const fRequestIsSent = require('../helpers/functions').fRequestIsSent;
const cloudinaryUploader = require('../helpers/cloudinary').cloudinaryUploader;
const cloudinaryRemoval = require('../helpers/cloudinary').cloudinaryRemoval;

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

exports.getUserAfterLogin = async (req, res, next) => {
	const userId = req.userId;
	console.log('exports.getUserAfterLogin -> userId', userId);
	console.log('working');

	try {
		let user;
		const foundUser = await User.getUserAggregated([
			{ $match: { _id: new ObjectId(userId) } },

			{
				$project: {
					firstName: 1,
					lastName: 1,
					age: 1,
					friendRequests: 1,
					notifications: 1,
					gender: 1,
					online: 1,
					bio: 1,
					country: 1,
					img: 1
				}
			}
		]);
		console.log('exports.getUserAfterLogin -> foundUser', foundUser);

		if (!foundUser) sendError('User with given id does not found', 403);
		if (foundUser.notifications.length > 0 && foundUser.friendRequests.length > 0) {
			user = await User.getUserAggregated([
				{ $match: { _id: new ObjectId(userId) } },

				{
					$project: {
						firstName: 1,
						lastName: 1,
						age: 1,
						friendRequests: 1,
						notifications: 1,
						gender: 1,
						online: 1,
						bio: 1,
						country: 1,
						img: 1
					}
				},

				{ $unwind: '$notifications' },
				{
					$lookup: {
						from: 'users',
						foreignField: '_id',
						localField: 'notifications.from',
						as: 'notifications.fromUser'
					}
				},
				{ $unwind: '$notifications.fromUser' },
				// project
				{
					$project: {
						'notifications.fromUser.password': 0,
						'notifications.fromUser.friendRequestsUsers': 0,
						'notifications.fromUser.friendRequests': 0,
						'notifications.fromUser.notifications': 0,
						'notifications.fromUser.friends': 0,
						'notifications.fromUser.chats': 0,
						'notifications.fromUser.groups': 0
					}
				},
				{
					$group: {
						_id: '$_id',
						root: { $mergeObjects: '$$ROOT' },
						notifications: { $push: '$notifications' }
					}
				},
				{
					$replaceRoot: {
						newRoot: {
							$mergeObjects: [ '$root', '$$ROOT' ]
						}
					}
				},
				{
					$project: {
						root: 0
					}
				},
				// friendRequests

				{ $unwind: '$friendRequests' },
				{
					$lookup: {
						from: 'users',
						foreignField: '_id',
						localField: 'friendRequests.from',
						as: 'friendRequests.fromUser'
					}
				},
				{ $unwind: '$friendRequests.fromUser' },
				// project
				{
					$project: {
						'friendRequests.fromUser.password': 0,
						'friendRequests.fromUser.friendRequestsUsers': 0,
						'friendRequests.fromUser.friendRequests': 0,
						'friendRequests.fromUser.notifications': 0,
						'friendRequests.fromUser.friends': 0,
						'friendRequests.fromUser.chats': 0,
						'friendRequests.fromUser.groups': 0
					}
				},
				{
					$group: {
						_id: '$_id',
						root: { $mergeObjects: '$$ROOT' },
						friendRequests: { $push: '$friendRequests' }
					}
				},
				{
					$replaceRoot: {
						newRoot: {
							$mergeObjects: [ '$root', '$$ROOT' ]
						}
					}
				},
				{
					$project: {
						root: 0
					}
				}
			]);
		} else if (foundUser.notifications.length > 0) {
			user = await User.getUserAggregated([
				{ $match: { _id: new ObjectId(userId) } },

				{
					$project: {
						firstName: 1,
						lastName: 1,
						age: 1,
						friendRequests: 1,
						notifications: 1,
						gender: 1,
						online: 1,
						bio: 1,
						country: 1,
						img: 1
					}
				},

				{ $unwind: '$notifications' },
				{
					$lookup: {
						from: 'users',
						foreignField: '_id',
						localField: 'notifications.from',
						as: 'notifications.fromUser'
					}
				},
				{ $unwind: '$notifications.fromUser' },
				// project
				{
					$project: {
						'notifications.fromUser.password': 0,
						'notifications.fromUser.friendRequestsUsers': 0,
						'notifications.fromUser.friendRequests': 0,
						'notifications.fromUser.notifications': 0,
						'notifications.fromUser.friends': 0,
						'notifications.fromUser.chats': 0,
						'notifications.fromUser.groups': 0
					}
				},
				{
					$group: {
						_id: '$_id',
						root: { $mergeObjects: '$$ROOT' },
						notifications: { $push: '$notifications' }
					}
				},
				{
					$replaceRoot: {
						newRoot: {
							$mergeObjects: [ '$root', '$$ROOT' ]
						}
					}
				},
				{
					$project: {
						root: 0
					}
				}
			]);
		} else if (foundUser.friendRequests.length > 0) {
			user = await User.getUserAggregated([
				{ $match: { _id: new ObjectId(userId) } },

				{
					$project: {
						firstName: 1,
						lastName: 1,
						age: 1,
						friendRequests: 1,
						notifications: 1,
						gender: 1,
						online: 1,
						bio: 1,
						country: 1,
						img: 1
					}
				},
				{ $unwind: '$friendRequests' },
				{
					$lookup: {
						from: 'users',
						foreignField: '_id',
						localField: 'friendRequests.from',
						as: 'friendRequests.fromUser'
					}
				},
				{ $unwind: '$friendRequests.fromUser' },
				// project
				{
					$project: {
						'friendRequests.fromUser.password': 0,
						'friendRequests.fromUser.friendRequestsUsers': 0,
						'friendRequests.fromUser.friendRequests': 0,
						'friendRequests.fromUser.notifications': 0,
						'friendRequests.fromUser.friends': 0,
						'friendRequests.fromUser.chats': 0,
						'friendRequests.fromUser.groups': 0
					}
				},
				{
					$group: {
						_id: '$_id',
						root: { $mergeObjects: '$$ROOT' },
						friendRequests: { $push: '$friendRequests' }
					}
				},
				{
					$replaceRoot: {
						newRoot: {
							$mergeObjects: [ '$root', '$$ROOT' ]
						}
					}
				},
				{
					$project: {
						root: 0
					}
				}
			]);
		} else {
			user = foundUser;
		}

		user.friendRequests.sort((a, b) => b.date - a.date);
		user.notifications.sort((a, b) => b.data - a.data);

		res.status(200).json({ message: 'User fetched successfully', user: user });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.findPeople = async (req, res, next) => {
	let { userId } = req;
	userId = userId.toString();

	// grap the user with its id
	// get the user.friendRequestsUsers array
	// grap all users(filter him and his friends)
	// loop through the users array, map it to {..., sent:Boolean} check if any user in the friendRequestUsers is located in the all users array, if found change the sent to true

	try {
		const user = await User.getUserAggregatedFixed(userId);

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

		const friendRequestsUsersArr = user.friendRequestsUsers; //Array of userIds(people who sent him a friend request)

		let people = fRequestIsSent(friendRequestsUsersArr, allUsers);

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
					img: person.img,
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

// socket handled (editing is required for user X has viewd your profile feature)
exports.visitProfile = async (req, res, next) => {
	const whoWatchedId = req.userId; // the user who watched
	const { userId } = req.params; // the user to get his data

	try {
		// the user who we are on his profile
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
					'userFriends.groups': 0,
					'userFriends.friendRequests': 0
				}
			}
		]);

		const userWhoWatched = await User.getUser(whoWatchedId);

		const relation = checkRelation(userWhoWatched, user);
		user.relation = relation;
		console.log('exports.visitProfile -> relation', relation);

		// make a notification and send it to user (the user we are watching him) to inform him that somebody saw his profile but make sure to prevent this if the relation === isOwner

		if (relation !== 'isOwner' && !user.profileViewers.includes(userWhoWatched.toString())) {
			const notification = new Notification(
				new ObjectId(whoWatchedId),
				new ObjectId(userId),
				'Viewed your profile.'
			);

			await User.updateUserWithCondition(
				{ _id: new ObjectId(userId) },
				{ $addToSet: { notifications: notification } }
			);

			// add the user who watched in the user.profileViewrs which will get cleaned every 24h
			await User.updateUserWithCondition(
				{ _id: new ObjectId(userId) },
				{ $addToSet: { profileViewers: userWhoWatched.toString() } }
			);

			getIo().emit('informingNotification', {
				notification: {
					_id: notification._id,
					from: userWhoWatched._id,
					fromUser: {
						_id: userWhoWatched._id,
						firstName: userWhoWatched.firstName,
						lastName: userWhoWatched.lastName,
						img: userWhoWatched.img
					},
					data: notification.data, //date (typo)
					message: notification.message
				},
				to: userId
			});
		}
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
					'userFriends.friendRequests': 0,
					'userFriends.friendRequestsUsers': 0,
					'userFriends.chats': 0,
					'userFriends.groups': 0
				}
			}
		]);
		console.log('exports.getFriends -> user', user);

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

		await User.updateUserWithCondition(
			{ _id: new ObjectId(userId) },
			{ $pull: { friends: new ObjectId(friendId) } }
		);

		// remove the userId from the friends` friends Arr
		await User.updateUserWithCondition(
			{ _id: new ObjectId(friendId) },
			{ $pull: { friends: new ObjectId(userId) } }
		);

		const sharedRoom = await ChatRoom.getSharedChatRoom(userId, friendId);

		const sharedRoomId = new ObjectId(sharedRoom._id);

		await ChatRoom.deleteChatRoom(userId, friendId);

		// remove the chat from both users.chats

		await User.updateUserWithCondition(
			{ _id: new ObjectId(userId) },
			{
				$pull: { chats: sharedRoomId }
			}
		);

		await User.updateUserWithCondition({ _id: new ObjectId(friendId) }, { $pull: { chats: sharedRoomId } });

		// emit this to all his friends so we can remove him from all his friends clients
		getIo().emit('unFriend', { userId: userId, friendId: friendId });

		res.status(200).json({ message: `Friend removed successfully`, userId: userId, friendId: friendId });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

// socket handled
exports.patchSendFriendRequest = async (req, res, next) => {
	const userId = req.userId;
	const { userToAddId } = req.params;
	console.log('exports.patchSendFriendRequest -> userToAddId', userToAddId);
	console.log('exports.patchSendFriendRequest -> userId', typeof userId);

	try {
		// check if userId is included in userToAddId.friendRequestsUsers
		// if true, then this friend you are trying to send him a friend has already sent u one
		// make him a frien and emit a socket event

		const userToAdd = await User.getUser(userToAddId);
		const user = await User.getUser(userId);

		const friendRequestsUsers = userToAdd.friendRequestsUsers;

		if (friendRequestsUsers.length > 0) {
			let foundUser = friendRequestsUsers.find(id => id.toString() === userId.toString());

			if (foundUser) {
				// userToAdd sent him first, make them friends

				const hisFriendRequest = user.friendRequests.find(
					fReq => fReq.from.toString() === userToAddId.toString()
				);
				console.log('exports.patchSendFriendRequest -> hisFriendRequest', hisFriendRequest);

				// create a chatRoom between these two users
				// add the chatRoomId to both userId and fromId
				const chatRoom = new ChatRoom(new ObjectId(userToAddId), new ObjectId(userId));
				const addedRoom = await chatRoom.addChatRoom();
				const insertedRoomId = addedRoom.insertedId;

				const notificationForAddTo = new Notification(
					new ObjectId(userId),
					new ObjectId(userToAddId),
					'and you are now friends.'
				);

				const notificationForUser = new Notification(
					new ObjectId(userToAddId),
					new ObjectId(userId),
					'and you are now friends.'
				);

				// remove the friendRequest from the user.friendRequests array
				// add the fromId to the user.friends array
				const userFilter = { _id: new ObjectId(userId) };
				const toAddFilter = { _id: new ObjectId(userToAddId) };

				await Promise.all([
					User.updateUserWithCondition(userFilter, { $addToSet: { chats: new ObjectId(insertedRoomId) } }),
					User.updateUserWithCondition(userFilter, {
						$pull: { friendRequests: { _id: { $eq: hisFriendRequest._id } } }
					}),
					User.updateUserWithCondition(userFilter, {
						$addToSet: {
							friends: new ObjectId(userToAddId)
						}
					}),
					User.updateUserWithCondition(userFilter, { $addToSet: { notifications: notificationForUser } }),
					User.updateUserWithCondition(toAddFilter, { $addToSet: { chats: new ObjectId(insertedRoomId) } }),
					User.updateUserWithCondition(toAddFilter, { $addToSet: { friends: new ObjectId(userId) } }),
					User.updateUserWithCondition(toAddFilter, { $addToSet: { notifications: notificationForAddTo } }),
					User.updateUserWithCondition(toAddFilter, { $pull: { friendRequestsUsers: new ObjectId(userId) } })
				]);

				// emit a socket event ('informingNotificationForBoth')
				getIo().emit('informingNotificationForBoth', {
					notificationForUser: {
						_id: notificationForUser._id,
						from: user._id.toString(),
						fromUser: {
							_id: user._id.toString(),
							firstName: user.firstName,
							lastName: user.lastName,
							img: user.img
						},
						data: notificationForUser.data, //date
						message: notificationForUser.message
					},

					notificationForAddTo: {
						_id: notificationForAddTo._id,
						fromUser: {
							_id: userToAdd._id.toString(),
							firstName: userToAdd.firstName,
							lastName: userToAdd.lastName,
							img: userToAdd.img
						},
						data: notificationForAddTo.data, //date,
						message: notificationForAddTo.message
					}
				});

				return res.status(200).json({
					message: 'Friend request accepted successfully',
					from: userId,
					to: userToAddId
				});
			}
		}
		console.log('reached here');
		const friendRequest = new FriendRequest(new ObjectId(userId), new ObjectId(userToAddId));

		console.log('exports.patchSendFriendRequest -> and here', 'and here');
		// add this friendRequest to the userToAdd friendRequests array
		await User.updateUserWithCondition(
			{ _id: new ObjectId(userToAddId) },
			{
				$addToSet: { friendRequests: friendRequest }
			}
		);
		console.log('and here');
		// add the userToAddId in the friendRequestsUser array to make him recogonized as (sent)
		await User.updateUserWithCondition(
			{ _id: new ObjectId(userId) },
			{ $addToSet: { friendRequestsUsers: new ObjectId(userToAddId) } }
		);

		// emit an event with the new notification to userToAddId => the frontend will only increase the numbers of notifications by 1
		getIo().emit('friendRequest', {
			friendRequest: {
				_id: friendRequest._id,
				from: user._id,
				type: 'friendRequest',
				fromUser: {
					_id: user._id.toString(),
					firstName: user.firstName,
					lastName: user.lastName,
					img: user.img,
					gender: user.gender,
					country: user.country
				},
				date: friendRequest.date // date
			},
			to: userToAddId
		});

		res.status(200).json({
			message: 'Friend request sent successfully',
			from: userId,
			to: userToAddId
		});
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

// socket handled
exports.deleteRejectFriendRequest = async (req, res, next) => {
	const userId = req.userId; // the user who rejected
	const { friendRequestId, fromId } = req.query; // the user who sent the request
	try {
		const user = await User.getUser(userId);

		// remove this notification from the user.friendRequest array
		await User.removeFriendRequest(userId, friendRequestId);

		// create a notifictaion object, add it to the notifications collection

		const notification = new Notification(
			new ObjectId(userId),
			new ObjectId(fromId),
			'has rejected your friend request'
		); // from is the user who rejected, to is the user who sent the notification(we want to notify him)

		// add the notificationId to the user.notifications array
		// got to the fromId which is the user who sent this friend request, remove userId from his friendRequestsUsers array
		await User.updateUserWithCondition(
			{ _id: new ObjectId(fromId) },
			{
				$pull: { friendRequestsUsers: new ObjectId(userId) },
				$addToSet: { notifications: notification }
			}
		);

		// emit a socket event with the notification id, fromId, toId
		getIo().emit('informingNotification', {
			notification: {
				_id: notification._id,
				from: user._id.toString(),
				fromUser: {
					_id: user._id.toString(),
					firstName: user.firstName,
					lastName: user.lastName,
					img: user.img
				},
				data: notification.data, //date (typo),
				message: notification.message
			},
			to: fromId
		});

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

exports.patchAcceptFriendRequest = async (req, res, next) => {
	const userId = req.userId; // the user who accepted
	console.log('exports.patchAcceptFriendRequest -> userId', userId);
	const { friendRequestId, fromId } = req.body;
	console.log('exports.patchAcceptFriendRequest -> fromId', fromId);
	console.log('exports.patchAcceptFriendRequest -> friendRequestId', friendRequestId);

	try {
		const user = await User.getUser(userId);
		// create a chatRoom between these two users
		// add the chatRoomId to both userId and fromId
		const chatRoom = new ChatRoom(new ObjectId(fromId), new ObjectId(userId));
		const addedRoom = await chatRoom.addChatRoom();
		const insertedRoomId = addedRoom.insertedId;

		const notification = new Notification(
			new ObjectId(userId),
			new ObjectId(fromId),
			'has accepted your friend request.'
		);
		// remove the friendRequest from the user.friendRequests array
		// add the fromId to the user.friends array
		const userFilter = { _id: new ObjectId(userId) };
		const fromFilter = { _id: new ObjectId(fromId) };

		await Promise.all([
			User.updateUserWithCondition(userFilter, { $addToSet: { chats: new ObjectId(insertedRoomId) } }),
			User.updateUserWithCondition(userFilter, { $pull: { friendRequests: { _id: { $eq: friendRequestId } } } }),
			User.updateUserWithCondition(userFilter, {
				$addToSet: {
					friends: new ObjectId(fromId)
				}
			}),
			User.updateUserWithCondition(fromFilter, { $addToSet: { chats: new ObjectId(insertedRoomId) } }),
			User.updateUserWithCondition(fromFilter, { $addToSet: { friends: new ObjectId(userId) } }),
			User.updateUserWithCondition(fromFilter, { $addToSet: { notifications: notification } }),
			User.updateUserWithCondition(fromFilter, { $pull: { friendRequestsUsers: new ObjectId(userId) } })
		]);

		// emit a socket event ('informingNotification')
		getIo().emit('informingNotification', {
			notification: {
				_id: notification._id,
				from: user._id.toString(),
				fromUser: {
					_id: user._id.toString(),
					firstName: user.firstName,
					lastName: user.lastName,
					img: user.img
				},
				data: notification.data, // date (typo)
				message: notification.message
			},
			to: fromId,
			content: 'friendRequest approval' // indicates that the user accepted the friend so the frontend will go and get the friends again
		});

		res
			.status(200)
			.json({ message: 'Friend Request accepted successfully', friendRequestId: friendRequestId, from: fromId });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.deleteRemoveNotification = async (req, res, next) => {
	const userId = req.userId;
	const { notificationId } = req.params;

	try {
		// make sure that the logged in user own this notification

		const user = await User.getUser(userId);

		console.log('exports.deleteRemoveNotification -> user.notifications', user.notifications);

		if (user.notifications.length < -1) sendError('This user has no notifications!', 404);

		const foundNotification = user.notifications.find(n => n._id === notificationId);

		if (!foundNotification) sendError('This user does not own this notification', 403);

		await User.removeNotification(userId, notificationId);

		res.status(200).json({ message: 'notification removed successfully', notificationId: notificationId });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.uploadPP = async (req, res, next) => {
	const userId = req.userId;
	try {
		const imgFile = req.file;

		if (!imgFile) sendError('File was not passed!', 422);

		console.log('exports.uploadPP -> imgFile', imgFile);
		const imagePath = imgFile.path.replace('\\', '/');

		console.log('exports.uploadPP -> imagePath', imagePath);

		const { secure_url, public_id } = await cloudinaryUploader(imagePath, 'chatsApp');

		const publikIdToBeSent = public_id.split('/')[1];

		const imgObj = { url: secure_url, publicId: publikIdToBeSent };
		// const rootDir = path.dirname(process.mainModule.filename);

		await User.updateUserWithCondition({ _id: new ObjectId(userId) }, { $set: { img: imgObj } });

		fs.unlink(imagePath, error => {
			if (error) throw error;
		});

		res.status(200).json({ message: 'Image uploaded successfully.', img: imgObj });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.editPP = async (req, res, next) => {
	const userId = req.userId;
	console.log('exports.editPP -> userId', userId);

	// old img public_id
	const { publicId } = req.params;
	console.log('exports.editPP -> publicId', publicId);

	// new img

	try {
		const imageFile = req.file;
		console.log('exports.editPP -> imgFile', imageFile);
		if (!imageFile) sendError('The User didn`t path the new file', 422);

		const imagePath = imageFile.path.replace('\\', '/');
		console.log('exports.editPP -> imagePath', imagePath);

		const user = await User.getUser(userId);
		console.log('exports.editPP -> user', user);

		if (!user) sendError('User with given id not found', 404);

		const { secure_url, public_id } = await cloudinaryUploader(imagePath, 'chatsApp');
		console.log('exports.editPP -> public_id', public_id);

		const publicIdToBeSent = public_id.split('/')[1];

		const imgObj = { url: secure_url, publicId: publicIdToBeSent };

		await User.updateUserWithCondition({ _id: new ObjectId(userId) }, { $set: { img: imgObj } });

		console.log('reached here !!!!');
		const result = await cloudinaryRemoval(publicId);

		console.log('exports.editPP -> result', result);

		fs.unlink(imagePath, error => {
			if (error) throw error;
		});

		res.status(200).json({ message: 'profile picture updated successfully', img: imgObj });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};
