const { Order, CheckOut } = require('../models/orderModel')
const Product = require('../models/productModel')
const User = require('../models/usersModel')
const AdminLog = require('../models/adminLogModel')

const CustomError = require('../errors')
const { StatusCodes } = require('http-status-codes')
const { checkPermissions } = require('../utils')
const mongoose = require('mongoose')

const getAllInventory = async (req, res) => {
    try {
      // Get all products
      const allProducts = await Product.find();
  
      // Initialize an array to store product information and totals
      const productInventory = [];
  
      // Loop through all products
      for (const product of allProducts) {
        // Find completed orders for the specific product
        const completedOrders = await CheckOut.find({
          status: 'completed',
          'orders.orderItems.product': product._id,
        });
  
        // Calculate total quantities
        let totalToAcquire = 0;
        let totalCompleted = 0;
  
        completedOrders.forEach((order) => {
          order.orders.forEach((orderItem) => {
            orderItem.orderItems.forEach((item) => {
              if (item.product.equals(product._id)) {
                if (order.status === 'to acquire') {
                  totalToAcquire += item.quantity;
                } else if (order.status === 'completed') {
                  totalCompleted += item.quantity;
                }
              }
            });
          });
        });
  
        // Store product information and totals
        const productInfo = {
          product_name: product.prod_name,
          prod_department: product.prod_department,
          total_ctgy_stocks: product.categories.reduce((acc, category) => acc + category.ctgy_stocks, 0),
          total_to_acquire: totalToAcquire,
          total_completed: totalCompleted,
        };
  
        productInventory.push(productInfo);
      }
  
      res.status(StatusCodes.OK).json({ productInventory });
    } catch (error) {
      console.error(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
};
  


const updateInventory = async(req, res) => {
  req.logAction = 'Update Product Inventory';

  const product = await Product.findById(req.params.id)

  if(!product){
      throw new CustomError.NotFoundError('Product not found')
  }

  const updateProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new:true}
  )

  await AdminLog.create({
    user: req.user.full_name,
    action: `${req.user.full_name} ${req.logAction}`,
    content: `${product.prod_name} has been updated`
  })

  res.status(StatusCodes.OK).json({msg: "update product", updateProduct})
}


const searchInventory = async (req, res) => {
  try {
    // Get search parameters from the request
    const { search } = req.query;

    // Get all products based on search parameters
    let filteredProducts;
    if (search) {
      // If there are search parameters, filter products
      filteredProducts = await Product.find({
        $or: [
          { prod_name: {$regex: search, $options: 'i' } }, // Case-insensitive product name search
          { prod_department: {$regex: search, $options: 'i' } }, // Case-insensitive department search
        ],
      });
    } else {
      // If no search parameters, get all products
      filteredProducts = await Product.find();
    }

    // Initialize an array to store product information and totals
    const productInventory = [];

    // Loop through filtered products
    for (const product of filteredProducts) {
      // Find completed orders for the specific product
      const completedOrders = await CheckOut.find({
        status: 'completed',
        'orders.orderItems.product': product._id,
      });

      // Calculate total quantities
      let totalToAcquire = 0;
      let totalCompleted = 0;

      completedOrders.forEach((order) => {
        order.orders.forEach((orderItem) => {
          orderItem.orderItems.forEach((item) => {
            if (item.product.equals(product._id)) {
              if (order.status === 'to acquire') {
                totalToAcquire += item.quantity;
              } else if (order.status === 'completed') {
                totalCompleted += item.quantity;
              }
            }
          });
        });
      });

      // Store product information and totals
      const productInfo = {
        product_name: product.prod_name,
        prod_department: product.prod_department,
        total_ctgy_stocks: product.categories.reduce((acc, category) => acc + category.ctgy_stocks, 0),
        total_to_acquire: totalToAcquire,
        total_completed: totalCompleted,
      };

      productInventory.push(productInfo);
    }

    res.status(StatusCodes.OK).json({ productInventory });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message }); // Send the error message in the response
  }
};



module.exports = {
  getAllInventory,
  updateInventory,
  searchInventory
}