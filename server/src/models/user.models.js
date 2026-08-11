import mongoose, { model } from 'mongoose';
const { Schema } = mongoose;

const userSchema = new Schema({

username:{
        type:String,
        required:true,
        unique :true,
        lowercase:true,
        trim :true,
        index:true
    },
phone:{
    type:String,
    required:true,
    unique:true,
    trim:true
},

email :{
        type:String,
        required:true,
        unique :true,
        lowercase:true,
        trim :true,
    },
password :{
        type:String,
        required:[true,"Password is required"]
    },
role: {
    type: String,
    enum: ['user', 'admin'], // Restricts the value to one of these strings
    default: 'user', // Sets 'user' as the default role if not specified
    required: true
  },
refreshToken :{
        type:String,
    },

},{
    timestamps:true
})



const user_model = model('User', userSchema);
export default user_model;
