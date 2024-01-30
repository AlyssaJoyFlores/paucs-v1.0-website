const Product = require('../models/productModel')
const Announcement = require('../models/announcementModel')
const Policy = require('../models/policyModel')
const {Order, CheckOut} = require('../models/orderModel')

const User = require('../models/usersModel')

const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');


const overallSearchAdmin = async (req, res) => {
    const { search } = req.query;
    const queryObject = {};

    if (search) {
        queryObject.$or = [
            { prod_name: { $regex: search, $options: 'i' } },
            { anncmnt_title: { $regex: search, $options: 'i' } },
            { anncmt_description: { $regex: search, $options: 'i' } },
            { steps: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
    }

    // Search for products with total sales and remaining products
    const productQuery = Product.find(queryObject)
        .collation({ locale: 'en', strength: 2 })
        .lean()
        .exec();

    const productsWithTotalCtgyStocksAndSales = await Promise.all(
        (await productQuery).map(async (product) => {
            const remainingProducts = product.categories.reduce(
                (acc, category) => acc + category.ctgy_stocks, 0
            ) || 'Sold Out';

            const completedOrders = await CheckOut.find({
                status: 'completed',
                'orders.orderItems.product': product._id,
            });

            const sales = completedOrders.reduce(
                (acc, order) => {
                    order.orders.forEach((orderItem) => {
                        const orderProduct = orderItem.orderItems.find(
                            (item) => item.product.toString() === product._id.toString()
                        );
                        if (orderProduct) {
                            acc += orderProduct.quantity
                        }
                    });
                    return acc;
                },
                0
            );

            return {
                ...product,
                sales,
                remainingProducts
            };
        })
    );

    const [announcements, policies] = await Promise.all([
        Announcement.find(queryObject).collation({ locale: 'en', strength: 2 }).exec(),
        Policy.find(queryObject).collation({ locale: 'en', strength: 2 }).exec(),
    ]);

    const totalCount = productsWithTotalCtgyStocksAndSales.length + announcements.length + policies.length;

    const searchResults = {
        products: {
            results: productsWithTotalCtgyStocksAndSales,
            count: productsWithTotalCtgyStocksAndSales.length,
        },
        announcements: {
            results: announcements,
            count: announcements.length,
        },
        policies: {
            results: policies,
            count: policies.length,
        },
        totalCount: totalCount,
    };

    // Check if totalCount is 0
    if (totalCount === 0) {
        throw new CustomError.NotFoundError(`No results found for search: ${search}`);
    }

    res.status(StatusCodes.OK).json(searchResults);
  
};


const overallSearchStudent = async (req, res) => {
    const { search } = req.query;
    const userCollegeDept = req.params.college_dept; // Assuming college_dept is a parameter in the route

    const queryObject = {};

    if (search) {
        queryObject.$or = [
            { prod_name: { $regex: search, $options: 'i' } },
            { anncmnt_title: { $regex: search, $options: 'i' } },
            { anncmt_description: { $regex: search, $options: 'i' } },
            { steps: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
    }

    // Search for products with total sales and remaining products
    const productQuery = Product.find({
        $and: [
            queryObject,
            {
                $or: [
                    { prod_department: userCollegeDept },
                    { prod_department: 'PHINMA AU SOUTH' }
                ]
            }
        ]
    })
        .collation({ locale: 'en', strength: 2 })
        .lean()
        .exec();

    const productsWithTotalCtgyStocksAndSales = await Promise.all(
        (await productQuery).map(async (product) => {
            const remainingProducts = product.categories.reduce(
                (acc, category) => acc + category.ctgy_stocks, 0
            ) || 'Sold Out';

            const completedOrders = await CheckOut.find({
                status: 'completed',
                'orders.orderItems.product': product._id,
            });

            const sales = completedOrders.reduce(
                (acc, order) => {
                    order.orders.forEach((orderItem) => {
                        const orderProduct = orderItem.orderItems.find(
                            (item) => item.product.toString() === product._id.toString()
                        );
                        if (orderProduct) {
                            acc += orderProduct.quantity
                        }
                    });
                    return acc;
                },
                0
            );

            return {
                ...product,
                sales,
                remainingProducts
            };
        })
    );


    const [announcements, policies] = await Promise.all([
        Announcement.find(queryObject).collation({ locale: 'en', strength: 2 }).exec(),
        Policy.find(queryObject).collation({ locale: 'en', strength: 2 }).exec(),
    ]);

    const totalCount = productsWithTotalCtgyStocksAndSales.length + announcements.length + policies.length;

    const searchResults = {
        products: {
            results: productsWithTotalCtgyStocksAndSales,
            count: productsWithTotalCtgyStocksAndSales.length,
        },
        announcements: {
            results: announcements,
            count: announcements.length,
        },
        policies: {
            results: policies,
            count: policies.length,
        },
        totalCount: totalCount,
    };

    // Check if totalCount is 0
    if (totalCount === 0) {
        throw new CustomError.NotFoundError(`No results found for search: ${search}`);
    }

    res.status(StatusCodes.OK).json(searchResults);

    
};




const searchOrders = async (req, res) => {
    const { status, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 12;
    const skip = (page - 1) * pageSize;

    const queryObject = {};

    if (status) {
        queryObject.status = status;
    }

    if (search) {
        queryObject['userInfo.full_name'] = { $regex: search, $options: 'i' };
    }

    try {
        let user = await CheckOut.find(queryObject)
            .collation({ locale: 'en', strength: 2 })
            .sort('userInfo.full_name')
            .skip(skip)
            .limit(pageSize)
            .exec();

        let searchTotal = await CheckOut.find(queryObject);

        res.status(StatusCodes.OK).json({ user, count: searchTotal.length });
    } catch (error) {
        console.error(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
};



module.exports = {
    overallSearchAdmin,
    overallSearchStudent,
    searchOrders
}