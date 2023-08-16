const jwt = require("jsonwebtoken");
const User = require("../models/usermodel");


const protect = async (req, res, next) =>{

    let token;

    if(
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {

        try {
            token = req.headers.authorization.split(" ")[1];
            //decode token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            req.user = await User.findById(decoded.user.id).select("-password");

            next();
        } catch (error) {
            console.log(error);
            res.status(401).send({ error: "Invalid token" });
        }
    }

    if(!token){
        res.status(401).send({ error: "Invalid token" });
    }
}

module.exports = protect;  