const protect = require("../middleware/protect");
const Chat = require("../models/chatmodel")
const express = require("express");
const User = require("../models/usermodel");

const router = express.Router()

// =======create chat======

router.post("/", protect, async (req, res) =>{

     const { userId } = req.body;
     
     if(!userId){
        console.log("userid param not sent with request");
        return res.sendStatus(400);
     }

     let isChat = await Chat.find({
       isGorupChat: false,

       $and:[
         { user: {$elemMatch: {$eq: req.user._id}}},
         { user: {$elemMatch: {$eq: {userId}}}},
       ]
     }).populate("users", "-password").populate("latestMessage");

     isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name pic email",
     });

     if(isChat.length > 0){
        res.send(isChat[0]);
     }
     else{
        let chatData ={
            chatName: "sender",
            isGorupChat: false,
            users: [req.user._id, userId],
        };


        try {
            const createdChat = await Chat.create(chatData);
            const FullChat = await Chat.findOne({ _id: createdChat._id}).populate("users", "-password");

            res.status(200).send(FullChat);
        } catch (error) {
            
        }
     }
})


 // =======fetch chat======

 router.get("/allchats", protect, async (req, res) =>{

    try {
        Chat.find({users: {$elemMatch: {$eq: req.user._id}}})
        .populate("users", "-password")
        .populate("groupAdmin", "-password")
        .populate("latestMessage")
           .sort({updatedAt: -1})
        .then(async (results) =>{
            results = await User.populate(results, {
                path: "latestMessage.sender",
                select: "name, pic, email",
            });
            res.status(200).send(results);
        })
    } catch (error) {
        res.status(400).send(error);
    }
 })


 // =======creategroup chat======

 router.post("/creategroupchat", protect, async (req, res) =>{
        if(!req.body.users || !req.body.name){
            return res.status(400).send({message: "Please fill all the fields"})
        }

        let users =JSON.parse(req.body.users);

        if(users.length < 2){
            return res.status(400).send("More than 2 users required to form a group chat");
        }
     
         users.push(req.user);

         try{
            const groupChat = await Chat.create({
                chatName: req.body.name,
                users: users,
                isGroupChat: true,
                groupAdmin: req.user,
            })

            const fullgroupChat = await Chat.findOne({_id: groupChat._id})
                 .populate("users", "-password")
                 .populate("groupAdmin", "-password");

                 res.status(200).json(fullgroupChat);
        }
                 
          catch(error) {
              res.status(400).send(error);
         } 
 })

 //=======rename group======
   
  router.put("/rename", protect, async(req, res) =>{
     
       const {chatId, chatName }= req.body;

       const updatedChat = await Chat.findByIdAndUpdate(
          chatId,
          {
            chatName,
          },
          {
            new: true,
          }
       )
             .populate("users", "-password")
             .populate("groupAdmin", "-password");

             if(!updatedChat) {
                res.status(404).send("Chat Not found")
             }
             else{
                res.json(updatedChat);
             }
  })

   //=======add to group======
   router.put("/add", protect, async (req, res) => {

    const { chatId, userId } = req.body  ;
         
    
      const add = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push: { users: userId},
        },
        { new: true}
      ).populate("users", "-password")
       .populate("groupAdmin", "-password");


       if(!add){
          res.sendStatus(404).send("Chat Not found");
       }
       else{
        res.json(add);
       }
   })


   //=======remove from group======
   router.put("/remove", protect, async (req, res) => {

    const { chatId, userId } = req.body  ;
         
    
      const remove = await Chat.findByIdAndUpdate(
        chatId,
        {
            $pull: { users: userId},
        },
        { new: true}
      ).populate("users", "-password")
       .populate("groupAdmin", "-password");


       if(!remove){
          res.sendStatus(404).send("Chat Not found");
       }
       else{
        res.json(remove);
       }
   })

module.exports = router;