const express = require('express');
const router = express.Router()

const {authenticateUser} = require('../middleware/authentication')

const rateLimiter = require('express-rate-limit')
const apiLimiter = rateLimiter({
    windowMs: 1 * 60 * 1000, //1 min
    max: 5,
    message: {
        msg: 'Too many request. Please Try again later'
    }
})


const {
    register,
    verifyEmail,
    logout,
    login,
    forgotPassword,
    resetPassword,
    addConfigureSettings,
    validateConfigureSettings,
    getConfigureQuestion
} = require('../controllers/authController')

router.route('/register').post(apiLimiter, register)
router.route('/login').post(apiLimiter, login)
router.route('/logout').delete(authenticateUser, logout)
router.route('/verify-email').post(verifyEmail)
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password').post(resetPassword);
router.route('/validateConfigure/:id').post(authenticateUser, validateConfigureSettings)
router.route('/configureSettings/:id').patch(authenticateUser, addConfigureSettings)
router.route('/getConfigureQuestion/:id').get(authenticateUser, getConfigureQuestion)
module.exports = router