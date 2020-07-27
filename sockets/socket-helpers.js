const getIo = require('../helpers/socket').getIo;

exports.increaseRoomMembers = (room, eventName) => {
	const io = getIo();
	io.in(room).clients((error, clients) => {
		if (error) throw error;
		io.in(room).emit(eventName, clients.length);
	});
};
