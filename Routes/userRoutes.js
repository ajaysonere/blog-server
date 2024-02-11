import express from "express";
import { changeAvatar, editUser, getAuthors, getUser, loginUser, registerUser } from "../controllers/userController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const userRouter = express.Router();

userRouter.post("/register" , registerUser );
userRouter.post("/login" , loginUser);
userRouter.get("/authors" , getAuthors);
userRouter.get("/:id" , getUser);
userRouter.post("/change-avatar" , authMiddleware , changeAvatar);
userRouter.patch("/edit-user" ,authMiddleware , editUser);

export default userRouter;