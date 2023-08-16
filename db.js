const mongoose = require("mongoose")


const connectToMongo = async () =>{

    try {
        const connect =  await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
         });

        console.log(`connected to mongo`);

    } catch (error) {
        console.log("Error connecting to mongodb", error);
    }
}

module.exports = connectToMongo;