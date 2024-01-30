const CustomError = require('../errors');
const { isTokenValid } = require('../utils/jwt');

const authenticateUser = async (req, res, next) => {
  let token;
  // check header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }
  // check cookies
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    console.log("No token found");
    throw new CustomError.UnauthenticatedError('Authentication invalid');
  }
  try {
    const payload = isTokenValid(token);

    // Attach the user and his permissions to the req object
    req.user = {
      userId: payload.user.userId,
      role: payload.user.role,
    };

    next();
  } catch (error) {
    throw new CustomError.UnauthenticatedError('Authentication invalid');
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new CustomError.UnauthorizedError(
        'Unauthorized to access this route'
      );
    }
    next();
  };
};

module.exports = { authenticateUser, authorizeRoles };


// already provided





// const CustomError = require('../errors');
// const { isTokenValid, createTokenUser } = require('../utils/jwt');
// const Token = require('../models/tokenModel');
// const { attachedCookiesToResponse } = require('../utils');

// const authenticateUser = async (req, res, next) => {
//   try {
//     let accessToken = req.cookies.accessToken;
//     let refreshToken = req.cookies.refreshToken;

//     // Check the header for the Bearer token
//     const authHeader = req.headers.authorization;
//     if (authHeader && authHeader.startsWith('Bearer')) {
//       accessToken = authHeader.split(' ')[1];
//     }

//     console.log("Received Token:", accessToken);

//     if (!accessToken && !refreshToken) {
//       console.log("No tokens found", error);
//       throw new CustomError.UnauthenticatedError('Authentication invalid');
//     }

//     // Try to validate the access token
//     if (accessToken) {
//       const payload = isTokenValid(accessToken);
//       req.user = payload.user;
//       console.log("Valid Access Token:", payload);
//       return next();
//     }

//     // If access token is not present, validate the refresh token
//     const payload = isTokenValid(refreshToken);
//     const existingToken = await Token.findOne({
//       user: payload.user.userId,
//       refreshToken: payload.refreshToken,
//     });

//     // If no valid refresh token found, throw an error
//     if (!existingToken || !existingToken.isValid) {
//       throw new CustomError.UnauthenticatedError('Authentication invalid');
//     }

//     // Refresh the access token
//     const newAccessToken = createTokenUser(existingToken.user);

//     // Update the response with the new access token
//     attachedCookiesToResponse({
//       res,
//       user: req.user,
//       refreshToken: existingToken.refreshToken,
//       accessToken: newAccessToken,
//     });

//     req.user = existingToken.user;
//     console.log("Refreshed Access Token:", newAccessToken);
//     next();
//   } catch (error) {
//     console.error("Authentication error:", error);
//     throw new CustomError.UnauthenticatedError('Authentication invalid');
//   }
// };

// const authorizeRoles = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       throw new CustomError.UnauthorizedError('Unauthorized to access this route');
//     }
//     next();
//   };
// };

// module.exports = { authenticateUser, authorizeRoles };
