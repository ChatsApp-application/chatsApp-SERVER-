const collectionName = 'friendRequests';
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const db = require('../helpers/db').getDb;

class FriendRequest {
	constructor(from, to) {
		this.type = 'friendRequest';
		this.from = from;
		this.to = to;
		this.date = new Date();
	}

	addFriendRequest = () => {
		return db().collection(collectionName).insertOne(this);
	};

	static getFriendRequestsAggregated = aggregateArr => {
		return db().collection(collectionName).aggregate(aggregateArr).toArray();
	};

	static removeFriendRequest = friendRequestId => {
		return db().collection(collectionName).deleteOne({ _id: new ObjectId(friendRequestId) });
	};
}

module.exports = FriendRequest;
