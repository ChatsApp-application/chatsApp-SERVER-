const { v4: uuidv4 } = require('uuid');

class FriendRequest {
	constructor(from, to, _id = uuidv4()) {
		this._id = _id;
		this.type = 'friendRequest';
		this.from = from;
		this.to = to;
		this.date = new Date();
	}
}

module.exports = FriendRequest;
