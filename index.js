const express = require("express");
const dotenv = require("dotenv")
const userrouter = require("./routes/userrouter");
const chatrouter = require("./routes/chatrouts")
const router = require("./router")
const cors = require("cors");
const connectToMongo = require("./db");
const notfound = require("./errors")


const app = express();
  dotenv.config();

  connectToMongo();
  app.use(cors())
  app.use(express.json());

app.use("/api/user", userrouter);
app.use("/api/chat", chatrouter);
app.use("/api/message", require("./routes/messagerout") );
app.use(router)

// DEPLOYMENT__________=======

// const __dirname1 = path.resolve();

// if(process.env.NODE_ENV === "PRODUCTION"){
     
//   app.use(express.static(path.join(__dirname1, '/frontend/build')))

//   app.get('*', (req,res) =>{
//     res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
//   });

// }else{
//   app.get("/", (req, res) =>{
//     res.send("running successfully");
//   })
// }

app.use(notfound);


const PORT = process.env.PORT;


const server = app.listen(PORT, ()=>{
    console.log(`server has started on port ${PORT}`)
})


const io = require("socket.io")(server, {
  pingTimeout: 60000,
   cors: {
    origin: process.env.ORIGIN,
   },
});

io.on("connection", (socket) => {
   console.log("connected to socket.io");

   socket.on("setup", (userData) =>{
    socket.join(userData._id);
    socket.emit("connected");
   });

   socket.on("join chat", (room) =>{
    socket.join(room);
    console.log("user joined " + room)
   })

   socket.on("typing", (room) => socket.in(room).emit("typing"));
   socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

   socket.on("new message", (newmessagereceived) =>{
    let chat = newmessagereceived.chat;

    if(!chat.users) return console.log("no users")

    chat.users.forEach( (user) =>{
      if(user._id === newmessagereceived.sender._id) return;

      socket.broadcast.emit("message received", newmessagereceived)})
   });

   socket.off("setup", () =>{
    console.log("disconnected");
    socket.leave(userData._id)
   })
});

