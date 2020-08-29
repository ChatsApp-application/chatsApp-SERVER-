const { ObjectId } = require('mongodb');

const collectionName = 'chatRooms';
const db = require('../helpers/db').getDb;

class ChatRoom {
	constructor(userOne, userTwo, chatHistory = []) {
		// it doesn`t make any difference but i will make the user who sent the request userOne just to avoid randomity
		this.userOne = userOne;
		this.userTwo = userTwo;
		this.chatHistory = chatHistory;
	}

	addChatRoom = () => {
		return db().collection(collectionName).insertOne(this);
	};

	static getChatRoomAggregated = aggregationArray => {
		return db().collection(collectionName).aggregate(aggregationArray).next();
	};

	static getChatRoomsAggregated = aggregationArray => {
		return db().collection(collectionName).aggregate(aggregationArray).toArray();
	};

	static detectSharedRoom = (userId, friendId) => {
		const sharedRoomQuery = {
			$or: [
				{ $and: [ { userOne: { $eq: new ObjectId(userId) } }, { userTwo: new ObjectId(friendId) } ] },
				{
					$and: [ { userOne: { $eq: new ObjectId(friendId) } }, { userTwo: { $eq: new ObjectId(userId) } } ]
				}
			]
		};

		return sharedRoomQuery;
	};

	static getSharedChatRoom = (userId, friendId) => {
		const sharedRoomQuery = this.detectSharedRoom(userId, friendId);

		return db().collection(collectionName).findOne(sharedRoomQuery);
	};

	static deleteChatRoom = (userId, friendId) => {
		const sharedRoomQuery = this.detectSharedRoom(userId, friendId);

		return db().collection(collectionName).deleteOne(sharedRoomQuery);
	};

	static updateChatWithCondition = (filterObj, conditionObj, arrayFilterObj) => {
		return db().collection(collectionName).updateOne(filterObj, conditionObj, arrayFilterObj);
	};

	static updateChatMessagesWithCondition = (filterObj, conditionObj) => {
		return db().collection(collectionName).updateMany(filterObj, conditionObj);
	};
}

module.exports = ChatRoom;
