const socketIo = require('socket.io');

let _io;
exports.initIo = httpServer => {
	const io = socketIo(httpServer);
	_io = io;
	return _io;
};

exports.getIo = () => {
	if (!_io) console.log('io is not initialized');
	return _io;
};
