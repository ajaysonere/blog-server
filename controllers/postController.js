import path , {dirname} from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {v4 as uuid} from 'uuid';
import { Post } from '../models/postModel.js';
import { User } from '../models/userModel.js';
import HttpError from '../models/errorModel.js';



const __dirname = dirname(fileURLToPath(import.meta.url));

// ===============  create post ==============
// path  /api/posts

export const createPost = async(req , res , next) => {
    try {
        const {title , description , category } = req.body;
        
        if(!title  || !description || !category || !req.files) {
           return next(new HttpError('Fill all the fields' , 422));
        }
        
        const {thumbnail} = req.files;
        
        if(thumbnail.size > 2000000) {
           return next(new HttpError(`File size is too big , image must be less the 2MB`, 422));
        }
        
        let fileName = thumbnail.name;
        let splitedFileName = fileName.split(".");
        let newFileName = splitedFileName[0] + uuid() + "." + splitedFileName[splitedFileName.length-1];
        
        thumbnail.mv(path.join(__dirname , ".." , "uploads" , newFileName) ,async (err) => {
           if(err){
               return next(new HttpError(err));
           }else {
           
              const newPost = await Post.create({title , category , description , thumbnail : newFileName , creator : req.user.id});
              
              if(!newPost) {
                 return next(new HttpError("Post could not created" , 422));
              }
              
              // find user to increase the post counter
              
              const currentUser = await User.findById(req.user.id);
              
              if(!currentUser){
                 return next(new HttpError("user not found" , 422));
              }
              
              const postCount = currentUser.posts + 1;
              await User.findByIdAndUpdate(req.user.id , {posts: postCount});
              
              res.status(201).json({success: true, data: newPost});  
           }
        })
        
    } catch (error) {
        return next(new HttpError('Failed to create post' , 422));
    }
}



// =============== get single post ==============
// get  /api/posts/:id

export const getPost = async(req , res , next) => {
    try {
        const postId = req.params.id;
        
        const post  = await Post.findById(postId);
        
        if(!post){
           return next(new HttpError(`post not found` , 404));
        }
        res.status(200).json(post);
    } catch (error) {
        return next(new HttpError(`Failed to get post` , 500))
    }
} 


// ===============  get all post ==============
// get  /api/posts

export const getAllPost = async(req , res , next) => {
    try {
        const allPost = await Post.find({}).sort({updatedAt : -1});
        if( !allPost){
           return next(new HttpError('No posts found'),422);
        }
        
        res.status(200).json(allPost);
    } catch (error) {
        return next(new HttpError(`Failed to get all posts` , 500));
    }
}


// ===============  get posts by categories ==============
// get  /api/posts/categories/:category

export const getCategoryPosts = async(req , res , next) => {
    try {
        const {category} = req.params;
        const postsByCategories = await Post.find({category}).sort({createdAt: -1});
        res.status(200).json(postsByCategories);
    } catch (error) {
        return next(new HttpError(`Falied to get posts by category` , 422));
    }
}


// ===============  get authors post ==============
// path  /api/posts/users/:id

export const getUsersPosts = async(req , res , next) => {
    try {
        const {id} = req.params;
        const posts = await Post.find({creator:id}).sort({createdAt: -1});
        res.status(200).json(posts);
    } catch (error) {
        return next(new HttpError('failed to get user posts' , 500));
    }
}


// ===============  edit post ==============
// patch  /api/posts/:id

export const editPost = async(req , res , next) => {

    try {
    
        let fileName;
        let newFileName;
        let updatedPost;
        const postId = req.params.id;
        let {title , description , category} = req.body;
        
        if(!title || !category || description.length < 12){
            return next(new HttpError("Fill in all Fileds" , 422));
        }
        
        const oldPost = await Post.findById(postId);
        
        if(req.user.id == oldPost.creator){
           if (!req.files) {
             updatedPost = await Post.findByIdAndUpdate(
               postId,
               { title, category, description },
               { new: true }
             );
           } else {
             // delete old thumbnail
             fs.unlink(
               path.join(__dirname, "..", "uploads", oldPost.thumbnail),
               async (err) => {
                 if (err) {
                   return next(new HttpError(err));
                 }
               }
             );

             const { thumbnail } = req.files;

             if (thumbnail.size > 2000000) {
               return next(
                 new HttpError(
                   `Image size is too big, should be less then 2MB`,
                   422
                 )
               );
             }

             fileName = thumbnail.name;
             const splitedFileName = fileName.split(".");
             newFileName =
               splitedFileName[0] +
               uuid() +
               "." +
               splitedFileName[splitedFileName.length - 1];

             thumbnail.mv(
               path.join(__dirname, "..", "uploads", newFileName),
               async (err) => {
                 if (err) {
                   return next(new HttpError(err));
                 }
               }
             );

             updatedPost = await Post.findByIdAndUpdate(
               postId,
               { title, category, description, thumbnail: newFileName },
               { new: true }
             );
           }
        }
        
         if (!updatedPost) {
           return next(new HttpError(`Cloud not update the post`, 422));
         }

         res.status(200).json(updatedPost);
        
    } catch (error) {
        return next(new HttpError(error));
    }
}


// ===============  post ==============
// delete  /api/posts/:id

export const deletePost = async(req , res , next) => {
    try {
        const postId = req.params.id;
        
        if(!postId){
           return next(new HttpError("Post id not found" , 422));
        }
        
        const post = await Post.findById(postId);
        const fileName = post?.thumbnail;
        
        // delete the thumbnail
        
        if(req.user.id == post.creator){
        
            fs.unlink(
              path.join(__dirname, "..", "uploads", fileName),
              async (err) => {
                if (err) {
                  return next(new HttpError(err));
                } else {
                  await Post.findByIdAndDelete(postId);
                  // decrease the count
                  const currentUser = await User.findById(req.user.id);

                  const countPost = currentUser?.posts - 1;

                  await User.findByIdAndUpdate(req.user.id, {
                    posts: countPost,
                  });
                }
              }
            );
        }else{
           return next(
             new HttpError("You don't have access to delete this post", 422)
           );
        }
        res.status(200).json({success : true});
        
    } catch (error) {
        return next(new HttpError("failed to delete post" , 500));
    }
}






