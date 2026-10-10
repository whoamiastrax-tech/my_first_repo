



 
const mongoose = require('mongoose'); 

const userSchema = new mongoose.Schema({

       name:String,
       username:String,
       age:Number,
       email:String,
       password:String,
       pic:{
        type:String,
        default:"images.jpeg"

       },
       posts:[

            {
                type: mongoose.Schema.Types.ObjectId ,
                ref: "post"
            }

       ]
       ,

       msgSection:[

                  {
                    type:mongoose.Schema.Types.ObjectId,
                    ref:"msg"

                  }
                
       ]
 
        
})


const userModel= mongoose.model("user", userSchema);

module.exports= userModel;
