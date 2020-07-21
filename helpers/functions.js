exports.findMutualFriends = (userX, userY) => {
	// BIG O N
	// this function will receive userX and userY
	// userX  will have the aggregated userFriends
	// userY will have only friends which is arr of userIds
	// we will push to mutualFriends from userX friends

	const mutualFriends = [];
	const yFriendsObj = {};
	if (userX.userFriends.length > 0 && userY.friends.length > 0) {
		for (let yFriend of userY.friends) {
			yFriendsObj[`${yFriend}`] = `${yFriend}`;
		}

		for (let xFriend of userX.userFriends) {
			if (yFriendsObj.hasOwnProperty(`${xFriend._id}`)) mutualFriends.push(xFriend);
		}
	}
	console.log('exports.findMutualFriends -> mutualFriends', mutualFriends);

	return mutualFriends;
};

exports.checkRelation = (userWhoWatched, user) => {
	let relation = 'isStranger';

	if (userWhoWatched._id.toString() === user._id.toString()) {
		console.log('isOwner');

		return (relation = 'isOwner'); // isOwner
	}

	if (userWhoWatched.friendRequestsUsers.length > 0) {
		console.log('isFriendSent');

		// check if the user is located in my friendRequestsUsers array
		const userIsHere = userWhoWatched.friendRequestsUsers.find(id => id.toString() === user._id.toString());

		if (userIsHere) return (relation = 'isFriendSent'); // isFriendSent
	}

	if (userWhoWatched.friends.length > 0) {
		const userIshere = userWhoWatched.friends.find(id => id.toString() === user._id.toString());

		console.log('isFriend');

		if (userIshere) return (relation = 'isFriend'); // isFriend
	}

	return relation;
};

exports.fRequestIsSent = (friendRequestsUsersArr, allUsers) => {
	let people;
	if (friendRequestsUsersArr.length > 0) {
		people = allUsers.map(person => {
			let foundUserId = friendRequestsUsersArr.find(id => id.toString() === person._id.toString());

			if (foundUserId) {
				return { ...person, sent: true };
			} else {
				return { ...person, sent: false };
			}
		});
	} else {
		console.log('what!!', false);
		people = allUsers.map(person => {
			return { ...person, sent: false };
		});
	}

	return people;
};
