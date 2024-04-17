const express = require('express');
const router = express.Router()


//import validation for protected routes
const {authenticateUser, authorizePermissions} = require('../middleware/authentication')
// const {authenticateUser, authorizeRoles} = require('../middleware/full-auth')

const {
    archivedUser,
    getAllUsers,
    getSingleUser,
    showCurrentUser,
    updateUser,
    updateUserPassword,
    deleteUser,
    verifiedOrf,
    searchUsers,
    registerUser,
    verifiedMultipleOrf
} = require('../controllers/userController')


router.route('/registerUser').post([authenticateUser, authorizePermissions('admin')], registerUser)
router.route('/getAllUsers').get(authenticateUser, getAllUsers)
router.route('/showMe').get(authenticateUser, showCurrentUser)
router.route('/search').get(authenticateUser, searchUsers)

router.route('/updateUserPassword').patch(authenticateUser, updateUserPassword)
router.route('/verifiedMultipleOrf').patch(authenticateUser, verifiedMultipleOrf)

router.route('/updateUser/:id').patch(authenticateUser, updateUser)
router.route('/deleteUser/:id').delete([authenticateUser, authorizePermissions('admin')], deleteUser)
router.route('/verifiedOrf/:id').patch(authenticateUser, verifiedOrf)
router.route('/singleUser/:id').get(authenticateUser, getSingleUser)
router.route('/archivedUser/:id').patch([authenticateUser, authorizePermissions('admin')], archivedUser)





module.exports = router