const express = require("express");
const User = require("../models/usermodel");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const dotenv = require("dotenv")
const protect = require("../middleware/protect");
const { body, validationResult } = require("express-validator");

const router = express.Router()
dotenv.config();

let jwt_secret = process.env.JWT_SECRET;


//===========creating a user==========

router.post("/createuser",
      [
        body("name", "Enter a valid name").isLength({ min: 3} ),
        body("email", "Enter a valid email").isEmail(),
        body("password", "Password must be atleast 5 characters").isLength({
         min: 5,
         }),
      ],
      
      async (req, res) => {
        let success = false;

        //checking errors and returnng them
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ success, errors: errors.array() });
        }
        
        // check whether the user with this email exists already
        try {
          let user = await User.findOne({ email: req.body.email });
          if (user) {
            return res
              .status(400)
              .json({ success, error: "user with this email already exists" });
          }

          const salt = await bcrypt.genSalt(10);
          const secPass = await bcrypt.hash(req.body.password, salt);
    
    
           //create a user          
           user = await User.create({
            name: req.body.name,
            password: secPass,
            email: req.body.email,
            pic: req.body.pic,
          });
       

          const data = {
            user: {
              id: user.id,
            },
          };
    
    
          const authtoken = jwt.sign(data, jwt_secret, {
            expiresIn: "30d"
          });
    
          success = true;
          // res.json({ success, authtoken });
          res.status(201).send({ success,
             authtoken,
             _id: user._id,
             name: user.name,
             pic: user.pic,
             email: user.email,
            });
          
        } catch (error) {
          console.error(error.message);
          res.status(500).send("Internal server error");
        }
      }
    );

    //========= Login=======

router.post('/login',

[
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password can not be blank").exists(),
  ],
  async (req, res) => {
    let success = false;
    
    //checking errors and returnng them
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ success, error: "Invalid email or password" });
      }

      const passwordcompare = await bcrypt.compare(password, user.password);
      if (!passwordcompare) {
        return res
          .status(400)
          .json({ success, error: "Invalid email or password" });
      }

      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, jwt_secret);
      success = true;
      res.json({ success,
        authtoken,
        _id: user._id,
         name: user.name,
          pic: user.pic,
          email: user.email,
       });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error");
    }
  }

)


//==========get all users ========

  router.get("/allusers", protect, async (req, res) =>{


      
     const keyword = req.query.search? 
       
       {
      $or: [
              { name: { $regex: req.query.search, $options: "i"} },
              { email: { $regex: req.query.search, $options: "i"} },
            ],
      }
      : {};
         
      
       const users = await User.find(keyword).find({_id:{$ne:req.user._id}});

        res.send(users);
  })

module.exports = router;