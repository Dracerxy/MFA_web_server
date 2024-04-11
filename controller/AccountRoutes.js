const express=require("express");
const AccountRoutes=new express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../schema/UserDataSchema');
const axios = require('axios');
AccountRoutes.get("/home",(req,res)=>{
   res.send("hello server"); 
});

AccountRoutes.post('/login', async (req, res) => {
   const { email, password } = req.body;
   const user = await User.findOne({ email });
   if (!user) {
     return res.status(404).json({ error: 'User not found' });
   }
 
   const isPasswordValid = await bcrypt.compare(password, user.password);
   
   if (!isPasswordValid) {
     return res.status(401).json({ error: 'Invalid password' });
   }
 
   const token = jwt.sign({ id: user._id, email: user.email }, '6211eb3e330b634779d6cdc24db7b0e90a17d9');
   res.status(200).json({ token });
 });
 
 AccountRoutes.post('/signup', async (req, res) => {
   try {
     const { name, email, password } = req.body;
     const existingUser = await User.findOne({ email });
 
     if (existingUser) {
       return res.status(400).json({ error: 'User already exists' });
     }
  /*Please ensure to use the wallet creating API call here for the Client And the client should update the database schema to store the respective generated credsss...............*/
     const response = await axios.get('http://localhost:3030/contract/get-wallet');
     const { address, key } = response.data;
   const hashedPassword = await bcrypt.hash(password, 10);
     const user = new User({ name, email, password: hashedPassword,wallet_address:address,private_key:key });
     await user.save();
 
     const token = jwt.sign({ id: user._id, email: user.email }, '6211eb3e330b634779d6cdc24db7b0e90a17d9');
     res.status(201).json({ token });
   } catch (error) {
     res.status(500).json({ error: error.message });
   }
 });
 AccountRoutes.put('/updateDappAddress', async (req, res) => {
  try {
    const { token, dapp_address } = req.body;

    if (!token || !dapp_address) {
      return res.status(400).json({ error: 'Token and dapp_address are required in the request body' });
    }

    // Verify the token
    const decoded = jwt.verify(token, '6211eb3e330b634779d6cdc24db7b0e90a17d9'); 

    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Update the dapp_address for the user
    user.dapp_address = dapp_address;
    await user.save();

    res.status(200).json({ message: 'Dapp address updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

 AccountRoutes.post('/generateToken', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required in the request body' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a unique token for the user
    const token = jwt.sign({ email: user.email }, '6211eb3e330b634779d6cdc24db7b0e90a17d9'); 

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = AccountRoutes;