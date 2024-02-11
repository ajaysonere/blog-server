import mongoose from "mongoose";

const connection = async() => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL);
        
        if(!conn){
           console.log("Error occured while connecting to database");
        }
        console.log("Database connected");
    } catch (error) {
        console.log(error);
    }
}

export default connection;