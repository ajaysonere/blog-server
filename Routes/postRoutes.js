import express from 'express';
import { createPost, deletePost, editPost, getAllPost, getCategoryPosts, getPost, getUsersPosts } from '../controllers/postController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const postRouter = express.Router();

postRouter.post("/", authMiddleware, createPost);
postRouter.get("/:id" , getPost);
postRouter.get("/" , getAllPost);
postRouter.get("/categories/:category" , getCategoryPosts);
postRouter.get("/users/:id" , getUsersPosts);
postRouter.patch("/:id", authMiddleware, editPost);
postRouter.delete("/:id", authMiddleware, deletePost);

export default postRouter;