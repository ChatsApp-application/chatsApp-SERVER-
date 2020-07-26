const getIo = require('../helpers/socket').getIo;

exports.userTwoIsActive = room => {
	const io = getIo();
	io.in(room).clients((error, clients) => {
		if (error) throw error;
		io.in(room).emit('userTwoIsActive', clients.length);
	});
};
