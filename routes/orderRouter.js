const express = require('express');
const router = express.Router();

const {authenticateUser, authorizePermissions} = require('../middleware/authentication')

const {
    userStatsOrder,
    addToCart,
    checkOut,
    updateOrder,
    totalCartAmount,
    updateQuantity,
    removeProductToCart,
    cancelOrder,
    showCartItems,
    showUserPendingOrder,
    showUserToAcquireOrder,
    showUserCompletedOrder,
    showUserReviews,
    viewOrder,
    getAllOrders,
    getPendingOrders,
    getToAcquireOrders,
    getCompletedOrders
} = require('../controllers/orderController')

//admin  - get
router.route('/getAllOrders').get([authenticateUser, authorizePermissions('admin')], getAllOrders)
router.route('/getPendingOrders').get([authenticateUser, authorizePermissions('admin')], getPendingOrders)
router.route('/getToAcquireOrders').get([authenticateUser, authorizePermissions('admin')], getToAcquireOrders)
router.route('/getCompletedOrders').get([authenticateUser, authorizePermissions('admin')], getCompletedOrders)

// user - get
router.route('/totalCartAmount').post(authenticateUser, totalCartAmount)
router.route('/userStatsOrder').get(authenticateUser, userStatsOrder)
router.route('/showCartItems').get(authenticateUser, showCartItems)
router.route('/showUserPendingOrder').get(authenticateUser, showUserPendingOrder)
router.route('/showUserToAcquireOrder').get(authenticateUser, showUserToAcquireOrder)
router.route('/showUserCompletedOrder').get(authenticateUser, showUserCompletedOrder)
router.route('/showUserReviews').get(authenticateUser, showUserReviews)



// post
router.route('/addToCart').post(authenticateUser, addToCart)
router.route('/checkOut').post(authenticateUser, checkOut)

// update without id
router.route('/updateQuantity').patch(authenticateUser, updateQuantity)

// view order with id
router.route('/viewOrder/:id').get(authenticateUser, viewOrder)

// update - delete
router.route('/updateOrder/:id').patch([authenticateUser, authorizePermissions('admin')], updateOrder)

router.route('/cancelOrder/:id').delete(authenticateUser, cancelOrder)
router.route('/removeProductToCart/:id').delete(authenticateUser, removeProductToCart)

module.exports = router