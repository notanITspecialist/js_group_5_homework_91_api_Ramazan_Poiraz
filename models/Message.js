const mongoose = require('mongoose');

const message = new mongoose.Schema({
    text: {
      type: String,
      required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user'
    },
    private: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }
});

const Message = mongoose.model('message', message);

module.exports = Message;