const express = require('express');

const router = express.Router();
const { body } = require('express-validator');

const groupsControllers = require('../controllers/groups');
const checkValidation = require('../middlewares/checkValidation');
const isAuth = require('../middlewares/isAuth');

// POST @ /groups/createGroup
router.post('/createGroup', isAuth, [ body('groupName').notEmpty() ], checkValidation, groupsControllers.createGroup);

// PATCH @ /groups/addMember
router.patch('/addMember', isAuth, groupsControllers.addMemberToGroup);

// PATCH @ /groups/kickMember
router.patch('/kickMember', isAuth, groupsControllers.kickMember);

// DELETE @ /groups/removeGroup
router.delete('/removeGroup', isAuth, groupsControllers.removeGroup);

// GET @ /groups/userGroups
router.get('/userGroups', isAuth, groupsControllers.getUserGroups);

module.exports = router;
