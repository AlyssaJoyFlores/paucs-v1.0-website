const mongoose = require('mongoose')

const userCredentials = new mongoose.Schema({
    full_name: {
        type: String
    },
    school_id: {
        type: String
    },
    school_email: {
        type: String
    },
    college_dept: {
        type: String
    },
    course: {
        type: String
    },
    year: {
        type: String
    },
    section: {
        type: String
    },
    profile_image: {
        type: String
    }

}, {_id: false})

const SingleCartItemsSchema = new mongoose.Schema({
    prod_name: {
        type: String,
        required: true
    },
    prod_department: {
        type: String,
        enum: ['CITE', 'CMA', 'CCJE', 'CAS', 'SHS', 'PHINMA AU SOUTH'],
        default: 'PHINMA AU SOUTH'
    },
    image: {
        type: String,
    },
    prod_price: {
        type: Number,
        required: true
    },
    prod_benefits: {
        type: String,
        enum: ['freeUnifVoucher', 'None']
    },
    isVoucherApplied: {
        type: Boolean,
        default: false
    },
    quantity: {
        type: Number,
        required: true
    },
    // categories: [{
    //     ctgy_selection: {
    //         type: String,
    //     }
    // }],
    ctgy_selection: {
        type: String,
    },
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true
    }

})

const OrderSchema = new mongoose.Schema({
    subtotal: {
        type: Number,

    },
    total: {
        type: Number,
        required: true
    },
    orderItems: [SingleCartItemsSchema],
    status: {
        type: String,
        enum: ['add to cart', 'pending', 'to acquire', 'completed', 'cancelled'],
        default: 'add to cart'
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    }
},{timestamps: true})


const checkOutSchema = new mongoose.Schema({
    referenceId: {
        type: Number,
        unique: true
    },
    userInfo : [userCredentials],
    orders: [{
        total: {
            type: Number,
            required: true
        },
        orderItems: [SingleCartItemsSchema],
    }],
    totalAmount: {
        type: Number
    },
    orderDate: {
        type: Date,
        default: Date.now()
    },
    receivedDate: {
        type: Date,
    },
    issuedBy: {
        type: String
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'to acquire', 'completed', 'cancelled'],
        default: 'pending'
    },
},{timestamps: true})


checkOutSchema.pre('save', async function (next) {
    try {
        if (!this.referenceId) {
            const CheckOutModel = this.constructor;

            // Find and increment the highest existing referenceId atomically
            const result = await CheckOutModel.findOneAndUpdate(
                {},
                { $inc: { referenceId: 1 } },
                { sort: { referenceId: -1 }, upsert: true, new: true }
            );

            // Increment by 100000 to start from "100000"
            const incrementedValue = result.referenceId + 111110;

            // Format the incremented value to the desired format (000000)
            this.referenceId = incrementedValue.toString().padStart(6, '0');

            // Log for debugging
            console.log('New referenceId:', this.referenceId);
        }
        next();
    } catch (error) {
        next(error);
    }
});



const Order = mongoose.model('Order', OrderSchema);
const CheckOut = mongoose.model('Checkout', checkOutSchema);

module.exports = { Order, CheckOut };