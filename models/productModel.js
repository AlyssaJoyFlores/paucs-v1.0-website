const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    ctgy_selection: {
        type: String,
    },
    ctgy_stocks: {
        type: Number
    }
}, {_id: false})


const ProductSchema = new mongoose.Schema({
    prod_department: {
        type: String,
        enum: ['CITE', 'CMA', 'CCJE', 'CAS', 'SHS', 'PHINMA AU SOUTH'],
        default: 'PHINMA AU SOUTH'
    },
    prod_status: {
        type: String,
        enum: ['NEW', 'OLD', 'SOLD OUT']
    },
    image: [{
        type: Object,
    }],
    prod_name: {
        type: String,
        required: true
    },
    prod_type: {
        type: String,
        enum: ['T-Shirt', 'Polo', 'Uniform', 'P.E. Uniform','Slacks', 'Attire', 'Others']
    },
    prod_desc: {
        type: String,
        required: true
    },
    prod_price: {
        type: Number,
        required: true
    },
    prod_benefits: {
        type: String,
        enum: ['freeUnifVoucher', 'None'],
        default: 'None'
    },
    categories: [categorySchema],
    averageRating: {
        type: Number,
        default: 0,
    },
    numOfReviews: {
        type: Number,
        default: 0,
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isArchived: {
        type: Boolean,
        default: false
    }
    
}, {timestamps: true,
    toJSON:{virtuals:true}, 
    toObject:{virtuals:true}
},)

 ProductSchema.virtual('sizecharts', {
    ref: 'SizeChart',
    foreignField: 'chart_categories',
    localField: 'prod_type'
 })


ProductSchema.virtual('reviews', {
    ref:'Review',
    localField:'_id',
    foreignField:'product',
    justOne: false,
    // match: {rating:5}
})


// //this will be use to delete products as well as reviews to that products
// ProductSchema.pre('deleteOne', { document: true }, async function (next) {
//     await this.model('Review').deleteMany({ product: this._id });
//     next()
// });
  

// Delete reviews associated with the product
ProductSchema.pre('deleteOne', { document: true }, async function (next) {
    const Review = mongoose.model('Review');
    await Review.deleteMany({ product: this._id });
    next();
  });
  


module.exports = mongoose.model('Product', ProductSchema);
