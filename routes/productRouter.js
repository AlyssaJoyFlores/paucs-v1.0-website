const express = require('express')
const router = express.Router()

// for authentication and permission
const {authenticateUser, authorizePermissions} = require('../middleware/authentication')




const {
    getAllProductsAdmin,
    getAllProductsUser,
    productLanding,
    searchProduct,
    getSingleProduct,
    addProduct,
    updateProduct,
    deleteProduct,
    uploadProdImage,
    updateProdImage
} = require('../controllers/productController')

const {
    getSingleProductReview
} = require('../controllers/ReviewController')


router.route('/getAdminProducts').get(getAllProductsAdmin);
router.route('/productLanding').get(productLanding);

router.route('/uploadProdImage').post([authenticateUser, authorizePermissions('admin')], uploadProdImage);

router.route('/addProduct').post([authenticateUser, authorizePermissions('admin')], addProduct);


router.route('/getUserProducts/:college_dept').get(getAllProductsUser);
router.route('/productSearch/:college_dept').get(authenticateUser, searchProduct)
router.route('/getSingleProduct/:id').get(getSingleProduct);
router.route('/updateProdImage/:id').post([authenticateUser, authorizePermissions('admin')],updateProdImage);
router.route('/updateProduct/:id').patch([authenticateUser, authorizePermissions('admin')], updateProduct);
router.route('/deleteProduct/:id').delete([authenticateUser, authorizePermissions('admin')], deleteProduct);




router.route('/:id/review').get(authenticateUser, getSingleProductReview)


module.exports = router