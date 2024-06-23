const {Order, CheckOut} = require('../models/orderModel')
const Product = require('../models/productModel')
const User = require('../models/usersModel')
const Review = require('../models/reviewModel')
require('dotenv').config();
const {Notification, OrderNotification, AdminNotification} = require('../models/notificationModel')
const {sendNotificationOrderStatus} = require('../utils')

const CustomError = require('../errors')
const {StatusCodes} = require('http-status-codes')
const {checkPermissions} = require('../utils')
const mongoose = require('mongoose')

// add to cart
// prod name
// categories
// price
// quantity
// total
// delete and update in add to cart

const userStatsOrder =  async(req, res)=> {
    try {
        const allOrders = await CheckOut.find({ user: req.user.userId })
        const userReviews = await Review.find({user: req.user.userId})

        // Filter orders based on their status
        const pendingOrders = allOrders.filter(order => order.status === 'pending');
        const acquiredOrders = allOrders.filter(order => order.status === 'to acquire');
        const completedOrders = allOrders.filter(order => order.status === 'completed');


        const pendingCount = pendingOrders.length;
        const acquiredCount = acquiredOrders.length;
        const completedCount = completedOrders.length;
        const completeReview = userReviews.length


        res.json({
            pending: pendingCount,
            acquired: acquiredCount,
            completed: completedCount,
            reviews: completeReview
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


// const addToCart = async (req, res) => {
//     const { items: cartItems } = req.body;

//     const user = await User.findById(req.user.userId);

//     if (!user) {
//         throw new CustomError.NotFoundError('user not found');
//     }

//     if (!cartItems || cartItems.length < 1) {
//         throw new CustomError.BadRequestError('No cart items provided');
//     }

//     let orderItems = [];
//     let subtotal = 0;

//     for (const item of cartItems) {
//         const dbProduct = await Product.findOne({ _id: item.product });
//         if (!dbProduct) {
//             throw new CustomError.NotFoundError(
//                 `No product with id : ${item.product}`
//             );
//         }

//         let { prod_name, prod_department, prod_desc, image, prod_price, _id, prod_benefits} = dbProduct;

//         // Check ctgy_stocks
//         const category = dbProduct.categories.find(
//             (ctgy) => ctgy.ctgy_selection === item.ctgy_selection
//         );

//         if (!category){
//             throw new CustomError.BadRequestError('Please Select a Size')
//         }

//         if (category.ctgy_stocks === 0) {
//             throw new CustomError.BadRequestError(
//                 `Product '${prod_name}' in category '${item.ctgy_selection}' is out of stock`
//             );
//         }

//         if(item.quantity > category.ctgy_stocks){
//             throw new CustomError.BadRequestError(
//                 `Cannot add more items `
//             );
//         }



//         let finalPrice;
   
//         if (user.freeUnifStatus === 'freeUnif' && prod_benefits === 'freeUnifVoucher' && !item.isVoucherApplied && user.isVoucherUse == false && user.isOrfVerified) {
//             finalPrice = prod_price * (item.quantity - 1);
//             user.isVoucherUse = true;
//             user.save();
//             item.isVoucherApplied = true;
//         } else {
//             finalPrice = prod_price * item.quantity;
//         }



//         const singleOrderItem = {
//             quantity: item.quantity,
//             prod_name,
//             prod_department,
//             prod_desc,
//             prod_price,
//             prod_benefits,
//             isVoucherApplied: item.isVoucherApplied,
//             image,
//             product: _id,
//             ctgy_selection: item.ctgy_selection,
//         };

      

//         // add item to order
//         orderItems = [...orderItems, singleOrderItem];

//         // calculate subtotal
//         // subtotal += item.quantity * prod_price;
//         subtotal += finalPrice
//     }

//     const total = subtotal;

//     const order = await Order.create({
//         orderItems,
//         total,
//         subtotal,
//         user: req.user.userId,
//     });

//     res.status(StatusCodes.CREATED).json({ msg: 'Create Order', order });
// };




const addToCart = async (req, res) => {
    const { items: cartItems } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
        throw new CustomError.NotFoundError('User not found');
    }

    if (!cartItems || cartItems.length === 0) {
        throw new CustomError.BadRequestError('No cart items provided');
    }

    const promises = cartItems.map(async (item) => {
        const dbProduct = await Product.findOne({ _id: item.product });
        if (!dbProduct) {
            throw new CustomError.NotFoundError(`No product with id: ${item.product}`);
        }

        const category = dbProduct.categories.find((ctgy) => ctgy.ctgy_selection === item.ctgy_selection);
        if (!category) {
            throw new CustomError.BadRequestError(`Invalid category selection '${item.ctgy_selection}' for product '${dbProduct.prod_name}'`);
        }

        if (category.ctgy_stocks === 0) {
            throw new CustomError.BadRequestError(`Product '${dbProduct.prod_name}' in category '${item.ctgy_selection}' is out of stock`);
        }

        if (item.quantity > category.ctgy_stocks) {
            throw new CustomError.BadRequestError(`Cannot add more items of '${dbProduct.prod_name}' in category '${item.ctgy_selection}'`);
        }

        // Check if there is an existing cart for the specific category of the product
        let userCart = await Order.findOne({
            user: req.user.userId,
            status: 'add to cart',
            'orderItems.product': item.product,
            'orderItems.ctgy_selection': item.ctgy_selection
        });

        if (userCart) {
            // If exists, update the quantity
            const existingItem = userCart.orderItems.find(
                (oi) => oi.product.toString() === item.product && oi.ctgy_selection === item.ctgy_selection
            );
            existingItem.quantity += item.quantity;
            userCart.subtotal += dbProduct.prod_price * item.quantity;
        } else {
            // Otherwise, create a new order for this product category
            userCart = new Order({
                status: 'add to cart',
                user: req.user.userId,
                orderItems: [{
                    quantity: item.quantity,
                    prod_name: dbProduct.prod_name,
                    prod_department: dbProduct.prod_department,
                    prod_desc: dbProduct.prod_desc,
                    prod_price: dbProduct.prod_price,
                    prod_benefits: dbProduct.prod_benefits,
                    image: dbProduct.image,
                    product: dbProduct._id,
                    ctgy_selection: item.ctgy_selection,
                    isVoucherApplied: false // assuming default value
                }],
                subtotal: dbProduct.prod_price * item.quantity
            });
        }

        // Calculate total based on subtotal (if subtotal exists)
        if (userCart.subtotal) {
            userCart.total = userCart.subtotal; // Placeholder for more complex total calculation
        }

        await userCart.save();

        return userCart;
    });

    // Execute all promises concurrently
    const userCarts = await Promise.all(promises);

    res.status(StatusCodes.CREATED).json({ msg: 'Create Order', cartItems: userCarts, count: userCarts.length });
};


const updateQuantity = async (req, res) => {
    const { orderId, quantity } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
        throw new CustomError.NotFoundError('user not found');
    }


    if (!orderId || quantity === undefined || quantity < 1) {
        throw new CustomError.BadRequestError('Bad request parameters');
    }

    const order = await Order.findById(orderId);

    if (!order) {
        throw new CustomError.NotFoundError('Order not found');
    }

    // Update quantity for all items in the order
    order.orderItems.forEach(item => {
        
        // Apply discount logic
        let finalPrice;
        const prod_benefits = item.prod_benefits;
        const isVoucherApplied = item.isVoucherApplied
        

        if (req.user.freeUnifStatus === 'freeUnif' && prod_benefits === 'freeUnifVoucher' && isVoucherApplied === true) {
            finalPrice = item.prod_price * (quantity - 1);
        } else {
            finalPrice = item.prod_price * quantity;
        }

        item.quantity = quantity;
        item.finalPrice = finalPrice;
    });

    // Recalculate total and subtotal for the order
    order.subtotal = order.orderItems.reduce((acc, item) => acc + item.finalPrice, 0);
    order.total = order.subtotal;

    await order.save();

    res.status(StatusCodes.OK).json({
        msg: 'Quantity Updated Successfully',
        order,
    });
};




// CHECKOUTS
const checkOut = async (req, res) => {

    const user = await User.findById(req.user.userId);

    if (!user) {
        throw new CustomError.NotFoundError('User not found');
    }

    const { orders } = req.body;

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
        throw new CustomError.BadRequestError('Invalid or empty orders array');
    }

    const orderIds = orders.map(order => order._id);



    //use find to get the updated orders
    const updatedOrders = await Order.find({ _id: { $in: orderIds } });

    //validation for stocks
    for (const order of updatedOrders) {
        for (const item of order.orderItems) {

            const productDetails = await Product.findById(item.product);
            if (!productDetails) {
                throw new CustomError.NotFoundError('Product not found');
            }

            if (!productDetails.categories) {
                throw new CustomError.BadRequestError('Categories not defined for the product');
            }
        
            const category = productDetails.categories.find(cat => cat.ctgy_selection === item.ctgy_selection);
            if (!category) {
                throw new CustomError.BadRequestError('Category not found for the product');
            }

            const initialStock = category.ctgy_stocks;
            if (item.quantity > initialStock) {
                throw new CustomError.BadRequestError('Cannot add quantity higher than initial stocks');
            }
        }
    }
    
    if (!Array.isArray(updatedOrders)) {
        throw new Error('updatedOrders is not an array');
    }

    const totalOrders = await Order.aggregate([
        {
            $match: { _id: { $in: orderIds.map(id => new mongoose.Types.ObjectId(id)) } },
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$total' },
            },
        },
    ]);

    const totalAmount = totalOrders.length > 0 ? totalOrders[0].total : 0;
    

    const checkOutOrder = await CheckOut.create({
        referenceId: null,
        userInfo: [{
            full_name: user.full_name,
            school_id: user.school_id,
            school_email: user.school_email,
            college_dept: user.college_dept,
            course: user.course,
            year: user.year,
            section: user.section,
            profile_image: user.profile_image,
        }],
        orders: updatedOrders.map(order => ({
            total: order.total,
            orderItems: order.orderItems,
        })),
        totalAmount,
        orderDate: new Date(),
        user: req.user.userId
    });

    await Order.deleteMany({ _id: { $in: orderIds } });

    const productNames = updatedOrders.map(order => order.orderItems.map(item => item.prod_name).join(', ')).join(', ');

    const adminNotification = await AdminNotification.create({
        title: `${user.full_name} just placed an order`,
        message: `${productNames}`,
        profile: `${user.profile_image}`,
        checkout_id: checkOutOrder._id,
        category: 'order',
        userId: user,
    });
    
    
    const adminNotifications = await AdminNotification.find({category: 'order'}).sort({ createdAt: -1 });

    io.emit('createOrder', {adminNotifications});


    res.status(StatusCodes.CREATED).json({ msg: 'Orders checked out successfully', checkOutOrder, adminNotification });
  
};


