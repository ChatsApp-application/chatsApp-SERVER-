const ObjectId = require('mongodb').ObjectId;
const Group = require('../models/group');
const User = require('../models/user');
const sendError = require('../helpers/sendError');
const getIo = require('../helpers/socket').getIo;

exports.createGroup = async (req, res, next) => {
	const userId = req.userId;
	const { groupName } = req.body;

	try {
		const newGroup = new Group(groupName, new ObjectId(userId));

		const result = await newGroup.createGroup();
		console.log('exports.createGroup -> result', result);

		console.log('h5h5h55h5h5h5hh5h5h5');
		const groupId = result.insertedId;

		await Promise.all([
			User.updateUserWithCondition(
				{ _id: new ObjectId(userId) },
				{ $addToSet: { groups: new ObjectId(groupId) } }
			),

			Group.updateGroupWithCondition(
				{ _id: new ObjectId(groupId) },
				{ $addToSet: { members: new ObjectId(userId) } }
			)
		]);

		res.status(200).json({ message: 'Group created successfully' });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.addMemberToGroup = async (req, res, next) => {
	const userId = req.userId;

	const { groupId, userToAdd } = req.body;

	try {
		const group = await Group.getGroupById(groupId);

		if (!group) sendError('Group not founc', 404);

		if (group.admin.toString() !== userId.toString()) sendError('You are not Group Admin', 403);

		await Group.updateGroupWithCondition(
			{ _id: new ObjectId(groupId) },
			{ $addToSet: { members: new ObjectId(userToAdd) } }
		);

		await User.updateUserWithCondition(
			{ _id: new ObjectId(userToAdd) },
			{ $addToSet: { groups: new ObjectId(groupId) } }
		);

		getIo().emit('userAddedToGroup', userToAdd);

		res.status(200).json({ message: `User ${userToAdd} added succesfully`, addedUserId: userToAdd });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.kickMember = async (req, res, next) => {
	const userId = req.userId; //admin

	const { groupId, userToKickId } = req.body;

	try {
		const group = await Group.getGroupById(groupId);

		if (group.admin.toString() !== userId.toString()) sendError('User is not group admin', 403);

		if (group.admin.toString() === userId.toString()) sendError('The admin can`t kick himself', 403);

		await Promise.all([
			Group.updateGroupWithCondition(
				{ _id: new ObjectId(groupId) },
				{ $pull: { members: new ObjectId(userToKickId) } }
			),

			User.updateUserWithCondition(
				{ _id: new ObjectId(userToKickId) },
				{ $pull: { groups: new ObjectId(groupId) } }
			)
		]);

		getIo().emit('kickedFromGroup', { groupId: groupId, kickedUser: userToKickId });

		res
			.status(200)
			.json({ message: 'user has kicked from group sucessfuly', groupId: groupId, kickedUser: userToKickId });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.removeGroup = async (req, res, next) => {
	const userId = req.userId;
	const { groupId } = req.body;

	try {
		const group = await Group.getGroupById(groupId);

		if (group.admin.toString() !== userId.toString()) sendError('User is not group`s admin', 404);

		const groupMembersIds = group.members; //

		if (groupMembersIds.length > 0) {
			await User.updateUsersWithACondition(
				{ _id: { $in: groupMembersIds } },
				{ $pull: { groups: new ObjectId(groupId) } }
			);
		}

		await Group.deleteGroup(groupId), getIo().emit('groupRemoved', { memebrs: groupMembersIds });

		res.status(200).json({ message: 'Grouped Removed successfully', groupId: groupId });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.getUserGroups = async (req, res, next) => {
	const userId = req.userId;

	try {
		const user = await User.getUser(userId);

		const userGroups = user.groups;

		if (userGroups.length < 1) {
			return res.status(200).json({ userGroups: [] });
		}

		const groups = await Group.getGroupsAggregated([
			{ $match: { _id: { $in: userGroups } } },
			{ $project: { members: 0 } }
		]);

		res.status(200).json({ userGroups: groups });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;

		next(error);
	}
};
