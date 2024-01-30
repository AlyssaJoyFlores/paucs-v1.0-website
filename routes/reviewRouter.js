const express = require('express')
const router = express.Router()

const {authenticateUser} = require('../middleware/authentication')


const {
    createReview,
    getAllReviews,
    getSingleReview,
    updateReview,
    deleteReview,
    uploadReviewImage,
    updateReviewImage
} = require('../controllers/ReviewController')


router.route('/createReview').post(authenticateUser, createReview)
router.route('/getAllReviews').get(getAllReviews)
router.route('/uploadReviewImage').post(authenticateUser, uploadReviewImage)

router.route('/updateReviewImage/:id').post(authenticateUser, updateReviewImage)
router.route('/getSingleReview/:id').get(authenticateUser, getSingleReview)
router.route('/updateReview/:id').patch(authenticateUser, updateReview)
router.route('/deleteReview/:id').delete(authenticateUser, deleteReview)


module.exports = router