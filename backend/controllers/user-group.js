const Message = require('../models/message');
const User = require('../models/user');
const Group = require('../models/group');
const UserGroup = require('../models/usergroup');

const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const logger = require('../logger');

const createGroup = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const userId = req.user.id;

        const userdata = await User.findOne({ where: { id: userId }, transaction: t });

        if (!userdata) {
            await t.rollback();
            return res.status(404).json({ error: 'User not found' });
        }

        const username = userdata.name;
        const { groupName, participants } = req.body;

        // Fetch user IDs based on participant names
        const participantUserIds = await User.findAll({
            attributes: ['id'],
            where: { name: participants },
            transaction: t,
        });

        if (participantUserIds.length !== participants.length) {
            await t.rollback();
            return res.status(400).json({ error: 'Some participants not found' });
        }

        const createdGroup = await Group.create({
            groupname: groupName,
            createdby: username,
        }, { transaction: t });

        const groupId = createdGroup.id;

        const userGroupMappings = await Promise.all(participantUserIds.map(async (user) => {
            return UserGroup.create({
                userId: user.id,
                groupId: groupId,
            }, { transaction: t });
        }));
        await t.commit();
        logger.info('Created Group : Success.');
        return res.status(200).json({ group: createdGroup, userGroupMappings: userGroupMappings });
    } catch (err) {
        logger.error('Failed To create a group :', err);
        await t.rollback();
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

const getUserGroups = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all groupIds associated with the user
        const userGroupIds = await UserGroup.findAll({
            attributes: ['groupId'],
            where: { userId }
        });

        // Extract groupIds from the result
        const groupIds = userGroupIds.map(userGroup => userGroup.groupId);

        // Find the corresponding groups
        const groups = await Group.findAll({
            attributes: ['id', 'groupname'],
            where: { id: groupIds }
        });

        // Emit a socket event to notify clients about the updated user groups
        const socketUserId = req.user.id.toString(); // Assuming userId is a string
        socketServer.to(socketUserId).emit('userGroupsUpdated', { groups });
        logger.info('Retrieved all groups of a user : Success.');
        return res.status(200).json({ groups });
    } catch (err) {
        logger.error('Failed To retrieve all groups of a user :', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getGroupUsers = async (req, res) => {
    try {
        const groupId = req.params.groupId;

        // Find all user IDs in the given group
        const groupUserIds = await UserGroup.findAll({
            attributes: ['userId'],
            where: { groupId },
        });

        const userIds = groupUserIds.map(groupUserId => groupUserId.userId);

        // Find user names based on user IDs
        const groupUsers = await User.findAll({
            attributes: ['id', 'name'],
            where: { id: userIds },
        });
        logger.info('Retrieved all Users in the group : Success.');
        return res.status(200).json({ users: groupUsers });
    } catch (err) {
        logger.error('Failed To retrieve users of the group :', err);
        return res.status(500).json({ error: 'Failed to retrieve users in the group' });
    }
};

const checkAdmin = async (req,res) => {
    try {
        const groupId = req.params.groupId;
        const userId = req.user.id;

        const userDetails = await User.findOne({
            attributes: ['id', 'name'],
            where: { id: userId },
        });

        if (!userDetails) {
            return res.status(404).json({ error: 'User not found' });
        }

        const groupDetails = await Group.findOne({
            attributes: ['id', 'createdby'],
            where: { id: groupId },
        });

        if (!groupDetails) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const isAdmin = userDetails.name === groupDetails.createdby;
        logger.info('Checked User is admin : Success.');
        return res.status(200).json({ isAdmin });
    } catch (err) {
        logger.error('Failed To check if user is admin :', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

const addUser = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const userName = req.body.userName;

        const userDetails = await User.findOne({ where: { name: userName }});

        if(!userDetails)
        {
            return res.status(400).json({ error: 'User Not found'});
        }

        const addedUser = await UserGroup.create({
            userId: userDetails.id,
            groupId: groupId
        });
        logger.info('User added to Group : Success.');
        return res.status(200).json({ message: 'User added successfully' });
    } catch(err) {
        logger.error('Failed To add user To Group :', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

const removeUser = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const userName = req.body.userName;

        // Find the user based on the provided name
        const userDetails = await User.findOne({ where: { name: userName } });

        // If the user is not found, return an error
        if (!userDetails) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Remove the user from the group in the UserGroup table
        const removedUser = await UserGroup.destroy({
            where: {
                userId: userDetails.id,
                groupId: groupId,
            },
        });

        // Check if any records were deleted
        if (removedUser === 0) {
            return res.status(400).json({ error: 'User not found in the group' });
        }
        logger.info('Removed user from group : Success.');
        return res.status(200).json({ message: 'User removed successfully' });
    } catch (err) {
        logger.error('Failed To remove User from group:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getGroupMessages = async (req, res) => {
    try {
        const groupId = req.params.groupId;

        // Find all messages associated with the group
        const groupMessages = await Message.findAll({
            attributes: ['id', 'message', 'userId'],
            where: { groupId: groupId },
        });

        if (!groupMessages || groupMessages.length === 0) {
            return res.status(404).json({ error: 'No messages found for the group' });
        }

        // Extract user ids from the messages
        const userIds = groupMessages.map(message => message.userId);

        // Find user names based on user ids
        const users = await User.findAll({
            attributes: ['id', 'name'],
            where: { id: userIds },
        });

        // Create a map to easily look up user names by user id
        const userNameMap = users.reduce((map, user) => {
            map[user.id] = user.name;
            return map;
        }, {});

        // Combine message data with user names
        const messages = groupMessages.map(message => ({
            id: message.id,
            sender: userNameMap[message.userId],
            message: message.message,
        }));
        logger.info('Retrieved Messages of group : Success.');
        return res.status(200).json({ messages });
    } catch (err) {
        logger.error('Failed To retrieve messages of group:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    createGroup,
    getUserGroups,
    getGroupUsers,
    checkAdmin,
    addUser,
    removeUser,
    getGroupMessages
};
