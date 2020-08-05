// Group Message requires another class because its props will be different;
const { v4: uuidv4 } = require('uuid');
const db = require('../helpers/db').getDb;
const ObjectId = require('mongodb').ObjectId;
const collectionName = 'groupRooms';

class GroupMessage {
	constructor(from, message) {
		this._id = uuidv4();
		this.from = new ObjectId(from);
		this.message = message;
		this.data = new Date();
	}

	addMessasge = async groupRoomId => {
		return await db()
			.collection(collectionName)
			.updateOne({ _id: new ObjectId(groupRoomId) }, { $addToSet: { chatHistory: this } }); // returns a promise
	};
}

module.exports = GroupMessage;
