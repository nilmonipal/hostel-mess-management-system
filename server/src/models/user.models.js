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
name: {
    type: String,
    trim: true,
    default: ""
},
studentId: {
    type: String,
    trim: true,
    default: ""
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
    enum: ['user', 'student', 'admin'],
    default: 'user',
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
