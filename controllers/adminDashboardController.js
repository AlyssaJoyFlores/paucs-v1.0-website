const { Order, CheckOut } = require('../models/orderModel')
const Product = require('../models/productModel')
const User = require('../models/usersModel')

const CustomError = require('../errors')
const { StatusCodes } = require('http-status-codes')
const { checkPermissions } = require('../utils')
const mongoose = require('mongoose')


const totalIncome = async (req, res) => {

  // Fetch completed orders
  const completedOrders = await CheckOut.find({ status: 'completed' });

  // Calculate total income
  const totalIncome = completedOrders.reduce((acc, order) => acc + order.totalAmount, 0);

  // Send the total income in the response
  res.status(StatusCodes.OK).json({ totalIncome, count: completedOrders.length });
};



// Statistics for
// Total Products
// Total Pending Orders
// Total Completed Orders
const productsAndOrderStats = async (req, res) => {
  const product = await Product.find()
  const allOrders = await CheckOut.find()

  // Filter orders based on their status
  const pendingOrders = allOrders.filter(order => order.status === 'pending');
  const completedOrders = allOrders.filter(order => order.status === 'completed');

  const totalProduct = product.length
  const totalPendingOrders = pendingOrders.length;
  const totalCompletedOrders = completedOrders.length;


  res.status(StatusCodes.OK).json({
    totalProduct,
    totalPendingOrders,
    totalCompletedOrders
  })
}

const toReceiveOrders = async (req, res) => {
  // Retrieve orders with status 'to acquire'
  const toReceive = await CheckOut.find({ status: 'to acquire' });

  // Extract relevant information from each completed order
  const ordersInfo = toReceive.map(order => ({
    userFullName: order.userInfo[0].full_name,
    collegeDepartment: order.userInfo[0].college_dept,
    receivedDate: order.receivedDate,
    // reference id here
  }));

  // Return the extracted information
  res.status(StatusCodes.OK).json({
    success: true,
    ordersInfo,
  });
};





const mostSellingProducts = async (req, res) => {
  try {
    // Retrieve completed orders from the database
    const completedOrders = await CheckOut.find({ status: 'completed' }).populate('orders.orderItems.product');

    // Create a map to store product quantities
    const productQuantityMap = new Map();

    // Iterate through completed orders and update product quantities
    completedOrders.forEach(order => {
      order.orders.forEach(orderItem => {
        orderItem.orderItems.forEach(item => {
          const productId = item.product._id.toString();
          const quantity = item.quantity;

          // Update product quantity in the map
          if (productQuantityMap.has(productId)) {
            productQuantityMap.set(productId, productQuantityMap.get(productId) + quantity);
          } else {
            productQuantityMap.set(productId, quantity);
          }
        });
      });
    });

    // Filter products with quantity sold greater than 50
    const filteredProducts = [...productQuantityMap.entries()].filter(entry => entry[1] > 2);

    // Sort filtered products by quantity in descending order
    const sortedProducts = filteredProducts.sort((a, b) => b[1] - a[1]);

    // Retrieve product details for the most selling products
    const mostSellingProducts = await Product.find({ _id: { $in: sortedProducts.map(entry => entry[0]) } });

    // Extract and format the desired fields for the response
    const formattedResponse = mostSellingProducts.map(product => ({
      prod_name: product.prod_name,
      image: product.image,
      averageRating: product.averageRating,
      quantitySold: productQuantityMap.get(product._id.toString()), // Quantity sold from the map
    }));

    // Return the modified response
    res.status(StatusCodes.OK).json({
      success: true,
      mostSellingProducts: formattedResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: 'Internal Server Error',
    });
  }
};



// const chartStatistic = async (req, res) => {
//   try {
//     const orders = await CheckOut.find({ status: 'completed' }).sort({ receivedDate: 1 });

//     const userData = {
//       labels: [
        
//       ],
//       datasets: [
//         {
//           data: [],
//         },
//       ],
//     };

//     orders.forEach((order) => {
//       const month = new Date(order.receivedDate).toLocaleString('en-US', { month: 'short' });
//       userData.labels.push(month);
//       userData.datasets[0].data.push(order.total);
//     });

//     res.json(userData);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

const chartStatistic = async (req, res) => {
  try {
    
    const chartData = await CheckOut.aggregate([
      {
        $match: { status: 'completed' },
      },
      {
        $group: {
          _id: { $month: '$receivedDate' },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ]);

    const chartValues = Array(12).fill(0);
    chartData.forEach((data) => {
      chartValues[data._id - 1] = data.totalAmount;
    });

    res.status(StatusCodes.OK).json(chartValues);
  } catch (error) {
    console.error("Error fetching chart data", error);
    res.status(500).json({ error: "Internal Server Error" , msg: error.message });
  }
}


module.exports = {
  totalIncome,
  productsAndOrderStats,
  toReceiveOrders,
  chartStatistic,
  mostSellingProducts
}