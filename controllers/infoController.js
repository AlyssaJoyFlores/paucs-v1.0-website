const {  About, SizeChart, Terms, Privacy, HelpSupport } = require('../models/infoModel')
const {Notification} = require('../models/notificationModel')
const CustomError = require('../errors')
const {StatusCodes} = require('http-status-codes')
const cloudinary = require('cloudinary').v2;
const fs = require('fs')



const getAbout = async(req, res) => {
    const about = await About.find({})
    res.status(StatusCodes.OK).json({msg: 'get about page', about})
}


const createAbout = async(req, res) => {
    const {about_title, about_description} = req.body

    
    if(!about_title || !about_description) {
        throw new CustomError.BadRequestError('All fields are required')
    }

    const about = await About.create({
        about_title,
        about_description
    })

    res.status(StatusCodes.CREATED).json({about})
}

const updateAbout = async(req, res) => {
    const about = await About.findById(req.params.id)

    if(!about){
        throw new CustomError.NotFoundError('PAUCS About not found')
    }

    const updateAbout = await About.findByIdAndUpdate(
        req.params.id,
        req.body,
        {new:true}
    )

      
    res.status(StatusCodes.OK).json({updateAbout})
}


const deleteAbout = async(req, res) => {
    const about = await About.findById(req.params.id)

    if(!about){
        throw new CustomError.NotFoundError('PAUCS About not found')
    }

    await About.deleteOne({_id:about})

    res.status(StatusCodes.OK).json({msg: 'delete about', about})
}


//========================================================================================


const getSizeChart = async(req, res) => {
    const sizeChart = await SizeChart.find({})
    res.status(StatusCodes.OK).json({msg: 'get size chart', sizeChart})
}


const createSizeChart = async(req, res) => {
    const {chart_title, chart_image, sizes, chart_categories} = req.body

    
    if(!chart_title || !chart_image) {
        throw new CustomError.BadRequestError('All fields are required')
    }

    const sizeChart = await SizeChart.create({
        chart_title,
        chart_image,
        chart_categories,
        sizes,
        user: req.user.userId
    })

    res.status(StatusCodes.CREATED).json({msg: 'create size chart', sizeChart})
}




const updateSizeChart = async(req, res) => {
    const size = await SizeChart.findById(req.params.id)

    if(!size){
        throw new CustomError.NotFoundError('PAUCS About not found')
    }

    const updateSizeChart = await SizeChart.findByIdAndUpdate(
        req.params.id,
        req.body,
        {new:true}
    )

    res.status(StatusCodes.OK).json({msg: 'update size chart', updateSizeChart})
}



const deleteSizeChart = async(req, res) => {
    const sizeChart = await SizeChart.findById(req.params.id);

    if (!sizeChart) {
        throw new CustomError.NotFoundError('No size chart found')
    }

   
    try {
        if (sizeChart.chart_image) {
            const publicId = sizeChart.chart_image.match(/\/v\d+\/(.+?)\./)[1];
            await cloudinary.uploader.destroy(publicId);
        }
    } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
    }

    await SizeChart.deleteOne({ _id:sizeChart});


    res.status(StatusCodes.OK).json({msg: 'delete size chart', sizeChart})
}



const uploadSizeChartImage = async(req, res) => {
    if (!req.files || !req.files.chart_image) {
        return res.status(200).json({ message: 'size chart without image' });
    }

      //validation for image
    if (!req.files.chart_image.mimetype.startsWith('image')) {
    throw new CustomError.BadRequestError('Please Upload Image File Type Only');
    }

    const result = await cloudinary.uploader.upload(req.files.chart_image.tempFilePath, {
        use_filename:true,
        folder:'chart-image-folder'
    })

    fs.unlinkSync(req.files.chart_image.tempFilePath)

    return res.status(StatusCodes.OK).json({image:{src:result.secure_url}})
}


const updateSizeChartImage = async(req, res) => {
    
    const sizeChart = await SizeChart.findById(req.params.id);

    if (!sizeChart) {
        return res.status(404).json({ error: "No size chart found" });
    }

    try {
        if (sizeChart.chart_image) {
            const publicId = sizeChart.chart_image.match(/\/v\d+\/(.+?)\./)[1];
            await cloudinary.uploader.destroy(publicId);
        }
    } catch (error) {
        console.error("Error deleting existing image from Cloudinary:", error);
    }

    //validation for image
    if (!req.files.chart_image.mimetype.startsWith('image')) {
        throw new CustomError.BadRequestError('Please Upload Image File Type Only');
    }
        

    if (!req.files || !req.files.chart_image) {
        return res.status(200).json({ message: 'size chart without image' });
    }

    const result = await cloudinary.uploader.upload(req.files.chart_image.tempFilePath, {
        use_filename: true,
        folder: 'chart-image-folder'
    });


    fs.unlinkSync(req.files.chart_image.tempFilePath);

    return res.status(StatusCodes.OK).json({ image: { src: result.secure_url } });
}


