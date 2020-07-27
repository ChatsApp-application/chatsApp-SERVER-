const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;

let _db;
let _client;
// connecting url
const mongoUrl = `mongodb+srv://${process.env.DB_USER}:${process.env
	.DB_PASS}@chatsapp-cluster.bz2fz.mongodb.net/chatsApp?retryWrites=true&w=majority`;

exports.initDb = async cb => {
	if (_db) return cb(null, _client);

	try {
		_client = await MongoClient.connect(mongoUrl, { useUnifiedTopology: true });

		_db = _client.db();

		cb(null, _client);
	} catch (error) {
		cb(error, null);
	}
};

exports.getDb = () => {
	if (!_db) throw 'Not Connected...';

	return _db;
};
