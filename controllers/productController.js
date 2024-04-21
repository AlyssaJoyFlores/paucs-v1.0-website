const Product = require('../models/productModel')
const User = require('../models/usersModel')
const { Order, CheckOut } = require('../models/orderModel')
const {Notification, OrderNotification, AdminNotification}  = require('../models/notificationModel')
const AdminLog = require('../models/adminLogModel')
const cloudinary = require('cloudinary').v2;
const fs = require('fs')
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');


const archiveProduct = async(req, res) => {
  
  const product = await Product.findById(req.params.id);

  if (!product) {
      throw new CustomError.NotFoundError('No product found')
  }

  const updateProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    {new:true}
  )

  if(updateProduct.isArchived === true) {
    req.logAction = 'Archived Product';
    req.action = 'archived'
  } 

  if(updateProduct.isArchived === false) {
    req.logAction = 'Unarchived Product';
    req.action = 'unarchived'
  }

  
  await AdminLog.create({
    user: req.user.full_name,
    action: `${req.user.full_name} ${req.logAction}`,
    content: `Product: ${product.prod_name} has been ${req.action}`
  })


  res.status(StatusCodes.OK).json({updateProduct})
}




const getAllProductsUser = async (req, res) => {
  const userCollegeDept = req.params.college_dept;
  const isArchivedParam = req.query.isArchived;

  const {prod_type} = req.query

  const searchQuery = req.query.search;

  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 12;
  const skip = (page - 1) * pageSize;
  
  

  const query = {
    $or: [
      { prod_department: userCollegeDept },
      { prod_department: 'PHINMA AU SOUTH' },
    ]
  };

  if(isArchivedParam) {
    query.isArchived = req.query.isArchived === 'true'
  }

  if (prod_type) {
    query.prod_type = prod_type;
  }

  if (searchQuery) {
    query.prod_name = { $regex: searchQuery, $options: 'i' };
  }

  const getProducts = await Product.find(query)
  .collation({ locale: 'en', strength: 2 })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(pageSize)
  .exec();

  const countQuery = {...query}

  const totalProductCount = await Product.countDocuments(countQuery);
  const totalPages = Math.ceil(totalProductCount / pageSize);

  res.status(StatusCodes.OK).json({
    msg: 'get all products',
    getProducts,
    count: totalProductCount,
    totalPages,
  });
};




const getAllProductsAdmin = async (req, res) => {

    // insert pagination
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 12;
    const skip = (page - 1) * pageSize;
    const searchQuery = req.query.search;

    let queryObject = {};
    
    if (searchQuery) {
      queryObject.prod_name = { $regex: searchQuery, $options: 'i'};
    }
    

    if(req.query.isArchived) {
      queryObject.isArchived = req.query.isArchived === 'true'
    }

    
    const getProducts = await Product.find(queryObject)
      .collation({ locale: 'en', strength: 2 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();

         
    const totalProductCount = await Product.countDocuments();
    const totalByQuery = await Product.countDocuments(queryObject)
    const totalPages = Math.ceil(totalByQuery / pageSize);  
  
    const productsWithTotalCtgyStocksAndSales = await Promise.all(
      getProducts.map(async (product) => {
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
          ...product._doc,
          sales,
          remainingProducts
        };
      })
    );

  
    res.status(StatusCodes.OK).json({
      msg: "get all products",
      getProducts: productsWithTotalCtgyStocksAndSales,
      count: totalProductCount,
      totalByQuery,
      totalPages,
    });
  };


  const productLanding = async (req, res) => {
      // insert pagination
      const prodTypeQueryParam = req.query.type;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 12;
      const skip = (page - 1) * pageSize;
  
      let productQuery = Product.find().collation({ locale: 'en', strength: 2 });
  
      if (prodTypeQueryParam) {
          productQuery = productQuery.where('prod_type', prodTypeQueryParam);
      }
  
      const getProducts = await productQuery
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageSize)
          .exec();
  
      const countQuery = prodTypeQueryParam ? { prod_type: prodTypeQueryParam } : {};
  
      const totalProductCount = await Product.countDocuments(countQuery);
  
    const totalPages = Math.ceil(totalProductCount / pageSize);
  
    const productsWithTotalCtgyStocksAndSales = await Promise.all(
      getProducts.map(async (product) => {
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
          ...product._doc,
          sales,
          remainingProducts
        };
      })
    );

  
    res.status(StatusCodes.OK).json({
      msg: "get all products",
      getProducts: productsWithTotalCtgyStocksAndSales,
      count: totalProductCount,
      totalPages,
    });
  }
  
  
  


const getSingleProduct = async(req, res) => {
    const product = await Product.findById(req.params.id).populate('reviews').populate('sizecharts');
    if(!product){
        throw new CustomError.NotFoundError('Product not found')
    }
    res.status(StatusCodes.OK).json({product})
}



