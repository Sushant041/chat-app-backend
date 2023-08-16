const express = require("express");
const router = express.Router();
const chats = require("./data")

//Route 1
router.get('/', (req, res) =>{
    res.send("hi there server is running");
})


//Route 2
router.get("/api/chat", (req,res) =>{
    res.send(chats)    
})

router.get('/api/chat:id', (req, res) =>{
    const singlechat = chats.find((x) =>{
        return x._id === req.params.id
    })
    res.send(singlechat);
})

module.exports = router;