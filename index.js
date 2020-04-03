const express = require('express');
const expressWs = require('express-ws');
const cors = require('cors');
const mongoose = require('mongoose');

const config = require('./config');

const user = require('./app/user');

const OnlineUser = require('./models/OnlineUser');
const User = require('./models/User');
const Message = require('./models/Message');

const app = express();

expressWs(app);

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const init = async () => {
    await mongoose.connect(config.baseUrl,config.baseConfig);

    app.use('/user', user);

    await OnlineUser.remove();

    const users = {};

    app.ws('/chat', async (ws, req) => {
        const user = await User.findOne({token: req.query.token});
        if(!user) return;

        const onlineUser = await OnlineUser.create({user: user._id});
        users[onlineUser._id] = ws;

        let allUsers = JSON.stringify({type: 'ONLINE_USERS',allUsers: await OnlineUser.find().populate('user')});

        Object.keys(users).forEach(user => {
            users[user].send(allUsers);
        });
        const messages = await Message.find().sort({ _id: -1 }).limit(30).populate(['author', 'private']);

        const openData = JSON.stringify({type: 'OPEN_CONNECT', data: messages});

        ws.send(openData);

        ws.on('message', async m => {
            const data = JSON.parse(m);


            if(data.type === 'ADD_MESSAGE'){
                if(data.data.private){
                    const onlUser = await OnlineUser.findOne({user: data.data.private});
                    const newMessage = {author: user._id, text: data.data.message, private: data.data.private};
                    const newMsg = await Message.create(newMessage);
                    const msg = await Message.findOne({_id: newMsg._id}).populate(['author', 'private']);

                    const stringMessage = JSON.stringify({type: 'PRIVATE_MSG', data: msg});
                    users[onlUser._id].send(stringMessage);
                    return  ws.send(stringMessage);
                }
                const newMessage = {author: user._id, text: data.data.message};
                await Message.create(newMessage);
                const messages = await Message.find().sort({ _id: -1 }).limit(30).populate(['author', 'private']);

                const stringMessage = JSON.stringify({type: 'LAST_30_MSG', data: messages});

                Object.keys(users).forEach(user => {
                    users[user].send(stringMessage);
                });
            }

            if(data.type === 'LOG_OUT'){
                delete users[onlineUser._id];
                onlineUser.remove();

                const allOnlineUsers = JSON.stringify({type: 'ONLINE_USERS',allUsers: await OnlineUser.find().populate('user')});

                Object.keys(users).forEach(user => {
                    users[user].send(allOnlineUsers);
                });
            }
        });

        ws.on('close', async () => {
            delete users[onlineUser._id];
            onlineUser.remove();

            const allOnlineUsers = JSON.stringify({type: 'ONLINE_USERS',allUsers: await OnlineUser.find().populate('user')});

            Object.keys(users).forEach(user => {
                users[user].send(allOnlineUsers);
            });
        })

    });


    app.listen(8000, () => {
        console.log('Server started on 8000 host!');
    });
};

init().catch(e => console.log(e));