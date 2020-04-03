const mongoose = require('mongoose');

const onlineUser = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user'
    }
});

const OnlineUser = mongoose.model('onlineUser', onlineUser);

module.exports = OnlineUser;