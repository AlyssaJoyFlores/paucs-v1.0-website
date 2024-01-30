const express = require('express');
const router = express.Router()

const {authenticateUser, authorizePermissions} = require('../middleware/authentication')


const {
    totalIncome,
    productsAndOrderStats,
    toReceiveOrders,
    chartStatistic,
    mostSellingProducts
} = require('../controllers/adminDashboardController')


router.route('/totalIncome').get([authenticateUser, authorizePermissions('admin')], totalIncome)
router.route('/productsAndOrderStats').get([authenticateUser, authorizePermissions('admin')], productsAndOrderStats)
router.route('/toReceiveOrders').get([authenticateUser, authorizePermissions('admin')], toReceiveOrders)
router.route('/chartStatistic').get([authenticateUser, authorizePermissions('admin')], chartStatistic)
router.route('/mostSellingProducts').get(mostSellingProducts)


module.exports = router