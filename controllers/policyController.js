
const Policy = require('../models/policyModel')
const {Notification, OrderNotification} = require('../models/notificationModel')
const AdminLog = require('../models/adminLogModel')
const CustomError = require('../errors')
const {StatusCodes} = require('http-status-codes')


const getSinglePolicy = async(req, res) => {
    const policy = await Policy.findOne({_id: req.params.id})
    if (!policy) {
        throw new CustomError.NotFoundError(`No Policy found with id : ${req.params.id}`);
    }

    res.status(StatusCodes.OK).json({msg: 'get single policy', policy})
}


const createPolicy = async(req, res) => {
    req.logAction = 'Create Policy';
 

    const {steps, description} = req.body

    if(!steps || !description) {
        throw new CustomError.BadRequestError('All fields are required')
    }

    const policy = await Policy.create({
        steps,
        description,
        user: req.user.userId,
        profile: req.user.profile_image,
        policy_publisher: req.user.full_name
    })

      // Create a notification
    const notification = await Notification.create({
        title: `${req.user.full_name} Posted New Policy`,
        message: `${steps} has been added.`,
        policy_id: policy._id,
        profile: `${req.user.profile_image}`,

    });
    
      // Fetch notifications after creating the announcement
    const notifications = await Notification.find({}).sort({ createdAt: -1 });
    
    io.emit('newPolicy', {notifications});

    await AdminLog.create({
        user: req.user.full_name,
        action: `${req.user.full_name} ${req.logAction}`,
        content: `${policy.steps} has been added`,
         profile: `${req.user.profile_image}`,
    })

    res.status(StatusCodes.CREATED).json({msg: 'Create policy', policy, notification})
}


const getAllPolicy = async(req, res) => {
    const policy = await Policy.find({})
    res.status(StatusCodes.OK).json({msg: 'get all policy', policy})

}

const updatePolicy = async(req, res) => {
    req.logAction = 'Update Policy';
    
    const policy = await Policy.findById(req.params.id)
    if(!policy){
        throw new CustomError.NotFoundError(`No policy with id ${policy}`)
    }
    

    const updatePolicy = await Policy.findByIdAndUpdate(
        req.params.id,
        req.body,
        {new:true}

    )
    
    const notification = await Notification.create({
        title: `Policy Updated: ${policy.steps}`,
        message: `${updatePolicy.steps} has been updated.`,
        policy_id: updatePolicy._id,
    });

    // Fetch notifications after updating the announcement
    const notifications = await Notification.find({}).sort({ createdAt: -1 });

    io.emit('updatePolicy', {notifications});

    await AdminLog.create({
        user: req.user.full_name,
        action: `${req.user.full_name} ${req.logAction}`,
        content: `${policy.steps} has been updated to ${updatePolicy.steps}`
    })

    res.status(StatusCodes.OK).json({msg: 'update policy', updatePolicy, notification})
}


const deletePolicy = async(req, res) => {
    req.logAction = 'Delete Policy';

    const policy = await Policy.findById(req.params.id)
    if(!policy){
        throw new CustomError.NotFoundError(`No policy with id ${policy}`)
    }
    await Policy.deleteOne({_id:policy})

    await AdminLog.create({
        action: `${req.user.full_name} ${req.logAction}`,
        content: `${policy.steps} has been removed`
        
    })

    res.status(StatusCodes.OK).json({msg: 'delete policy', policy})
}



module.exports = {
    getSinglePolicy,
    createPolicy,
    getAllPolicy,
    updatePolicy,
    deletePolicy
}