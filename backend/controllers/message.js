const Message = require('../models/message');
const User = require('../models/user');
const UserGroup = require('../models/usergroup');

const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const multer = require('multer');
const upload = multer({ dest: 'backend/' });

const AWS = require('aws-sdk');

const logger = require('../logger');

function uploadToS3(data, filename){
    const BUCKET_NAME = process.env.BUC_NAME;
    const IAM_USER_KEY = process.env.I_AM_USER_KEY;
    const IAM_USER_SECRET = process.env.I_AM_USER_SECRET;

    let s3bucket = new AWS.S3({
        accessKeyId: IAM_USER_KEY,
        secretAccessKey: IAM_USER_SECRET,
        //Bucket: BUCKET_NAME
    })

    var params = {
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: data,
        ACL: 'public-read'
    }
    return new Promise((resolve,reject) => {
        s3bucket.upload(params, (err, s3response) => {
            if(err)
            {
                console.log('Something went Wrong');
                logger.error('Error processing request:', error);
                reject(err);
            }else{
                console.log('Success', s3response);
                resolve(s3response.Location);
            }
        })
    })
}

function isstringInvalid(string){
    if(string == undefined || string.length === 0)
    {
        return true;
    }
    else{
        return false;
    }
}


const sendimage = async (req, res) => {
    const groupId = req.body.groupId;

    try {
        if (!groupId) {
            return res.status(400).json({ err: 'Invalid groupId' });
        }

        const file = req.file;

        if (!file) {
            return res.status(400).json({ err: 'No image file provided' });
        }

        const imageBuffer = fs.readFileSync(file.path); // Read the image file as a buffer

        // Upload the image to AWS S3
        const imageUrl = await uploadToS3(imageBuffer, file.originalname);

        // Save the image link to the Message table
        const createdMsg = await Message.create({
            message: imageUrl,
            userId: req.user.id,
            groupId,
        });

        // Emit a socket event to notify all clients in the group about the new image
        io.to(groupId).emit('newImage', createdMsg);
        logger.info('Image sent : Success.');
        res.status(201).json({ message: createdMsg });
    } catch (err) {
        logger.error('Failed To send Image :', err);
        return res.status(500).json({ err: 'Failed to send image' });
    }
};

const sendmessage = async (req, res) => {
    const { message, groupId } = req.body;

    try {
        if (isstringInvalid(message) || !groupId) {
            return res.status(400).json({ err: 'Invalid message or groupId' });
        }

        // Check if the user is a member of the specified group
        const isUserInGroup = await UserGroup.findOne({
            where: { userId: req.user.id, groupId },
        });

        if (!isUserInGroup) {
            return res.status(403).json({ err: 'User is not a member of the specified group' });
        }

        const createdMsg = await Message.create({ message, userId: req.user.id, groupId });
        io.to(groupId).emit('newMessage', createdMsg);
        logger.info('Message sent : Success.');
        res.status(201).json({ message: createdMsg });
    } catch (err) {
        logger.error('Failed To send message :', err);
        return res.status(500).json({ err: 'Failed to send message' });
    }
};


const getMessages = async (req,res) => {
    try {
        const lastMessageId = req.query.lastmsgid;
        let whereCondition = {};

        if (lastMessageId) {
            whereCondition = {
                id: {
                    [Sequelize.Op.gt]: lastMessageId,
                },
            };
        }
        const messages = await Message.findAll({
            where: whereCondition,
            include: {
                model: User,
                attributes: ['name'],
            },
        });
        logger.info('Restrieved Messages : Success.');
        return res.status(200).json({ messages });
    } catch (err) {
        logger.error('Failed To retrieve messages :', err);
        return res.status(500).json({ err: 'Failed to get Expenses'});
    }
}

const getoldMessages = async (req, res) => {
    try {
        const firstmessageid = req.query.firstmessageid;
        const groupId = req.query.groupId;
        let whereCondition = {
            groupId: groupId,
        };

        if (firstmessageid) {
            whereCondition.id = {
                [Sequelize.Op.lt]: parseInt(firstmessageid),
            };
        }

        const messages = await Message.findAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    attributes: ['name'],
                },
            ],
        });

        // Extract relevant data to send in response
        const formattedMessages = await Promise.all(messages.map(async (msg) => {
            const user = await User.findOne({ where: { id: msg.userId } });
            const userName = user ? user.name : 'Unknown User';

            return {
                id: msg.id,
                message: msg.message,
                createdAt: msg.createdAt,
                updatedAt: msg.updatedAt,
                userId: msg.userId,
                userName: userName,
            };
        }));
        logger.info('Retrieved old messages : Success.');
        return res.status(200).json({ messages: formattedMessages });
    } catch (err) {
        logger.error('Failed To retrieve old messages :', err);
        return res.status(500).json({ err: 'Failed to get Expenses' });
    }
};



module.exports = {
    sendmessage,
    getMessages,
    getoldMessages,
    sendimage
}