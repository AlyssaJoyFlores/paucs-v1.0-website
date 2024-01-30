const User = require('../models/usersModel')
const cloudinary = require('cloudinary').v2;
const fs = require('fs')
const CustomError = require('../errors')
const {StatusCodes} = require('http-status-codes')
const { attachedCookiesToResponse, createTokenUser, checkPermissions} = require('../utils')

const getAllUsers = async(req, res) => {
    const users = await User.find({role: 'student'}).select('-password')
    //({role: 'student'})
    res.status(StatusCodes.OK).json({users})
}



const getSingleUser = async(req, res) => {
    const user = await User.findOne({_id: req.params.id }).select('-password')
    if (!user) {
        throw new CustomError.NotFoundError(`No user with id : ${req.params.id}`);
      }
      checkPermissions(req.user, user._id);
    res.status(StatusCodes.OK).json({msg: 'get single user', user})
}


const showCurrentUser = async(req, res) => {
  // req.user.role = [req.user.role];
  console.log(req.user)
  // res.status(StatusCodes.OK).json({user: req.user});
  res.status(StatusCodes.OK).json(req.user);
}


// const showCurrentUser = async(req, res) => {
//   const  userId = req.params.id;
//     // Check if an 'id' parameter is present in the request
   
//     const user = await User.findOne({ _id: userId }).select('-password');

//         if (!user) {
//             throw new CustomError.NotFoundError(`No user with id : ${userId}`);
//         }

//         res.status(StatusCodes.OK).json({ user });
// }


// const updateUser = async(req, res) => {
//     const {
//         school_campus,
//         college_dept,
//         full_name,
//         course,
//         year,
//         section,
//         gender,
//         birthdate,
//         address,
//         orf_image,
//         profile_image
//     } = req.body

//     // if(!orf_image){
//     //     throw new CustomError.BadRequestError('Please Provide Your ORF')
//     // }


//     const user = await User.findOne({_id: req.user.userId})
//     if(!user){
//         throw new CustomError.NotFoundError('User not found')
//     }

//     user.school_campus = school_campus
//     user.college_dept = college_dept
//     user.full_name = full_name
//     user.course = course
//     user.year = year
//     user.section = section
//     user.gender = gender
//     user.birthdate = birthdate
//     user.address = address
//     user.orf_image = orf_image
//     user.profile_image = profile_image
//     user.save()

//     const tokenUser = createTokenUser(user)
//     attachedCookiesToResponse({res, user:tokenUser})

//     res.status(StatusCodes.OK).json({msg: 'update user', user:tokenUser, user})
// }


//update user with findOneAndUpdate
// const updateUser = async (req, res) => {
//     const {
//         school_campus,
//         college_dept,
//         full_name,
//         course,
//         year,
//         section,
//         gender,
//         birthdate,
//         address,
//         orf_image,
//         profile_image,
//         cover_image
//     } = req.body

// //   if (!school_campus || !college_dept) {
// //     throw new CustomError.BadRequestError('Please provide all values');
// //   }

//   const user = await User.findOneAndUpdate(
//     { _id: req.user.userId },
//     {  school_campus,
//         college_dept,
//         full_name,
//         course,
//         year,
//         section,
//         gender,
//         birthdate,
//         address,
//         orf_image,
//         profile_image,
//         cover_image },
//     { new: true, runValidators: true }
//   );

//   if(!user){
//     throw new CustomError.NotFoundError('User')
//   }
//   const tokenUser = createTokenUser(user);
//   attachedCookiesToResponse({ res, user: tokenUser });
//   res.status(StatusCodes.OK).json({ user: tokenUser });
// };



const updateUser = async (req, res) => {
 const user = await User.findById(req.params.id)

  if(!user){
    throw new CustomError.NotFoundError(`User not found for id ${user}`)
  }

  const updateUser = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    {new:true}
  )

  const tokenUser = createTokenUser(updateUser);
  attachedCookiesToResponse({ res, user: tokenUser });

  res.status(StatusCodes.OK).json({ user: tokenUser });
};







const updateUserPassword = async(req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      throw new CustomError.BadRequestError('Please provide both values');
    }
    const user = await User.findOne({ _id: req.user.userId });
  
    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
      throw new CustomError.UnauthenticatedError('Invalid Credentials');
    }
    user.password = newPassword;
  
    await user.save();
    res.status(StatusCodes.OK).json({ msg: 'Success! Password Updated.' });
}

const verifiedOrf = async(req, res) => {
  const user = await User.findById(req.params.id)

  if(!user){
    throw new CustomError.NotFoundError(`User not found for id ${user}`)
  }

  if(user.year === '1ST YR'){
    await User.findByIdAndUpdate(
      req.params.id,
      {freeUnifStatus: 'freeUnif'},
      {new:true}
    )
  }

  const updateUser = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    {new:true}
  )


  const tokenUser = createTokenUser(updateUser);
  attachedCookiesToResponse({ res, user: tokenUser });

  res.status(StatusCodes.OK).json({ user: tokenUser });
}



module.exports = {
    getAllUsers,
    getSingleUser,
    showCurrentUser,
    updateUser,
    updateUserPassword,
    verifiedOrf
}


