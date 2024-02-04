const express = require('express');

const UserGroupController = require('../controllers/user-group');
const authenticateMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/create',authenticateMiddleware.authenticate,UserGroupController.createGroup);

router.get('/getusergroups',authenticateMiddleware.authenticate,UserGroupController.getUserGroups);

router.get('/getgroupusers/:groupId',authenticateMiddleware.authenticate,UserGroupController.getGroupUsers);

router.get('/checkadmin/:groupId',authenticateMiddleware.authenticate,UserGroupController.checkAdmin);

router.post('/adduser/:groupId',authenticateMiddleware.authenticate,UserGroupController.addUser);

router.post('/removeuser/:groupId',authenticateMiddleware.authenticate,UserGroupController.removeUser);

router.get('/getgroupmessages/:groupId',authenticateMiddleware.authenticate,UserGroupController.getGroupMessages);


module.exports = router;