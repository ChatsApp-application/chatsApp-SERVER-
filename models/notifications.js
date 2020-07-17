const collectionName = 'notifications';
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const db = require('../helpers/db').getDb;
class Notification {
	constructor(from, to, message, date = new Date(), type = 'informingNotification') {
		this.type = type;
		this.from = from;
		this.to = to;
		this.message = message;
		this.data = date;
	}

	addNotification = () => {
		return db().collection(collectionName).insertOne(this);
	};

	static removeNotification = notificationId => {
		return db().collection(collectionName).deleteOne({ _id: new ObjectId(notificationId) });
	};

	static getNotificationsAggregated = aggregationArray => {
		return db().collection(collectionName).aggregate(aggregationArray).toArray();
	};
}

module.exports = Notification;
