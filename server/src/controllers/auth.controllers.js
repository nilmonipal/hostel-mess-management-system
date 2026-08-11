import user_model from '../models/user.models.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function registerUser(req, res) {

    const { username, email, password , phone } = req.body;
    try{
        if(!username || !email || !password || !phone){
            return res.status(400).json({message:"All fields are required"});
        }

        const existingUser = await user_model.findOne({ $or: [{ email }, { username }, { phone }] });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email, username or phone already exists" });
        }
        //email must be valid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }
        //phone number must be valid
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ message: "Invalid phone number format" });
        }
        const newUser = {
            username: username,
            email: email,
            password: bcrypt.hashSync(password, 10), // Hash the password before saving
            phone: phone
        };

      const user =  await user_model.create(newUser);
      return res.status(201).json({ message: "User registered successfully", user });

    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


export async function loginUser(req, res) {
    const { phone, password } = req.body;
    try{

        const user = await user_model.findOne({ phone: phone });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const ispasswordValid = bcrypt.compareSync(password, user.password);
        if (!ispasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = jwt.sign({ userId: user.userId, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return res.status(200).json({ 
            message: "Login successful",
            "Token" : token, 
            User:{
            "username":user.username,
            "email":user.email,
            "phone":user.phone,
            "role":user.role
             
    }});

    //refresh token can be implemented here if needed
    



    }catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

