const express = require('express');
const router = express.Router();

// for authentication and permission
const {authenticateUser, authorizePermissions} = require('../middleware/authentication')

const {
    getAllInventory,
    updateInventory,
    searchInventory
} = require('../controllers/inventoryController')



router.route('/getAllInventory').get([authenticateUser, authorizePermissions('admin')], getAllInventory)
router.route('/searchInventory').get([authenticateUser, authorizePermissions('admin')], searchInventory)
router.route('/updateInventory/:id').patch([authenticateUser, authorizePermissions('admin')], updateInventory)


module.exports = router