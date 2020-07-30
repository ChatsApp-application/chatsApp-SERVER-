const getIo = require('../helpers/socket').getIo;
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const User = require('../models/user');
const ChatRoom = require('../models/chatRoom');
const Message = require('../models/message');
const socketIsAuth = require('../sockets/socketIsAuth');
const socketHelpers = require('./socket-helpers');
const Group = require('../models/group');

exports.userOfline = async userToken => {
	try {
		const userId = socketIsAuth(userToken);
		await User.updateUserWithCondition({ _id: new ObjectId(userId) }, { $set: { online: false } });
		getIo().emit('userIsOfline', { userId: userId, error: null });
	} catch (error) {
		getIo().emit('userIsOfline', { userId: userId, error: error.message });
	}
};

exports.onChats = async userToken => {
	console.log('onChats');

	try {
		const userId = socketIsAuth(userToken);

		const user = await User.getUser(userId);

		const userChatRooms = user.chats; // [id, id, id]

		console.log('userChatRooms', userChatRooms);
		// get only the chats that its chatHistory has some messages

		if (userChatRooms.length < 1) {
			return getIo().emit('userChats', { userId: userId, userChats: [] });
		}

		// exclude chats with no message(chat) history
		const userChats = await ChatRoom.getChatRoomsAggregated([
			{
				$match: {
					$and: [ { _id: { $in: userChatRooms } }, { chatHistory: { $ne: [] } } ]
				}
			},

			{
				$lookup: {
					from: 'users',
					localField: 'userOne',
					foreignField: '_id',
					as: 'firstUser'
				}
			},
			{
				$lookup: {
					from: 'users',
					localField: 'userTwo',
					foreignField: '_id',
					as: 'secondUser'
				}
			},
			{
				$project: {
					userOne: 0,
					userTwo: 0,
					'firstUser.friends': 0,
					'firstUser.friendRequestsUsers': 0,
					'firstUser.notifications': 0,
					'firstUser.friendRequests': 0,
					'firstUser.password': 0,
					'firstUser.chats': 0,
					'firstUser.groups': 0,

					'secondUser.friends': 0,
					'secondUser.friendRequestsUsers': 0,
					'secondUser.notifications': 0,
					'secondUser.friendRequests': 0,
					'secondUser.password': 0,
					'secondUser.chats': 0,
					'secondUser.groups': 0
				}
			}
		]);

		console.log('userChats', userChats);
		const mappedUserChats = userChats.map(chat => {
			const newChat = { ...chat };

			newChat.firstUser = { ...newChat.firstUser[0] };
			newChat.secondUser = { ...newChat.secondUser[0] };

			const lastMessage = { ...newChat.chatHistory[newChat.chatHistory.length - 1] };
			newChat.lastMessage = lastMessage;
			newChat.lastMessageDate = lastMessage.date;

			// check unreadMessages
			let unreadMessages = 0;
			for (let i = newChat.chatHistory.length - 1; i >= 0; i--) {
				const message = newChat.chatHistory[i];

				if (message.seen === false && message.from.toString() !== userId.toString()) {
					unreadMessages++;
				}
			}

			newChat.unreadMessages = unreadMessages;

			let newChatForm = (({ _id, firstUser, secondUser, lastMessage, lastMessageDate, unreadMessages }) => ({
				_id,
				firstUser,
				secondUser,
				lastMessage,
				lastMessageDate,
				unreadMessages
			}))(newChat);

			return newChatForm;
		});

		const sortedUserChats = mappedUserChats.slice().sort((a, b) => b.lastMessageDate - a.lastMessageDate);
		getIo().emit('userChats', { userId: userId, userChats: sortedUserChats });
	} catch (error) {
		getIo().emit('userChats', { error: error.message });
	}
};

