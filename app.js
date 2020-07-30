const express = require('express');
const initDb = require('./helpers/db').initDb;
const initIo = require('./helpers/socket').initIo;
const app = express();
const bodyParser = require('body-parser');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const usersSockets = require('./sockets/users');
const User = require('./models/user');
// allow CORS
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
	next();
});

// app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(helmet());
app.use(bodyParser.json());

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/groups', groupRoutes);

// error handler middleware
app.use((error, req, res, next) => {
	console.log('error', error);
	const errorMessage = error.message ? error.message : 'something went wrong';
	const statusCode = error.statusCode ? error.statusCode : 500;
	console.log('statusCode', statusCode);

	res.status(statusCode).json({ error: errorMessage });
});

// initializing the database using native mongoDB driver
initDb((error, client) => {
	if (error) {
		console.log('error', error);
		console.log('Failed To Connect...');
	} else {
		console.log('Connected...');
		let httpServer;
		if (process.env.PORT) {
			console.log('Production');
			httpServer = app.listen(process.env.PORT);
		} else {
			console.log('Development');
			httpServer = app.listen(1502);
		}

		// AGENDA
		// TIME INTERVAL JOBS
		const Agenda = require('agenda');
		const agenda = new Agenda({ mongo: client.db('chatsApp'), db: { collection: 'agenda' } });

		agenda.define('cleanProfileViewers', async (job, done) => {
			await User.updateUsersWithACondition({}, { $set: { profileViewers: [] } });

			done();
		});

		agenda.on('ready', async () => {
			// IIFE to give access to async/await
			await agenda.start();
			await agenda.every('24 hours', 'cleanProfileViewers');

			console.log('working!!!');
		});

		const io = initIo(httpServer);
		// listening to our only namespace => '/'
		// 1- emit,   2- socket.on   3- io.in(room).emit(),
		io.on('connection', socket => {
			console.log(socket.id);
			// userOfline
			socket.on('userOfline', data => {
				usersSockets.userOfline(data.userToken);
			});

			socket.on('leaveRoomOrGroup', data => {
				const { roomId } = data;
				socket.leave(roomId);
			});

			// when the user request his chats
			socket.on('onChats', data => {
				usersSockets.onChats(data.userToken);
			});

			// when the user joins a room
			socket.on('joinRoom', data => {
				usersSockets.joinChatRoom(socket, data.chatRoomId, data.userToken);
			});

			socket.on('privateMessage', data => {
				usersSockets.sendPrivateMessage(socket, data.messageData, data.userToken);
			});

			socket.on('joinGroupRoom', data => {
				usersSockets.joinGroupRoom(socket, data.groupId, data.userToken);
			});
		});
	}
});
