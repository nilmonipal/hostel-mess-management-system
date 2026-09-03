import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import user_model from "../models/user.models.js";

dotenv.config();

export const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.headers["x-access-token"];
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded._id || decoded.userId;
    const user = await user_model.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token.", error: error.message });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user?.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied. Admins only." });
};



