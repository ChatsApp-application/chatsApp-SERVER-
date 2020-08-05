const getIo = require('../helpers/socket').getIo;

exports.increaseRoomMembers = (room, eventName) => {
	const io = getIo();
	io.in(room).clients((error, clients) => {
		if (error) throw error;
		io.in(room).emit(eventName, clients.length);
	});
};

exports.projectGroupMembers = group => {
	let newMembers = group.groupMembers.map(member => {
		let newMember = (({ _id, firstName, lastName, online, img }) => ({
			_id,
			firstName,
			lastName,
			online,
			img
		}))(member);

		return newMember;
	});

	return newMembers;
};

exports.newChatHistory = room => {
	const newChatHistory = room.chatHistory.map(message => {
		let newMessage = { ...message };

		// change the fromUser into an object
		let fromUser = { ...newMessage.fromUser[0] };

		// destructure our desired data
		let newFromUser = (({ _id, firstName, lastName, online, img }) => ({
			_id,
			firstName,
			lastName,
			online,
			img
		}))(fromUser);

		newMessage.fromUser = newFromUser;

		return newMessage;
	});

	return newChatHistory;
};
