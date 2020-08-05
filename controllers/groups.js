const ObjectId = require('mongodb').ObjectId;
const Group = require('../models/group');
const User = require('../models/user');
const sendError = require('../helpers/sendError');
const getIo = require('../helpers/socket').getIo;
const cloudinary = require('../helpers/cloudinary');
const fs = require('fs');

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

exports.editGroup = async (req, res, next) => {
	const { groupId, newName, imagePublicId } = req.body;
	console.log('exports.editGroup -> imagePublicId', imagePublicId);
	console.log('exports.editGroup -> newName', newName);
	console.log('exports.editGroup -> groupId', groupId);
	const { file, userId } = req;

	try {
		const group = await Group.getGroupById(groupId);

		if (group.admin.toString() !== userId.toString()) sendError('User is not group admin', 403);

		const updatedProps = {};

		if (file) {
			// the user uploaded a file to the group

			if (group.img) {
				// the group has a file
				await cloudinary.cloudinaryRemoval(imagePublicId);
			}

			// the group does not have a file

			const imagePath = req.file.path.replace('\\', '/');

			const { secure_url, public_id } = await cloudinary.cloudinaryUploader(imagePath, 'chatsApp');

			const publicIdToBeSent = public_id.split('/')[1];

			const imgObj = { url: secure_url, publicId: publicIdToBeSent };

			updatedProps.img = imgObj;

			fs.unlink(imagePath, err => {
				if (err) throw err;
			});
		}

		updatedProps.name = newName;

		await Group.updateGroupWithCondition({ _id: new ObjectId(groupId) }, { $set: updatedProps });
		res.status(200).json({ message: 'Group updated successfully', groupId: groupId, newProps: updatedProps });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.addMembersToGroup = async (req, res, next) => {
	const userId = req.userId;

	const { groupId, usersSet } = req.body;

	try {
		const group = await Group.getGroupById(groupId);

		if (!group) sendError('Group not found', 404);
		if (usersSet.length < 1) sendError('UsersSet is empty', 403);
		if (group.admin.toString() !== userId.toString()) sendError('You are not Group Admin', 403);

		const usersObjectIds = usersSet.map(uId => new ObjectId(uId));

		await Promise.all([
			Group.updateGroupWithCondition(
				{ _id: new ObjectId(groupId) },
				{ $addToSet: { members: { $each: usersObjectIds } } }
			),
			User.updateUsersWithACondition(
				{ _id: { $in: usersObjectIds } },
				{ $addToSet: { groups: new ObjectId(groupId) } }
			)
		]);

		getIo().emit('usersAddedToGroup', { addedUsers: usersSet, group: groupId });

		res.status(200).json({ message: `Users added succesfully`, users: usersSet });
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

		if (group.admin.toString() === userToKickId.toString()) sendError('The admin can`t kick himself', 403);

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
			.json({ message: 'user has kicked from group successfully', groupId: groupId, kickedUser: userToKickId });
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

exports.friendsForGroups = async (req, res, next) => {
	const { userId } = req; // admin

	const { groupId } = req.params;

	try {
		const group = await Group.getGroupById(groupId);

		if (group.admin.toString() !== userId.toString()) sendError('User is not admin`s group', 403);

		const user = await User.getUserAggregated([
			{ $match: { _id: new ObjectId(userId) } },
			{ $lookup: { from: 'users', localField: 'friends', foreignField: '_id', as: 'userFriends' } },
			{
				$project: {
					userFriends: 1
				}
			}
		]);

		const userFriends = user.userFriends;

		if (userFriends.length === 0) return res.status(200).json({ friendsToAdd: [] });

		const friendsToAdd = [];

		const stringifiedMembers = group.members.map(member => member.toString());
		for (let friend of userFriends) {
			if (!stringifiedMembers.includes(friend._id.toString())) {
				let newFriend = (({ _id, firstName, lastName, online, img }) => ({
					_id,
					firstName,
					lastName,
					online,
					img
				}))(friend);

				friendsToAdd.push(newFriend);
			}
		}

		res.status(200).json({ friendsToAdd: friendsToAdd });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.leaveGroup = async (req, res, next) => {
	const { userId } = req;
	const { groupId } = req.params;

	try {
		const user = await User.getUser(userId);
		if (!user) sendError('User with given id is not found', 404);

		const group = await Group.getGroupById(groupId);

		if (group.admin.toString() === userId.toString()) sendError('Group Admin can`t leave the group', 403);

		await Promise.all([
			Group.updateGroupWithCondition(
				{ _id: new ObjectId(groupId) },
				{ $pull: { members: new ObjectId(userId) } }
			),
			User.updateUserWithCondition({ _id: new ObjectId(userId) }, { $pull: { groups: new ObjectId(groupId) } })
		]);

		getIo().emit('leaveGroup', { groupId: groupId, userId: userId });

		res.status(200).json({ message: 'Group quited sucessfully', groupId: groupId, userId: userId });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;
		next(error);
	}
};

exports.deleteGroup = async (req, res, next) => {
	const { groupId } = req.params;
	const { userId } = req;

	try {
		const user = await User.getUser(userId);

		if (!user) sendError('user with given id was not found', 404);
		const group = await Group.getGroupById(groupId);

		if (group.admin.toString() !== userId.toString()) sendError('User is not group admin', 403);

		const groupMembersIds = group.members; // at least one member which is the admin

		await Promise.all([
			Group.deleteGroup(groupId),
			User.updateUsersWithACondition(
				{ _id: { $in: groupMembersIds } },
				{ $pull: { groups: new ObjectId(groupId) } }
			)
		]);

		getIo().emit('groupIsDeleted', { groupId: groupId, gorupMembers: groupMembersIds });
		res.status(200).json({ message: 'Group delete successfully', groupId: groupId });
	} catch (error) {
		if (!error.statusCode) error.statusCode = 500;

		next(error);
	}
};
