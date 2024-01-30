const express = require('express');
const router = express.Router();

const {authenticateUser, authorizePermissions} = require('../middleware/authentication')


const {
    uploadUserImg,
    uploadOrfImg,
    uploadCoverImg,
    updateUserImage,
    updateOrfImage,
    updateCoverImage
} = require('../controllers/userImageController')


router.route('/uploadUserImg').post(authenticateUser, uploadUserImg)
router.route('/uploadOrfImg').post(authenticateUser, uploadOrfImg)
router.route('/uploadCoverImg').post(authenticateUser, uploadCoverImg)


router.route('/updateUserImage/:id').post(authenticateUser, updateUserImage)
router.route('/updateOrfImage/:id').post(authenticateUser, updateOrfImage)
router.route('/updateCoverImage/:id').post(authenticateUser, updateCoverImage)

module.exports = router