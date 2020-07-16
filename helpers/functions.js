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