const addProduct = async(req, res)=> {
  req.logAction = 'Add Product';

  const {prod_department, prod_status, image, prod_name, prod_type, prod_desc, prod_price, prod_benefits, categories, averageRating, numOfReviews} = req.body

  if(!prod_department || !prod_status || !prod_name || !prod_desc || !prod_price || !categories){
    throw new CustomError.BadRequestError('All fields are required')
  }

  const user = await User.findById(req.user.userId);

  if (!user) {
    throw new CustomError.NotFoundError('Admin not found')
  }


  const product = await Product.create({
    prod_department, 
    prod_status, 
    image, 
    prod_name,
    prod_type, 
    prod_desc, 
    prod_price,
    prod_benefits, 
    categories,
    averageRating,
    numOfReviews,
    user: req.user.userId
  })

    // Create a notification
  const notification = await Notification.create({
    title: `${req.user.full_name} Add New Product`,
    message: `${prod_name} has been added.`,
    product_id: product._id,
    profile: `${user.profile_image}`,
    category: 'product'
  });
  
    // Fetch notifications after creating the announcement
  const notifications = await Notification.find({}).sort({ createdAt: -1 });
  
  io.emit('newProduct', {notifications});

  await AdminLog.create({
    user: req.user.full_name,
    action: `${req.user.full_name} ${req.logAction}`,
    content: `${product.prod_name} has been added`
  })


  res.status(StatusCodes.CREATED).json({msg: "create product!", product})
}




const updateProduct = async(req, res)=> {
  req.logAction = 'Update Product';

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
    content: `${updateProduct.prod_name} has been updated`
  })

  res.status(StatusCodes.OK).json({msg: "update product", updateProduct})
}




const deleteProduct = async(req, res)=> {
  req.logAction = 'Delete Product';

  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new CustomError.NotFoundError('Product not found')
  }

  
  try {
    if (product.image) {
      const publicId = product.image.match(/\/v\d+\/(.+?)\./)[1];
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
  }


  await product.deleteOne()
  // await Product.deleteOne({ _id:product});

  await AdminLog.create({
    user: req.user.full_name,
    action: `${req.user.full_name} ${req.logAction}`,
    content: `${product.prod_name} has been removed`
  })

  res.status(StatusCodes.OK).json({ message: "Product deleted", product });
}



// const uploadProdImage = async(req, res)=> {
//     //validation for image
//   if (!req.files.image.mimetype.startsWith('image')) {
//     throw new CustomError.BadRequestError('Please Upload Image File Type Only');
//   }

//   const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, {
//     use_filename:true,
//     folder:'product-folder'
//   })

//   fs.unlinkSync(req.files.image.tempFilePath)

//   return res.status(StatusCodes.OK).json({image:{src:result.secure_url}})
// }


//MULTIPLE IMAGES
const uploadProdImage = async (req, res) => {
  // Check if req.files.image exists and handle both single and multiple file uploads
  if (!req.files || (Array.isArray(req.files.image) && req.files.image.length === 0)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'No images found in the request' });
  }

  if (!req.files.image.mimetype.startsWith('image')) {
    throw new CustomError.BadRequestError('Please Upload Image File Type Only');
  }

  // Handle single file upload
  if (!Array.isArray(req.files.image)) {
    const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, {
      use_filename:true,
      folder: 'product-folder'
    });

    fs.unlinkSync(req.files.image.tempFilePath);
    return res.status(StatusCodes.OK).json({ image: { src: result.secure_url } });
  }

  // Handle multiple file upload
  if (req.files.image.length > 5) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Exceeded the maximum limit of 5 images' });
  }

  const uploadedImages = [];
  
 

  for (const file of req.files.image) {
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'product-folder'
    });

    fs.unlinkSync(file.tempFilePath);
    uploadedImages.push({ src: result.secure_url });
  }

  return res.status(StatusCodes.OK).json({ image: uploadedImages });
};





// const updateProdImage = async(req, res)=> {
//     const product = await Product.findById(req.params.id);

//     if (!product) {
//       return res.status(404).json({ error: "No product found" });
//     }

//     try {
//         if (product.image) {
//           const publicId = product.image.match(/\/v\d+\/(.+?)\./)[1];
//           await cloudinary.uploader.destroy(publicId);
//         }
//     } catch (error) {
//       console.error("Error deleting existing image from Cloudinary:", error);
//     }

//     //validation for image
//     if (!req.files.image.mimetype.startsWith('image')) {
//       throw new CustomError.BadRequestError('Please Upload Image File Type Only');
//     }

//     const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, {
//       use_filename: true,
//       folder: 'product-folder'
//     });


//     fs.unlinkSync(req.files.image.tempFilePath);

//     return res.status(StatusCodes.OK).json({ image: { src: result.secure_url } });
// }




