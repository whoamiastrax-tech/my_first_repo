

 
const mongoose = require('mongoose'); 

const postSchema = new mongoose.Schema({

    content:String,
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    date:{
        type:Date,
        default:Date.now(),
    },

    likes:[

        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user"
        }
    ],
 
        
})


const postModel= mongoose.model("post", postSchema);

module.exports= postModel;
