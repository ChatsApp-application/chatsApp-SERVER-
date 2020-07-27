const mongodb = require('mongodb');

const ObjectId = mongodb.ObjectId;
const db = require('../helpers/db').getDb;

const collectionName = 'users';

class User {
	constructor(firstName, lastName, age, country, gender, email, password) {
		// personal properties
		this.firstName = firstName;
		this.lastName = lastName;
		this.age = age;
		this.country = country;
		this.gender = gender;
		this.email = email;
		this.password = password;
		this.img = null;
		this.joinedAt = new Date();
		// advanced properties
		this.bio = 'Hey there, Iam using chatsApp!';
		this.online = false;
		this.friendRequestsUsers = [];
		this.friendRequests = [];
		this.notifications = [];
		this.friends = [];
		this.chats = [];
		this.groups = [];
		this.profileViewers = [];
	}

	addUser = () => {
		return db().collection(collectionName).insertOne(this);
	};

	static getUser = userId => {
		return db().collection(collectionName).findOne({ _id: new ObjectId(userId) }, { projection: { password: 0 } });
	};

	static getUserAggregatedFixed = userId => {
		return db()
			.collection(collectionName)
			.aggregate([
				{ $match: { _id: new ObjectId(userId) } },
				{ $project: { password: 0, email: 0, notifications: 0, chats: 0, groups: 0 } },
				{ $lookup: { from: 'users', localField: 'friends', foreignField: '_id', as: 'userFriends' } },
				{
					$project: {
						'userFriends.password': 0,
						'userFriends.friendRequestsUsers': 0,
						'userFriends.notifications': 0,
						'userFriends.friends': 0,
						'userFriends.chats': 0,
						'userFriends.groups': 0
					}
				}
			])
			.next();
	};
	static getUserAggregated = aggregationArr => {
		return db().collection(collectionName).aggregate(aggregationArr).next();
	};

	static getUsersAggregated = aggregationArr => {
		return db().collection(collectionName).aggregate(aggregationArr).toArray();
	};

	static getUserWithConditionForLogin = condition => {
		return db().collection(collectionName).findOne(condition);
	};

	static getUserWithCondition = condition => {
		return db().collection(collectionName).findOne(condition, { projection: { password: 0 } });
	};

	static getUsersWithCondition = filterObj => {
		return db().collection(collectionName).find(filterObj, { projection: { password: 0 } }).toArray();
	};

	static updateUserWithCondition = (conditionObj, updatingObj) => {
		return db().collection(collectionName).updateOne(conditionObj, updatingObj);
	};

	static removeNotification = (userId, notifcationId) => {
		return db()
			.collection(collectionName)
			.updateOne({ _id: new ObjectId(userId) }, { $pull: { notifications: { _id: { $eq: notifcationId } } } });
	};

	static removeFriendRequest = (userId, friendRequestId) => {
		return db()
			.collection(collectionName)
			.updateOne({ _id: new ObjectId(userId) }, { $pull: { friendRequests: { _id: { $eq: friendRequestId } } } });
	};

	static updateUsersWithACondition = (conditionObj, updatingObj) => {
		return db().collection(collectionName).updateMany(conditionObj, updatingObj);
	};
}

module.exports = User;
