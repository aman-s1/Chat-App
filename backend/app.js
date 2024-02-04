const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require("socket.io");

const sequelize = require('./util/database');
const User = require('./models/user');
const Message = require('./models/message');
const Group = require('./models/group');
const UserGroup = require('./models/usergroup');

const userRoutes = require('./routes/user');
const msgRoutes = require('./routes/message');
const userGroupRoutes = require('./routes/usergroup');

const app = express();
dotenv.config();

// Use the cors middleware before your routes
app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true,
}));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://127.0.0.1:5500',
        credentials: true,
    },
});

global.socketServer = io;

io.on("connection", (socket) => {
    console.log('Socket connected:', socket.id);
});

app.use(express.json());

app.use('/user', userRoutes);
app.use('/message', msgRoutes);
app.use('/group', userGroupRoutes);

User.hasMany(Message);
Message.belongsTo(User);

User.belongsToMany(Group, { through: UserGroup });
Group.belongsToMany(User, { through: UserGroup });

Group.hasMany(Message);

sequelize.sync()
    .then(() => {
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => console.log(err));
