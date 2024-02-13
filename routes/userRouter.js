const express = require('express');
const router = express.Router()


//import validation for protected routes
const {authenticateUser, authorizePermissions} = require('../middleware/authentication')
// const {authenticateUser, authorizeRoles} = require('../middleware/full-auth')

const {
    getAllUsers,
    getSingleUser,
    showCurrentUser,
    updateUser,
    updateUserPassword,
    verifiedOrf,
    searchUsers
} = require('../controllers/userController')

router.route('/getAllUsers').get(authenticateUser, getAllUsers)
router.route('/showMe').get(authenticateUser, showCurrentUser)
router.route('/search').get(authenticateUser, searchUsers)

router.route('/updateUserPassword').patch(authenticateUser, updateUserPassword)

router.route('/updateUser/:id').patch(authenticateUser, updateUser)
router.route('/verifiedOrf/:id').patch(authenticateUser, verifiedOrf)
router.route('/singleUser/:id').get(authenticateUser, getSingleUser)





module.exports = router