const updateProdImage = async (req, res) => {
  const productId = req.params.id; // Assuming you pass productId in the request params

  // Fetch the existing product
  let product = await Product.findById(productId);

  if (!product) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: 'Product not found' });
  }

  // Handle single file upload
  if (!Array.isArray(req.files.image)) {
    const totalImages = product.image.length + 1; // Calculate total images after adding new one

    if (totalImages > 5) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Exceeded the maximum limit of 5 images' });
    }

    const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, {
      use_filename: true,
      folder: 'product-folder'
    });

    fs.unlinkSync(req.files.image.tempFilePath);

    // Append new image to existing images
    product.image.push({ src: result.secure_url });
    
    await product.save();

    return res.status(StatusCodes.OK).json({ image: product.image });
  }

  // Handle multiple file upload
  const totalImages = product.image.length + req.files.image.length; // Calculate total images after adding new ones

  if (totalImages > 5) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Exceeded the maximum limit of 5 images' });
  }

  const uploadedImages = [];
  
  for (const file of req.files.image) {
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'product-folder'
    });

    fs.unlinkSync(file.tempFilePath);
    
    // Append new image to existing images
    product.image.push({ src: result.secure_url });
  }

  await product.save();

  return res.status(StatusCodes.OK).json({ image: product.image });
};



const deleteProdImage = async (req, res) => {
  
  const { productId, imageUrl } = req.body;

  console.log('Received productId:', productId);
  console.log('Received imageUrl:', imageUrl);

  if (!productId || !imageUrl) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Product ID and Image URL are required' });
  }

  const publicId = imageUrl.match(/\/v\d+\/(.+?)\./)[1];
  console.log('Public ID:', publicId); 

  const result = await cloudinary.uploader.destroy(publicId);
  console.log('Cloudinary Delete Response:', result); 

  if (result.result !== 'ok') {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete image from Cloudinary' });
  }

  const product = await Product.findById(productId);
  if (!product) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Product not found' });
  }

  console.log('Product image array before deletion:', product.image);

  // Find the index of the image object with the matching src property
  const index = product.image.findIndex(img => img.src === imageUrl);
  
  if (index !== -1) {
      product.image.splice(index, 1);
      await product.save();
  }

  return res.status(StatusCodes.OK).json({ message: 'Image deleted successfully' });

};



// const deleteProdImage = async (req, res) => {
  
//   const { productId, imageUrl } = req.body;

//   console.log('Received productId:', productId);
//   console.log('Received imageUrl:', imageUrl);

//   if (!productId || !imageUrl) {
//       return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Product ID and Image URL are required' });
//   }


//   const publicId = imageUrl.match(/\/v\d+\/(.+?)\./)[1];
//   console.log('Public ID:', publicId); 


//   const result = await cloudinary.uploader.destroy(publicId);
//   console.log('Cloudinary Delete Response:', result); 

  
//   if (result.result !== 'ok') {
//       return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete image from Cloudinary' });
//   }


//   const product = await Product.findById(productId);
//   if (!product) {
//       return res.status(StatusCodes.NOT_FOUND).json({ error: 'Product not found' });
//   }

//   console.log('Product image array before deletion:', product.image);

//   const index = product.image.indexOf(imageUrl);
//   if (index !== -1) {
//       product.image.splice(index, 1);
//       await product.save();
//   }

//   return res.status(StatusCodes.OK).json({ message: 'Image deleted successfully' });

// };



const searchProduct = async(req, res) => {
  //insert pagination
 const page = parseInt(req.query.page) || 1;
 const pageSize = parseInt(req.query.pageSize) || 12;
 const skip = (page - 1) * pageSize;

 
 const {search} = req.query
 const queryObject = {}

 const userCollegeDept = req.params.college_dept

 // Include 'PHINMA AU SOUTH' and the user's college department in the query
 const departmentQuery = {
   $or: [
     { prod_department: userCollegeDept },
     { prod_department: 'PHINMA AU SOUTH' }
   ]
 };

 if(search){
   queryObject.prod_name = {$regex: search, $options: 'i'};
 }



 // Merge the search query and department query
 const finalQuery = { ...queryObject, ...departmentQuery };

 let products = await Product.find(finalQuery)
 .collation({ locale: 'en', strength: 2 })
 .sort('prod_name')
 .skip(skip)
 .limit(pageSize)
 .exec()

 let searchTotal = await Product.find(finalQuery)


 if(searchTotal.length === 0) {
   throw new CustomError.NotFoundError(`No results found for search: ${search}`)
 }


 res.status(StatusCodes.OK).json({products, countSearch: searchTotal.length})
}

module.exports = {
  getAllProductsAdmin,
  getAllProductsUser,
  archiveProduct,
  productLanding,
  getSingleProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  uploadProdImage,
  updateProdImage,
  deleteProdImage,
  searchProduct
}