const totalCartAmount = async (req, res) => {
    try {
        const { orders } = req.body;

        if (!orders || !Array.isArray(orders) || orders.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                error: 'Invalid or empty orders array in the request body',
            });
        }

        const orderIds = orders.map(order => new mongoose.Types.ObjectId(order._id));

        const totalOrders = await Order.aggregate([
            {
                $match: { _id: { $in: orderIds } },
            },
            {
                $unwind: '$orderItems',
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total' },
                    subtotal: { $sum: '$subtotal' },
                    prod_benefits: { $push: '$orderItems.prod_benefits' },
                },
            },
        ]);

        const result = totalOrders.length > 0 ? totalOrders[0] : { total: 0, subtotal: 0, prod_benefits: [] };

        res.status(StatusCodes.OK).json({
            subtotal: result.subtotal,
            totalAmount: result.total,
            prodBenefits: result.prod_benefits,
        });
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
};



// FOR ADMIN
const updateOrder = async (req, res) => {
    try {
        const order = await CheckOut.findById(req.params.id);

        if (!order) {
            throw new CustomError.NotFoundError(`No order with id ${req.params.id}`);
        }

        // Check if the status is 'to acquire'
        if (req.body.status === 'to acquire') {
            req.body.issuedBy = req.user.full_name;
            // Update the quantity in ctgy_stocks
            for (const item of order.orders) {
                for (const orderItem of item.orderItems) {
                    const product = await Product.findById(orderItem.product);

                    if (!product) {
                        // Handle if the product is not found
                        console.error(`Product not found for ID: ${orderItem.product}`);
                        continue;
                    }

                    const category = product.categories.find(category => category.ctgy_selection === orderItem.ctgy_selection);

                    if (!category) {
                        // Handle if the category is not found
                        console.error(`Category not found for ctgy_selection: ${orderItem.ctgy_selection}`);
                        continue;
                    }

                    // Deduct the quantity from ctgy_stocks
                    category.ctgy_stocks -= orderItem.quantity;

                    // Save the updated product
                    await product.save();

                    if (orderItem.prod_benefits === 'freeUnifVoucher' && orderItem.isVoucherApplied) {
                        await User.findByIdAndUpdate(
                            order.user,
                            { freeUnifStatus: 'alreadyClaimed' },
                            { new: true }
                        );
                    }
                }
            }

           
        
        }

       
        // check two things: current user and the user that is in the order
        checkPermissions(req.user, order.user);
        const user = req.user
        const updatedOrder = await CheckOut.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (req.body.status === 'to acquire'){
            const origin =  process.env.ORIGIN;
            // const origin = 'http://localhost:3000'
            //  const origin = 'https://paucs.store'
      
            //sending email
            await sendNotificationOrderStatus({
                name: user.full_name,
                school_email: updatedOrder.userInfo[0].school_email,
                origin,
                orderId: updatedOrder._id,
                customerName: updatedOrder.userInfo[0].full_name,
                refId: updatedOrder.referenceId,
                orderDate: updatedOrder.orderDate,
                receivedDate: updatedOrder.receivedDate,
                customerEmail: updatedOrder.userInfo[0].school_email,
                customerCourse: updatedOrder.userInfo[0].course,
                customerYear: updatedOrder.userInfo[0].year,
                customerSection: updatedOrder.userInfo[0].section,
                productDetails: updatedOrder.orders,
                totalAmount: updatedOrder.totalAmount
            })
        }


        const productNames = updatedOrder.orders.map(order => order.orderItems.map(item => item.prod_name).join(', ')).join(', ');

        const userNotification = await OrderNotification.create({
            title: `Your Order Status Has Been Updated`,
            message: `The status for you order/s ${productNames} has been updated. Status: ${updatedOrder.status}.`,
            profile: `${user.profile_image}`,
            checkout_id: updatedOrder._id,
            userId: updatedOrder.user, // Assuming 'user' is the field that holds the user ID in your order model
        });
        
        // const userId = req.user.userId;
        // Fetch notifications after updating the announcement
        const userNotifications = await OrderNotification.find({userId:updatedOrder.user}).sort({ createdAt: -1 });
    
        io.emit('updateOrder', {userNotifications});

     
        
        //notification
        const products = await Product.find({ 'categories.ctgy_stocks': { $lt: 5 } });

        for (const product of products) {
            const existingNotifications = await AdminNotification.find({
                product_id: product._id,
                category: 'stocks',
            });

            for (const category of product.categories) {
                // Check if there is an existing notification for the current category
                const existingNotification = existingNotifications.find(
                    (notification) => notification.message === `${category.ctgy_selection} currently has ${category.ctgy_stocks} stocks`
                );

                // If no existing notification, create one
                if (!existingNotification && category.ctgy_stocks < 5) {
                    const stockNotification = await AdminNotification.create({
                        title: `${product.prod_name} is currently low on stock`,
                        message: `${category.ctgy_selection} currently has ${category.ctgy_stocks} stocks`,
                        profile: `${product.image}`,
                        category: 'stocks',
                        product_id: product._id,
                    
                    });
                }
            }
        }

        const stockNotifications = await AdminNotification.find({}).sort({ createdAt: -1 });

        io.emit('stockNotification', { stockNotifications });


        res.status(StatusCodes.OK).json({ msg: 'Order updated successfully', updatedOrder});
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
};




const removeProductToCart = async (req, res) => {
    const user = await User.findById(req.user.userId);
    if (!user) {
        throw new CustomError.NotFoundError('User not found');
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
        throw new CustomError.NotFoundError('No order found');
    }

    const firstOrderItem = order.orderItems[0]; // Get the first item in orderItems array
    if (!firstOrderItem) {
        throw new CustomError.NotFoundError('No order item found');
    }

    const { prod_benefits, isVoucherApplied } = firstOrderItem;

    // Check permissions
    checkPermissions(req.user, order.user);

    if (prod_benefits === 'freeUnifVoucher' && isVoucherApplied) {
        // Update user's isVoucherUse to false
        await User.findByIdAndUpdate(
            req.user.userId,
            { isVoucherUse: false },
            { new: true }
        );

        // Delete the order
        await Order.deleteOne({ _id: order._id });
 
    } else {
        await Order.deleteOne({ _id: order._id });
    }
    
    return res.status(StatusCodes.OK).json({ message: 'Product Removed', order });

};



// to cancel order
const cancelOrder = async (req, res) => {
    const user = await User.findById(req.user.userId);

    if (!user) {
        throw new CustomError.NotFoundError('User not found');
    }

    const order = await CheckOut.findById(req.params.id);

    if (!order) {
        throw new CustomError.NotFoundError('No order found')
    }

    const firstOrderItem = order.orders[0].orderItems[0];
    if (!firstOrderItem) {
        throw new CustomError.NotFoundError('No order item found');
    }

    const { prod_benefits, isVoucherApplied } = firstOrderItem;

    // check two things: current user and the user that is in the order
    checkPermissions(req.user, order.user);


    if (prod_benefits === 'freeUnifVoucher' && isVoucherApplied) {
        await User.findByIdAndUpdate(
            req.user.userId,
            { isVoucherUse: false },
            { new: true }
        );

        await CheckOut.deleteOne({ _id:order});
 
    } else {
        await CheckOut.deleteOne({ _id:order});
    }
    

    res.status(StatusCodes.OK).json({ message: "Order cancelled", order });
};


// FOR USER ----------------------------------------------------------------
// Get add to cart orders [user]
const showCartItems = async(req, res) => {
    const cartItems = await Order.find({user: req.user.userId }).sort({createdAt: -1})
    res.status(StatusCodes.OK).json({msg: 'Show all my order', cartItems, count: cartItems.length})
}


const showUserPendingOrder = async(req, res) => {
    const pendingOrders = await CheckOut.find({user: req.user.userId, status: 'pending'}).sort({createdAt: -1})
    res.status(StatusCodes.OK).json({pendingOrders, count: pendingOrders.length})
}


const showUserToAcquireOrder = async(req, res) => {
    const toAcquireOrders = await CheckOut.find({user: req.user.userId, status: 'to acquire'}).sort({createdAt: -1})
    res.status(StatusCodes.OK).json({toAcquireOrders, count: toAcquireOrders.length})
}



const showUserCompletedOrder = async(req, res) => {
    const completedOrders = await CheckOut.find({user: req.user.userId, status: 'completed'}).sort({createdAt: -1})
    res.status(StatusCodes.OK).json({completedOrders, count: completedOrders.length})
}

const showUserReviews = async(req, res) => {
    const userReviews = await Review.find({user: req.user.userId}).populate('product', 'prod_name image').sort({createdAt: -1})
    res.status(StatusCodes.OK).json({userReviews, count: userReviews.length})
}





//FOR ADMIN ---------------------------------------------------
const viewOrder = async(req, res) => {
    const order = await CheckOut.findById(req.params.id)
    if(!order){
        throw new CustomError.NotFoundError('Order not found')
    }
    res.status(StatusCodes.OK).json({order})
}




// get all orders
const getAllOrders = async(req, res)=> {
    const orders = await CheckOut.find({}).sort({createdAt: -1})
    res.status(StatusCodes.OK).json({orders, count: orders.length})
}


// get to pending orders
const getPendingOrders = async(req, res)=> {
    const pendingOrders = await CheckOut.find({status: 'pending'}).sort({createdAt: -1})
    res.status(StatusCodes.OK).json({pendingOrders, count: pendingOrders.length})
}

// get to to acquire orders
const getToAcquireOrders = async(req, res)=> {
    const toAcquireOrders = await CheckOut.find({status: 'to acquire'}).sort({createdAt: -1})
    res.status(StatusCodes.OK).json({toAcquireOrders, count: toAcquireOrders.length})
}


// get to to completed orders
const getCompletedOrders = async(req, res)=> {
    const completedOrders = await CheckOut.find({status: 'completed'}).sort({createdAt: -1})
    res.status(StatusCodes.OK).json({completedOrders, count: completedOrders.length})
}









module.exports = {
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
}
