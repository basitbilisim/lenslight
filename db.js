import mongoose from "mongoose";

const conn = () => {
    mongoose.connect(process.env.DB_URL,{
        dbName:"lenslight_tr",
        useNewUrlParser:true,
        useUnifiedTopology:true
    }).then(() => {
        console.log('Connected DB')
    }).catch(err => {
        console.log('DB Connection Error is:' + err) 
    })
}

export default conn;