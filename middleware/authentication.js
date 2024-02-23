// check token
//for jwt
//for protected routes

// const CustomError = require('../errors')
// const  {isTokenValid, getUserFromToken } = require('../utils')
// const Token = require('../models/tokenModel');

// const { attachedCookiesToResponse } = require('../utils');

// const authenticateUser = async (req, res, next) => {
//     const { refreshToken, accessToken } = req.signedCookies;
  
//     try {
//         if (accessToken) {
//             const payload = isTokenValid(accessToken);
//             req.user = payload.user;
//             return next();
//         }
//         const payload = isTokenValid(refreshToken);
    
//         const existingToken = await Token.findOne({
//             user: payload.user.userId,
//             refreshToken: payload.refreshToken,
//         });
    
//         if (!existingToken || !existingToken?.isValid) {
//             throw new CustomError.UnauthenticatedError('Authentication Invalid');
//         }
    
//         attachedCookiesToResponse({
//             res,
//             user: payload.user,
//             refreshToken: existingToken.refreshToken,
//         });
    
//         req.user = payload.user;
//         next();
//     } catch (error) {
//         throw new CustomError.UnauthenticatedError('Authentication Invalid');
//     }
// };


// authorize permission for user role - another way if we have admin and superadmin or other users
// const authorizePermissions = (...roles) => {
//     return (req, res, next)=> {
        
//         if(!roles.includes(req.user.role)){
//             throw new CustomError.UnauthorizedError('Unauthorized to access this route')
//         }
//         next()
//     }

// }

//==================================================
const CustomError = require('../errors');
const { isTokenValid, createJWT } = require('../utils'); 
const Token = require('../models/tokenModel');
const { attachedCookiesToResponse, getUserFromToken } = require('../utils'); 

const authenticateUser = async (req, res, next) => {
    const { refreshToken, accessToken } = req.signedCookies;

    try {
        let user;

        if (accessToken) {
           
            user = getUserFromToken(accessToken);
        } else {
            const payload = isTokenValid(refreshToken);

            const existingToken = await Token.findOne({
                user: payload.user.userId,
                refreshToken: payload.refreshToken,
            });

            if (!existingToken || !existingToken?.isValid) {
                throw new CustomError.UnauthenticatedError('Authentication Invalid');
            }

            attachedCookiesToResponse({
                res,
                user: payload.user,
                refreshToken: existingToken.refreshToken,
            });

            user = payload.user;
        }

 
        req.user = user;

        next();
    } catch (error) {
        console.error('Authentication Error:', error);
        throw new CustomError.UnauthenticatedError('Authentication Invalid');
    }
};


const authorizePermissions = (...roles) => {
    return (req, res, next) => {
        const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
        if (!roles.some(role => userRoles.includes(role))) {
            return next(new CustomError.UnauthorizedError('Unauthorized to access this route'));
        }
        next();
    };
};





module.exports = {
    authenticateUser,
    authorizePermissions
}




