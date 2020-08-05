const express = require('express');

const router = express.Router();
const { body } = require('express-validator');

const groupsControllers = require('../controllers/groups');
const checkValidation = require('../middlewares/checkValidation');
const isAuth = require('../middlewares/isAuth');
const multerUploader = require('../middlewares/multerUpload');
// POST @ /groups/createGroup
router.post('/createGroup', isAuth, [ body('groupName').notEmpty() ], checkValidation, groupsControllers.createGroup);

// PATCH @ /groups/addMember
router.patch('/addMember', isAuth, groupsControllers.addMembersToGroup);

// PATCH @ /groups/kickMember
router.patch('/kickMember', isAuth, groupsControllers.kickMember);

// GET @ /groups/userGroups
router.get('/userGroups', isAuth, groupsControllers.getUserGroups);

// GET @ /groups/friendsForGroup/:groupId
router.get('/friendsForGroup/:groupId', isAuth, groupsControllers.friendsForGroups);

router.patch('/editGroup', isAuth, multerUploader.single('image'), groupsControllers.editGroup);

router.delete('/deleteGroup/:groupId', isAuth, groupsControllers.deleteGroup);

router.patch('/leaveGroup/:groupId', isAuth, groupsControllers.leaveGroup);

module.exports = router;