//================================================================================================

const getTerms = async(req, res) => {
    const terms = await Terms.find({})
    res.status(StatusCodes.OK).json({msg: 'get about page', terms})
}


const createTerms  = async(req, res) => {
    const {term_title, term_description} = req.body

    
    if(!term_title || !term_description) {
        throw new CustomError.BadRequestError('All fields are required')
    }

    const terms = await Terms.create({
        term_title,
        term_description
    })

    res.status(StatusCodes.CREATED).json({terms})
}

const updateTerms  = async(req, res) => {
    const terms = await Terms.findById(req.params.id)

    if(!terms){
        throw new CustomError.NotFoundError('terms not found')
    }

    const updateTerms = await Terms.findByIdAndUpdate(
        req.params.id,
        req.body,
        {new:true}
    )

      
    res.status(StatusCodes.OK).json({updateTerms})
}


const deleteTerms  = async(req, res) => {
    const terms = await Terms.findById(req.params.id)

    if(!terms){
        throw new CustomError.NotFoundError('terms not found')
    }

    await Terms.deleteOne({_id:terms})

    res.status(StatusCodes.OK).json({msg: 'delete terms', terms})
}


//================================================================================================
const getPrivacy = async(req, res) => {
    const privacy = await Privacy.find({})
    res.status(StatusCodes.OK).json({msg: 'get privacy', privacy})
}


const createPrivacy  = async(req, res) => {
    const {privacy_title, privacy_description} = req.body

    
    if(!privacy_title || !privacy_description) {
        throw new CustomError.BadRequestError('All fields are required')
    }

    const privacy = await Privacy.create({
        privacy_title,
        privacy_description
    })

    res.status(StatusCodes.CREATED).json({privacy})
}

const updatePrivacy  = async(req, res) => {
    const privacy = await Privacy.findById(req.params.id)

    if(!privacy){
        throw new CustomError.NotFoundError('privacy not found')
    }

    const updatePrivacy = await Privacy.findByIdAndUpdate(
        req.params.id,
        req.body,
        {new:true}
    )

      
    res.status(StatusCodes.OK).json({updatePrivacy})
}


const deletePrivacy  = async(req, res) => {
    const privacy = await Privacy.findById(req.params.id)

    if(!privacy){
        throw new CustomError.NotFoundError('privacy not found')
    }

    await Privacy.deleteOne({_id:privacy})

    res.status(StatusCodes.OK).json({msg: 'delete privacy', privacy})
}

//================================================================
const getHelpSupport = async(req, res) => {
    const helpSupport = await HelpSupport.find({})
    res.status(StatusCodes.OK).json({msg: 'Get Help Support Page', helpSupport})
}


const createHelpSupport = async(req, res) => {
    const {title, step} = req.body

    
    if(!title || !step) {
        throw new CustomError.BadRequestError('All fields are required')
    }

    const helpSupport = await HelpSupport.create({
        title,
        step
    })

          // Create a notification
    await Notification.create({
        title: `${req.user.full_name} Posted New Help Support`,
        message: `${title} has been added.`,
        support_id: helpSupport._id,
        profile: `${req.user.profile_image}`,
        category: 'helpsupport',

    });
    
        // Fetch notifications after creating the announcement
    const notifications = await Notification.find({}).sort({ createdAt: -1 });
    
    io.emit('newPolicy', {notifications});

    res.status(StatusCodes.CREATED).json({helpSupport})
}

const updateHelpSupport = async(req, res) => {
    const helpSupport = await HelpSupport.findById(req.params.id)

    if(!helpSupport){
        throw new CustomError.NotFoundError('Help Support Not Found')
    }

    const updateHelpSupport = await HelpSupport.findByIdAndUpdate(
        req.params.id,
        req.body,
        {new:true}
    )

      
    res.status(StatusCodes.OK).json({updateHelpSupport})
}


const deleteHelpSupport = async(req, res) => {
    const helpSupport = await HelpSupport.findById(req.params.id)

    if(!helpSupport){
        throw new CustomError.NotFoundError('Help Support Not Found')
    }

    await HelpSupport.deleteOne({_id:helpSupport})

    res.status(StatusCodes.OK).json({msg: 'delete about', helpSupport})
}




module.exports = {
    getAbout,
    createAbout,
    updateAbout,
    deleteAbout,
    getSizeChart,
    createSizeChart,
    updateSizeChart,
    deleteSizeChart,
    uploadSizeChartImage,
    updateSizeChartImage,
    getTerms,
    createTerms,
    updateTerms,
    deleteTerms,
    getPrivacy,
    createPrivacy,
    updatePrivacy,
    deletePrivacy,
    getHelpSupport,
    createHelpSupport,
    updateHelpSupport,
    deleteHelpSupport
}