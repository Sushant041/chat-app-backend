const express = require("express");
const protect = require("../middleware/protect");
const Message = require("../models/messagemode");
const User = require("../models/usermodel");
const Chat = require("../models/chatmodel");

const router = express.Router();


router.post("/", protect, async(req, res) =>{
      
    const {content, chatId} = req.body;
    

    if(!content || ! chatId){
        console.log("Invalid Data");
        res.sendStatus(400);
        return;
    }
   
     try {

        let message = await Message.create({
            sender: req.user._id,
            content: content,
            chat: chatId,
        })

        message =await message.populate("sender", "name pic")
        message = await message.populate("chat")
        message = await User.populate(message, {
            path: "chat.users",
            select: "name pic email",
        });

        await Chat.updateOne(
            { _id: chatId },
            { $set: { latestMessage: message } }
        );

        res.json(message)
        
     } catch (error) {
        console.log(error)
        res.sendStatus(400);
     }
    
})


router.get("/:chatId", protect, async(req, res) => {
    
    try {
         const message = await Message.find({chat: req.params.chatId})
         .populate("sender", "name pic email")
         .populate("chat");

         res.json(message);

    } catch (error) {
        console.log(error);
        res.sendStatus(400)
    }
})


module.exports = router;