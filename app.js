const express = require('express');
const app = express();

const initDb = require('./helpers/db').initDb;
const initIo = require('./helpers/socket').initIo;

const bodyParser = require('body-parser');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');

const usersSockets = require('./sockets/users');

// allow CORS
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
	next();
});

app.use(helmet());
app.use(bodyParser.json());

// auth routes
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);

// error handler middleware
app.use((error, req, res, next) => {
	const errorMessage = error.message ? error.message : 'something went wrong';
	const statusCode = error.statusCode;
	console.log('statusCode', statusCode);

	res.status(statusCode).json({ error: errorMessage });
});

// initializing the database using native mongoDB driver
initDb((error, client) => {
	if (error) {
		console.log('Failed To Connect...');
	} else {
		console.log('Connected...');
		let httpServer;
		if (process.env.PORT) {
			console.log('Production');
			httpServer = app.listen(process.env.PORT);
		} else {
			console.log('Development');
			httpServer = app.listen(1000);
		}
		const io = initIo(httpServer);
		// listening to our only namespace => '/'
		// 1- emit,   2- socket.on   3- io.in(room).emit(),
		io.on('connection', socket => {
			console.log(socket.id);
			// userOfline
			socket.on('userOfline', data => {
				const { userId } = data;
				usersSockets.userOfline(userId);
			});
		});
	}
});
