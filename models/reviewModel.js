const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        min: 1,
        max: 5,
        require: [true, 'Please provide rating']
    },
    comment: {
        type: String
    },
    review_image: {
        type: String
    },
    reviewBy: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    profile_image: {
      type: String
    },
    college_dept: {
      type: String
    },
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true
    }
}, {timestamps: true})


ReviewSchema.index({product:1, user:1}, {unique:true});

// ReviewSchema.statics.calculateAverageRating = async function(productId){
//     const result = await this.aggregate([
//         {$match:{product:productId}},
//         {$group:{
//             _id:null,
//             averageRating:{$avg:'$rating'},
//             numOfReviews:{$sum:1}
//         }}
//     ])
//     console.log(result)
//     try {
//         await this.model('Product').findOneAndUpdate({_id:productId}, {
//             averageRating:Math.ceil(result[0]?.averageRating || 0),
//             numOfReviews:Math.ceil(result[0]?.numOfReviews || 0)
//         })
//     } catch (error) {
//         console.log(error)
//     }
 
// }


ReviewSchema.statics.calculateAverageRating = async function(productId) {
    const result = await this.aggregate([
      { $match: { product: productId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          numOfReviews: { $sum: 1 },
        },
      },
    ]);
  
    console.log(result);
  
    try {
      const Product = mongoose.model('Product');
      await Product.findOneAndUpdate(
        { _id: productId },
        {
          averageRating: Math.ceil(result[0]?.averageRating || 0),
          numOfReviews: Math.ceil(result[0]?.numOfReviews || 0),
        }
      );
    } catch (error) {
      console.log(error);
    }
  };
  

// ReviewSchema.post('save', async function(){
//     await this.constructor.calculateAverageRating(this.product)
// })

// ReviewSchema.post('deleteOne', async function(){
//     await this.constructor.calculateAverageRating(this.product)
// })

ReviewSchema.post('save', async function(doc) {
    await doc.constructor.calculateAverageRating(doc.product);
  });
  
  ReviewSchema.post('deleteOne', { document: true }, async function(doc) {
    await doc.constructor.calculateAverageRating(doc.product);
  });
  


module.exports = mongoose.model('Review', ReviewSchema);