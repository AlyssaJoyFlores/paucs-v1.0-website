// const jwt = require('jsonwebtoken');


// const createJWT = ({ payload }) => {
//     const token = jwt.sign(payload, process.env.JWT_SECRET);
//     return token;
// };


// const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET)



// const attachedCookiesToResponse = ({res, user, refreshToken}) => {
//     const accessTokenJWT = createJWT({ payload: {user} });
//     const refreshTokenJWT = createJWT({ payload: {user, refreshToken} });

//     const oneDay = 1000 * 60 * 60 * 24;
//     const longerDays = 1000 * 60 * 60 * 24 * 30; //30 days

//     res.cookie('accessToken', accessTokenJWT, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         signed: true,
//         expires: new Date(Date.now() + oneDay),
//     });

//     res.cookie('refreshToken', refreshTokenJWT, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         signed: true,
//         expires: new Date(Date.now() + longerDays),
//     });
// }

// module.exports = {
//     createJWT,
//     isTokenValid,
//     attachedCookiesToResponse
// }


const jwt = require('jsonwebtoken');

const createJWT = ({ payload }) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    return token;
};

const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET);

const attachedCookiesToResponse = ({ res, user, refreshToken }) => {
    const accessTokenJWT = createJWT({ payload: { user } });
    const refreshTokenJWT = createJWT({ payload: { user, refreshToken } });

    const oneDay = 1000 * 60 * 60 * 5; //5 hrs
    const longerDays = 1000 * 60 * 60 * 24; // 1 day
    // const longerDays = 1000 * 60 * 60 * 24 * 30; // 30 days

    res.cookie('accessToken', accessTokenJWT, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        signed: true,
        expires: new Date(Date.now() + oneDay),
    });

    res.cookie('refreshToken', refreshTokenJWT, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        signed: true,
        expires: new Date(Date.now() + longerDays),
    });
};

const getUserFromToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.user;
    } catch (error) {
        // Handle invalid token or other errors
        console.error('Error decoding token:', error);
        return null;
    }
};

module.exports = {
    createJWT,
    isTokenValid,
    attachedCookiesToResponse,
    getUserFromToken,
};



//===========================

// const attachedCookiesToResponse = ({ res, user }) => {
//   const token = createJWT({ payload: user });

//   const oneDay = 1000 * 60 * 60 * 24;

//   res.cookie('token', token, {
//     httpOnly: true,
//     expires: new Date(Date.now() + oneDay),
//     secure: process.env.NODE_ENV === 'production',
//     signed: true,
//   });
// };


//============================================================================

// const jwt = require('jsonwebtoken');

// const createJWT = ({ payload }) => {
//     const token = jwt.sign(payload, process.env.JWT_SECRET);
//     return token;
// };

// const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET);

// const attachedCookiesToResponse = ({ res, user, refreshToken }) => {
//     const accessTokenJWT = createJWT({ payload: { user } });
//     const refreshTokenJWT = createJWT({ payload: { user, refreshToken } });

//     const oneDay = 1000 * 60 * 60 * 24;
//     const longerDays = 1000 * 60 * 60 * 24 * 30; // 30 days

//     // Attach cookies to the response
//     res.cookie('accessToken', accessTokenJWT, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         signed: true,
//         expires: new Date(Date.now() + oneDay),
//     });

//     res.cookie('refreshToken', refreshTokenJWT, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         signed: true,
//         expires: new Date(Date.now() + longerDays),
//     });

//     // Decode the access token and include it in the response
//     try {
//         const decodedAccessToken = isTokenValid(accessTokenJWT);
//         res.json({ success: true, message: 'Cookies attached successfully', decodedAccessToken });
//     } catch (error) {
//         // Handle token verification failure
//         res.status(500).json({ success: false, message: 'Failed to attach cookies' });
//     }
// };


// module.exports = {
//     createJWT,
//     isTokenValid,
//     attachedCookiesToResponse
// }


//=========================================
