const db = require('../helpers/db').getDb;
const ObjectId = require('mongodb').ObjectId;

const collectionName = 'groupRooms';
class Group {
	constructor(name, admin) {
		this.name = name;
		this.admin = admin;
		this.chatHistory = [];
		this.members = [];
		this.createdAt = new Date();
		this.img = null;
	}

	createGroup = () => {
		return db().collection(collectionName).insertOne(this);
	};

	static getGroupById = groupId => {
		return db().collection(collectionName).findOne({ _id: new ObjectId(groupId) });
	};
	static getGroupAggregated = aggregationArr => {
		return db().collection(collectionName).aggregate(aggregationArr).next();
	};

	static getGroupsAggregated = aggregationArr => {
		return db().collection(collectionName).aggregate(aggregationArr).toArray();
	};

	static updateGroupWithCondition = (filterObj, conditionObj) => {
		return db().collection(collectionName).updateOne(filterObj, conditionObj);
	};

	static deleteGroup = groupId => {
		return db().collection(collectionName).deleteOne({ _id: new ObjectId(groupId) });
	};
}

module.exports = Group;
