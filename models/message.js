const { v4: uuidv4 } = require('uuid');
const db = require('../helpers/db').getDb;
const ObjectId = require('mongodb').ObjectId;

const collectionName = 'chatRooms';

class Message {
	constructor(message, from) {
		this._id = uuidv4();
		this.message = message;
		this.from = new ObjectId(from);
		this.seen = false;
		this.date = new Date();
	}

	addMessage = async roomId => {
		return await db()
			.collection(collectionName)
			.updateOne({ _id: new ObjectId(roomId) }, { $addToSet: { chatHistory: this } }); // returns a promise
	};
}

module.exports = Message;
