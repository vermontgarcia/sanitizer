const express = require('express');
const authRouter  = express.Router();

const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//const upload = require('../helpers/multer');

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

    res.status(200).json({msg: 'User succesfully registered! Once you receive your username you will be able to login', user, token});
  })
  .catch(err => {
    console.log('User SingUp Error =====>', err);
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

/*
authRouter.patch('/edit', upload.single('profilePicture'), (req, res) => {
  let user={};
  Object.keys(req.body).forEach(key => {
    user[key] = req.body[key];
  });
  if (req.file) user.profilePicture = req.file.url;
  user.profilePicture = req.file.url;
  User.findByIdAndUpdate(req.body._id, {$set: user}, {new: true})
    .then(user => {
      if(!user) return res.status(500).json({msg: 'User not identified'});
      delete user._doc.password;
      res.status(200).json({user, msg: 'User updated succesfully'});
    })
    .catch(err => {
      console.log('User update Error =====>', err);
      res.status(500).json({err, msg: 'Something went wrong. User not updated'});
    });
});
*/

authRouter.get('/loggedin', (req, res) => {

  const token = req.headers['x-access-token'];
  if(!token) return res.status(403).json({msg:'Token not received'})

  jwt.verify(token, process.env.SECRET, async (err, decoded)=>{
    //console.log('Decoded ====>', decoded.id)
    if(err) return res.status(403).json({err, msg:'Session expired'})
    //req.user = await User.findById(decoded.id)
    //next();
    res.status(200).json({msg: 'Valid User'})
  })
})

module.exports = authRouter;