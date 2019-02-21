const express = require('express');
const authRouter  = express.Router();

const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/* GET & POST Auth routes */

authRouter.post('/signup', (req, res) => {
  if(req.body.password !== req.body.confirm) return res.status(500).json({msg: 'Passwords mismatch'});
  const salt = bcrypt.genSaltSync(256);
  const hashedPassword = bcrypt.hashSync(req.body.password, salt);
  req.body.password = hashedPassword;
  let user = {}
  Object.keys(req.body).forEach(key => {
    user[key] = req.body[key];
  })
  User.create(user)
  .then(user => {
    const token = jwt.sign({id: user._id}, process.env.SECRET);
    delete user._doc.password;
    res.status(200).json({msg: 'User succesfully registered! Once you receive your username you will be able to login. Please contact the App Administrator', user, token});
  })
  .catch(err => {
    res.status(500).json({err, msg: 'User already registered'});
  });
});

authRouter.post('/login', async (req, res) => {
  const user = await User.findOne({userName: req.body.userName});
  if(!user) return res.status(404).json({msg: 'Username not registered'});
  let validPassword = bcrypt.compareSync(req.body.password, user.password);
  if(!validPassword) return res.status(500).json({msg: 'Wrong password'});
  const token = jwt.sign({id: user._id}, process.env.SECRET, {expiresIn: 86400});
  delete user._doc.password;
  res.status(200).json({user, token, msg: 'Logged in succesfully'});
});

authRouter.get('/loggedin', (req, res) => {
  const token = req.headers['x-access-token'];
  if(!token) return res.status(403).json({msg:'Token not received'})
  jwt.verify(token, process.env.SECRET, async (err, decoded)=>{
    if(err) return res.status(403).json({err, msg:'Session expired'})
    res.status(200).json({msg: 'Valid User'})
  })
})

module.exports = authRouter;