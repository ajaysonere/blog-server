import jwt from 'jsonwebtoken';
import HttpError from '../models/errorModel.js';

const authMiddleware = (req , res , next) => {
    try {
      const Authorization = req.headers.Authorization || req.headers.authorization;
      
      if(Authorization &&  Authorization.startsWith('Bearer')){
         const token  = Authorization.split(" ")[1];
         jwt.verify(token , process.env.JWT_KEY , (err , info) => {
            if(err) {
               return next(new HttpError("Unauthorized error" , 403));
            }
            req.user = info;
            next();
         })
      }
      
    } catch(error){
       return next(new HttpError(`Authorization failed` , 422));
    }
}

export default authMiddleware;