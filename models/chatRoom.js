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
}

module.exports = ChatRoom;
