const Review = require('../models/reviewModel')
const Product = require('../models/productModel')
const User = require('../models/usersModel')
const {Notification, OrderNotification, AdminNotification} = require('../models/notificationModel')
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const cloudinary = require('cloudinary').v2;
const fs = require('fs')
const { checkPermissions } = require('../utils');
// const { request } = require('http');

const createReview = async(req, res) =>{
    const {product:productId, rating, comment, review_image} = req.body

    const isValidProduct = await Product.findOne({_id:productId})
    if(!isValidProduct){
        throw new CustomError.NotFoundError(`No product wth id ${productId}`)
    }

    
    const user = await User.findById(req.user.userId);

    if (!user) {
        throw new CustomError.NotFoundError('Admin not found')
    }
 

    const alreadySubmitted = await Review.findOne({
        product: productId,
        user: req.user.userId
    })

    if(alreadySubmitted){
        throw new CustomError.BadRequestError('Review already submitted')
    }

    req.body.user = req.user.userId

    const review = await Review.create({
        rating,
        comment,
        review_image,
        reviewBy: user.full_name,
        profile_image: user.profile_image,
        college_dept: user.college_dept,
        product: productId,
        user: req.user.userId

    })

    const adminReviewNotification = await AdminNotification.create({
        title: `${user.full_name} rate product ${isValidProduct.prod_name}`,
        message: `${user.full_name} give ${rating} rating/s`,
        profile: `${user.profile_image}`,
        category: 'review',
        product_id: isValidProduct._id,
        userId: user,
    });
    
    
    const adminReviewNotifications = await AdminNotification.find({}).sort({ createdAt: -1 });

    io.emit('createReview', {adminReviewNotifications});


    res.status(StatusCodes.CREATED).json({msg: 'Create Review', review, adminReviewNotification})
}


const getAllReviews = async(req, res) => {
    const reviews = await Review.find({})
    res.status(StatusCodes.OK).json({msg: 'get all reviews', reviews, count:reviews.length})
}




const getSingleReview = async(req, res) => {
    const review = await Review.findById(req.params.id)
    if(!review){
        throw CustomError.NotFoundError(`Review Not Found for ${review}`)
    }
    res.status(StatusCodes.OK).json({msg: 'get single reviews', review})
}


const updateReview = async(req, res) => {

    const review = await Review.findById(req.params.id)

    if(!review){
        throw CustomError.NotFoundError(`Review Not Found for ${review}`)
    }

    checkPermissions(req.user, review.user);

    const updateReview = await Review.findByIdAndUpdate(
        req.params.id,
        req.body,
        {new:true}
    )


    res.status(StatusCodes.OK).json({msg: 'update review', updateReview})
}


// const deleteReview = async(req, res) => {
//     // const review = await Review.findById(req.params.id)

//     // if(!review){
//     //     throw CustomError.NotFoundError(`Review Not Found for ${review}`)
//     // }
//     const {id:reviewId} = req.params

//     const review = await Review.findOne({_id:reviewId})
//     if(!review){
//         throw new CustomError.NotFoundError(`No review with id ${reviewId}`)
//     }
    
//       // Ensure req.userId is defined and has a 'role' property
//       if (!req.userId || !req.userId.role) {
//         throw new CustomError.UnauthorizedError('Invalid user information');
//       }
   

//     checkPermissions(req.user, review.user);

//     try {
//         if(review.review_image){
//             const publicId = review.review_image.match(/\/v\d+\/(.+?)\./)[1];
//             await cloudinary.uploader.destroy(publicId);
//         }
//     } catch (error) {
//         console.error("Error deleting image from Cloudinary:", error);
//     }

   
//     await review.deleteOne()
//     // await Review.deleteOne({_id: review})

//     res.status(StatusCodes.OK).json({msg: 'delete review', review})
// }




const deleteReview = async(req, res) => {
    const {id:reviewId} = req.params

    const review = await Review.findOne({_id:reviewId})
    if(!review){
        throw new CustomError.NotFoundError(`No review with id ${reviewId}`)
    }

    
    try {
        if(review.review_image){
            const publicId = review.review_image.match(/\/v\d+\/(.+?)\./)[1];
            await cloudinary.uploader.destroy(publicId);
        }
    } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
    }
    
    checkPermissions(req.user, review.user)
    
    await review.deleteOne()
    res.status(StatusCodes.OK).json({msg: 'Delete Review'})
}


const getSingleProductReview = async(req, res) => {
    const {id:productId} = req.params
    const review = await Review.findOne({product:productId})
    res.status(StatusCodes.OK).json({msg: 'get single product review', review, count:review.length})
}


const uploadReviewImage = async(req, res) => {
    if (!req.files || !req.files.review_image) {
        return res.status(StatusCodes.OK).json({ message: 'review without image' });
    }

    const result = await cloudinary.uploader.upload(req.files.review_image.tempFilePath, {
        use_filename:true,
        folder:'review-image-folder'
    })

    fs.unlinkSync(req.files.review_image.tempFilePath)

    return res.status(StatusCodes.OK).json({image:{src:result.secure_url}})
}


const updateReviewImage = async (req, res) => {
  
    const review = await Review.findById(req.params.id);

    if (!review) {
        throw new CustomError.NotFoundError('No review found')
    }

    try {
        if (review.review_image) {
            const publicId = review.review_image.match(/\/v\d+\/(.+?)\./)[1];
            await cloudinary.uploader.destroy(publicId);
        }
    } catch (error) {
        console.error("Error deleting existing image from Cloudinary:", error);
    }

    if (!req.files || !req.files.review_image) {
        return res.status(StatusCodes.OK).json({ message: 'review without image' });
    }

    const result = await cloudinary.uploader.upload(req.files.review_image.tempFilePath, {
        use_filename: true,
        folder: 'review-image-folder'
    });


    fs.unlinkSync(req.files.review_image.tempFilePath);

    return res.status(StatusCodes.OK).json({ image: { src: result.secure_url } });
}



module.exports = {
    createReview,
    getAllReviews,
    getSingleReview,
    updateReview,
    deleteReview,
    getSingleProductReview,
    uploadReviewImage,
    updateReviewImage
}
