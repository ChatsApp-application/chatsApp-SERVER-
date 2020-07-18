// // const people = [ { _id: 1 }, { _id: 3 }, { _id: 4 } ];

// // friendRequestUsers = [ 1, 2 ];

// // const mapped = people.map(person => {
// // 	if (friendRequestUsers.includes(person._id)) {
// // 		return { ...person, sent: true };
// // 	} else {
// // 		return { ...person, sent: false };
// // 	}
// // });
// // console.log('mapped', mapped);

// // ____________________________________
// // const arr = [ '5f0bbada0fea96363c42a28e' ];
// const findMutualFriends = (userX, userY) => {
// 	const mutualFriends = [];
// 	const userXFriendsObj = {};
// 	if (userX.friends.length > 0 && userY.friends.length > 0) {
// 		for (let userXFriend of userX.friends) {
// 			userXFriendsObj[userXFriend] = userXFriend;
// 		}

// 		for (let userYFriend of userY.friends) {
// 			if (userXFriendsObj.hasOwnProperty(userYFriend)) mutualFriends.push(userYFriend);
// 		}
// 	}
// 	console.log('findMutualFriends -> userXFriendsObj', userXFriendsObj);

// 	return mutualFriends;
// };
// // for (let xFriend of userX.friends) {
// //   for (let yFriend of userY.friends) {
// //     if (xFriend.toString() === yFriend.toString()) {
// //       mutualFriends.push(xFriend);
// //       break;
// //     }
// //   }
// // }

// const userX = { friends: [ 2, 1, 3, 4 ] };
// const userY = { friends: [ 2, 3 ] };

// console.log(findMutualFriends(userX, userY));

let x;

if (x === 2) {
	console.log('two');
} else if (x === 4) {
	console.log('four');
} else {
	console.log('one');
}