exports.joinChatRoom = async (socket, chatRoomId, userToken) => {
	const roomToLeave = Object.keys(socket.rooms)[1];
	try {
		const userId = socketIsAuth(userToken);
		console.log('exports.joinChatRoom -> userId', userId);

		console.log('exports.joinChatRoom -> socket.chatRoomId', chatRoomId);

		socket.leave(roomToLeave);

		socket.join(chatRoomId);

		socketHelpers.increaseRoomMembers(chatRoomId, 'userTwoIsActive');

		const tempChatRoom = await ChatRoom.getChatRoomAggregated([ { $match: { _id: new ObjectId(chatRoomId) } } ]);
		console.log('exports.joinChatRoom -> tempChatRoom', tempChatRoom);

		let chatRoom;

		if (tempChatRoom.chatHistory.length > 0) {
			chatRoom = await ChatRoom.getChatRoomAggregated([
				{ $match: { _id: new ObjectId(chatRoomId) } },

				{
					$lookup: {
						from: 'users',
						localField: 'userOne',
						foreignField: '_id',
						as: 'firstUser'
					}
				},
				{
					$lookup: {
						from: 'users',
						localField: 'userTwo',
						foreignField: '_id',
						as: 'secondUser'
					}
				},

				{ $unwind: '$chatHistory' },
				{
					$lookup: {
						from: 'users',
						foreignField: '_id',
						localField: 'chatHistory.from',
						as: 'chatHistory.fromUser'
					}
				},
				{ $unwind: '$chatHistory.from' },
				{ $group: { _id: '$_id', root: { $mergeObjects: '$$ROOT' }, chatHistory: { $push: '$chatHistory' } } },
				{ $replaceRoot: { newRoot: { $mergeObjects: [ '$root', '$$ROOT' ] } } },

				{ $project: { root: 0 } },

				{
					$project: {
						userOne: 0,
						userTwo: 0,
						// firstUser
						'firstUser.friends': 0,
						'firstUser.friendRequestsUsers': 0,
						'firstUser.notifications': 0,
						'firstUser.friendRequests': 0,
						'firstUser.password': 0,

						// secondUser
						'secondUser.friends': 0,
						'secondUser.friendRequestsUsers': 0,
						'secondUser.notifications': 0,
						'secondUser.friendRequests': 0,
						'secondUser.password': 0
					}
				}
			]);
		} else {
			chatRoom = await ChatRoom.getChatRoomAggregated([
				{ $match: { _id: new ObjectId(chatRoomId) } },

				{
					$lookup: {
						from: 'users',
						localField: 'userOne',
						foreignField: '_id',
						as: 'firstUser'
					}
				},
				{
					$lookup: {
						from: 'users',
						localField: 'userTwo',
						foreignField: '_id',
						as: 'secondUser'
					}
				},
				{
					$project: {
						userOne: 0,
						userTwo: 0,
						// firstUser
						'firstUser.friends': 0,
						'firstUser.friendRequestsUsers': 0,
						'firstUser.notifications': 0,
						'firstUser.friendRequests': 0,
						'firstUser.password': 0,

						// secondUser
						'secondUser.friends': 0,
						'secondUser.friendRequestsUsers': 0,
						'secondUser.notifications': 0,
						'secondUser.friendRequests': 0,
						'secondUser.password': 0
					}
				}
			]);
		}

		console.log('exports.joinChatRoom -> chatRoom', chatRoom);

		// tweek our chatRoom a little bit
		const newChatRoom = { ...chatRoom };

		newChatRoom.firstUser = { ...newChatRoom.firstUser[0] };
		newChatRoom.secondUser = { ...newChatRoom.secondUser[0] };

		// do the same for chatHistory messages..

		const newChatHistory = newChatRoom.chatHistory.map(message => {
			let newMessage = { ...message };

			// change the fromUser into an object
			let fromUser = { ...newMessage.fromUser[0] };

			// destructure our desired data
			let newFromUser = (({ _id, firstName, lastName, online, img }) => ({
				_id,
				firstName,
				lastName,
				online,
				img
			}))(fromUser);

			newMessage.fromUser = newFromUser;

			return newMessage;
		});

		newChatRoom.chatHistory = newChatHistory;

		// if (chatRoom.chatHisory.length < 1) return getIo().emit('chatRoomIsJoined', { chatRoom: [] });
		getIo().emit('chatRoomIsJoined', { chatRoom: newChatRoom, to: userId });
	} catch (error) {
		getIo().emit('chatRoomIsJoined', { error: error.message });
	}
};

exports.sendPrivateMessage = async (socket, messageData, userToken) => {
	const { firstName, lastName, message, to } = messageData;
	try {
		const from = socketIsAuth(userToken);

		const clientChatRoom = Object.keys(socket.rooms)[1]; // the chatRoomId of the user

		const newMessage = new Message(message, from);

		// making instanced message to prevent aggregation the from while realtime texting
		const quickMessageForOtherUser = {
			_id: newMessage._id,
			date: newMessage.date,
			seen: newMessage.seen,
			fromUser: {
				_id: from,
				firstName: firstName,
				lastName: lastName
			},
			message: message
		};

		getIo().in(clientChatRoom).emit('privateMessageBack', quickMessageForOtherUser);

		getIo().emit('privateMessageBackFromOutside', to);

		await newMessage.addMessage(clientChatRoom);
		// send another event to handle the outside
	} catch (error) {
		getIo().emit('privateMessageBack', { error: error.message });
	}

	// emit the message back to the other user before it is store in the databse for fast performance
};

exports.joinGroupRoom = async (socket, groupRoomId, userToken) => {
	try {
		const userId = socketIsAuth(userToken);
		const roomToLeave = Object.keys(socket.rooms)[1];

		socket.leave(roomToLeave);

		socket.join(groupRoomId);

		socketHelpers.increaseRoomMembers(groupRoomId, 'aMemberJoinedAGroup');

		const group = await Group.getGroupAggregated([ { $match: { _id: new ObjectId(groupRoomId) } } ]);

		getIo().emit('atGroupRoom', { group: group, to: userId });
	} catch (error) {
		getIo().emit('atGroupRoom', { error: error.message });
	}
};
