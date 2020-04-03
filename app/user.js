const express = require('express');

const authorization = require('../middlewerase/authorization');

const User = require('../models/User');

const router = express.Router();

router.post('/', async (req, res) => {
    const newUser = new User(req.body);

    try {
        newUser.addToken();
        await newUser.save();

        res.send(newUser)
    } catch (e) {
        res.status(404).send({error: 'Such username already exists'})
    }
});

router.post('/sessions', authorization, async (req, res) => {
    req.user.addToken();
    req.user.save();

    res.send(req.user)
});

router.delete('/sessions', async (req, res) => {
    const success = {message: "success"};
    try{
        const token = req.get('Authorization').split(' ')[1];

        if(!token) return res.send(success);

        const user = await User.findOne({token});

        if(!user) return res.send(success);

        user.addToken();
        await user.save();

        return res.send(success);

    } catch (e) {
        res.send(success)
    }

});

module.exports = router;