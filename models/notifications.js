const { v4: uuidv4 } = require('uuid');

class Notification {
	constructor(from, to, message, date = new Date(), type = 'informingNotification', _id = uuidv4()) {
		this._id = _id;
		this.type = type;
		this.from = from;
		this.to = to;
		this.message = message;
		this.data = date;
	}
}

module.exports = Notification;
