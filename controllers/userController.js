import { User } from "../models/userModel.js";
import HttpError from "../models/errorModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { v4 as uuid } from "uuid";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============== Register User ===============

// Path = /api/users/register

export const registerUser = async (req, res, next) => {

  try {
  
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return next(new HttpError(`Please Fill all the fileds`, 422));
    }

    const newEmail = email.toLowerCase();

    const emailExist = await User.findOne({ email: newEmail });

    if (emailExist) {
      return next(new HttpError(`User already exist`, 422));
    }

    const trimedPassword = password.trim();

    if (trimedPassword.length < 6) {
      return next(
        new HttpError(`Password must be at least 6 characters `, 422)
      );
    }

    if (password != confirmPassword) {
      return next(
        new HttpError(`password and confirm password are not same`, 422)
      );
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(trimedPassword, salt);

    const newUser = await User.create({
      name,
      email: newEmail,
      password: hashedPassword,
    });

    res.status(201).json(`New user ${newUser.email} registered`);
  } catch (error) {
    return next(new HttpError(`Error while registering User`, 500));
  }
};

// ============== Login User ===============

// Path = /api/users/login

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = await req.body;

    if (!email || !password) {
      return next(new HttpError(`Please fill all the fields `, 422));
    }

    const existingUser = await User.findOne({ email });

    if (existingUser == null) {
      return next(new HttpError(`User does not exist`, 422));
    }

    const comparePassword = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!comparePassword) {
      return next(new HttpError(`email or password is incorrect`, 422));
    }

    const token = jwt.sign(
      { id: existingUser.id, name: existingUser.name },
      process.env.JWT_KEY,
      { expiresIn: "5d" }
    );

    res.status(200).json({id :existingUser._id , name: existingUser.name , token});
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ============== get User ===============

// Path = /api/users/:id

export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return next(new HttpError(`User not found`, 404));
    }

    res.status(200).json(user);
  } catch (error) {
    return next(new HttpError(`Failed to get user`, 500));
  }
};

// ============== Change Avatar User ===============

// Path = /api/users/change-avatar

export const changeAvatar = async (req, res, next) => {

  try {
     
    if (!req.files.avatar) {
      return next(new HttpError("Please choose an image", 422));
    }

    // find user from database

    const user = await User.findById(req.user.id);
    // delete the file if already present
    if (user.avatar) {
      fs.unlink(path.join(__dirname, "..", "uploads", user.avatar), (err) => {
        if (err) {
          return next(new HttpError(err));
        }
      });
    }

    // add new file

    const { avatar } = req.files;

    if (avatar.size > 500000) {
      return next(
        new HttpError(
          `Files size is too big. File size must be less then 500kb`
        ), 422
      );
    }
    
   let fileName;
   
   fileName = avatar.name;
    
   let splitedFileName = fileName.split(".");
   
   let newFileName = splitedFileName[0] + uuid() + "." + splitedFileName[splitedFileName.length - 1];
   
  //  save the file
  
  avatar.mv(path.join(__dirname , ".." , "uploads" , newFileName) ,async (err) => {
      if(err){
         return next(new HttpError(err));
      }
      
      const updateAvatar = await User.findByIdAndUpdate(req.user.id , {avatar: newFileName} , {new: true});
      
      if(!updateAvatar) {
         return next(new HttpError(err));
      }
      
      res.status(200).json(updateAvatar);
  })
    
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ============== Edit User details ===============

// Path = /api/users/edit-user

export const editUser = async(req, res , next) => {
    try {
       const {name , email , currentPassword , newPassword , confirmPassword} = req.body;
       
       if(!name || !email || !currentPassword || !newPassword){
          return next(new HttpError(`Fill in all fields`, 422));
       }
       
       //get user from database
       
       const user = await User.findById(req.user.id);
       
       if(!user){
          return next(new HttpError(`User not found ` , 404));
       }
       
      const emailExist = User.findOne({email});
      
      if(emailExist && (emailExist._id != req.user.id)){
         return next(new HttpError(`Email ready exist` , 422))
      }
      
      // validate current password to db
      
      const validatePassword = await bcrypt.compare(currentPassword , user.password);
      
      if(!validatePassword){
         return next(new HttpError(`Invalid Current Password`, 422));
      }
      
      // compare password
      
      if(newPassword !== confirmPassword){
          return next(new HttpError(`New password did not match` , 422));
      }
      
      // hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword , salt);
      
      const newInfo = await User.findByIdAndUpdate(req.user.id , {name, email, password: hashedPassword}, {new: true});
      
      res.status(200).json({success : true , data : newInfo});
      
    } catch (error) {
      return next(new HttpError(error));
    }
};

// ============== Get User/ Authours ===============

// Path = /api/users/authors

export const getAuthors = async (req, res, next) => {
  try {
    const authors = await User.find({}).select("-password");

    if (!authors) {
      return next(new HttpError(`author not present`, 422));
    }

    res.status(200).json(authors);
  } catch (error) {
    return next(new HttpError(`Failed to get Authors`, 500));
  }
};
