const User = require('../models/usersModel')
const cloudinary = require('cloudinary').v2;
const fs = require('fs')
const CustomError = require('../errors')
const {StatusCodes} = require('http-status-codes')
const { attachedCookiesToResponse, createTokenUser, checkPermissions} = require('../utils')





// FUNCTION FOR USER IMAGE
const uploadUserImg = async(req, res) => {
    if (!req.files || !req.files.profile_image) {
        return res.status(StatusCodes.OK).json({ message: 'profile without image' });
    }

    const result = await cloudinary.uploader.upload(req.files.profile_image.tempFilePath, {
        use_filename:true,
        folder:'profile-image-folder'
    })

    fs.unlinkSync(req.files.profile_image.tempFilePath)

    return res.status(StatusCodes.OK).json({image:{src:result.secure_url}})
}


// FUNCTION FOR ORF IMAGE
const uploadOrfImg = async(req, res) => {
    // if (!req.files || !req.files.image) {
    //     return res.status(200).json({ message: 'prfile without image' });
    // }

    const result = await cloudinary.uploader.upload(req.files.orf_image.tempFilePath, {
        use_filename:true,
        folder:'orf-image-folder'
    })

    fs.unlinkSync(req.files.orf_image.tempFilePath)

    return res.status(StatusCodes.OK).json({image:{src:result.secure_url}})
}


// FUNCTION FOR COVER IMAGE
const uploadCoverImg = async(req, res) => {
    if (!req.files || !req.files.cover_image) {
        return res.status(StatusCodes.OK).json({ message: 'cover without image' });
    }

    const result = await cloudinary.uploader.upload(req.files.cover_image.tempFilePath, {
        use_filename:true,
        folder:'cover-image-folder'
    })  

    fs.unlinkSync(req.files.cover_image.tempFilePath)

    return res.status(StatusCodes.OK).json({image:{src:result.secure_url}})
}



// FUNCTION FOR UPDATE USER IMAGE
const updateUserImage = async (req, res) => {
  
    // const user = await User.findById(req.params.id);
   
    const user = await User.findById({ _id: req.user.userId });

    if (!user) {
        throw new CustomError.NotFoundError('No user found')
        // return res.status(404).json({ error: "No user found" });
    }

    try {
        if (user.profile_image) {
            const publicId = user.profile_image.match(/\/v\d+\/(.+?)\./)[1];
            await cloudinary.uploader.destroy(publicId);
        }
    } catch (error) {
        console.error("Error deleting existing image from Cloudinary:", error);
    }

    //validation for image
    if (!req.files.profile_image.mimetype.startsWith('image')) {
        throw new CustomError.BadRequestError('Please Upload Image File Type Only');
    }
            

    if (!req.files || !req.files.profile_image) {
        return res.status(StatusCodes.OK).json({ message: 'profile without image' });
    }

    

    const result = await cloudinary.uploader.upload(req.files.profile_image.tempFilePath, {
        use_filename: true,
        folder: 'profile-image-folder'
    });


    fs.unlinkSync(req.files.profile_image.tempFilePath);

    return res.status(StatusCodes.OK).json({ image: { src: result.secure_url } });
}



// FUNCTION FOR UPDATE ORF IMAGE
const updateOrfImage = async (req, res) => {
  
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new CustomError.NotFoundError('No user found')
        // return res.status(404).json({ error: "No user found" });
    }

    try {
        if (user.orf_image) {
            const publicId = user.orf_image.match(/\/v\d+\/(.+?)\./)[1];
            await cloudinary.uploader.destroy(publicId);
        }
    } catch (error) {
        console.error("Error deleting existing image from Cloudinary:", error);
    }

       //validation for image
    if (!req.files.orf_image.mimetype.startsWith('image')) {
        throw new CustomError.BadRequestError('Please Upload Image File Type Only');
    }
        

    if (!req.files || !req.files.orf_image) {
        return res.status(StatusCodes.OK).json({ message: 'orf without image' });
    }

    const result = await cloudinary.uploader.upload(req.files.orf_image.tempFilePath, {
        use_filename: true,
        folder: 'orf-image-folder'
    });


    fs.unlinkSync(req.files.orf_image.tempFilePath);

    return res.status(StatusCodes.OK).json({ image: { src: result.secure_url } });
}




// FUNCTION FOR UPDATE COVER IMAGE
const updateCoverImage = async (req, res) => {
  
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new CustomError.NotFoundError('No user found')
        // return res.status(404).json({ error: "No user found" });
    }

    try {
        if (user.cover_image) {
            const publicId = user.cover_image.match(/\/v\d+\/(.+?)\./)[1];
            await cloudinary.uploader.destroy(publicId);
        }
    } catch (error) {
        console.error("Error deleting existing image from Cloudinary:", error);
    }

    //validation for image
    if (!req.files.cover_image.mimetype.startsWith('image')) {
        throw new CustomError.BadRequestError('Please Upload Image File Type Only');
    }
        

    if (!req.files || !req.files.cover_image) {
        return res.status(StatusCodes.OK).json({ message: 'cover without image' });
    }

    const result = await cloudinary.uploader.upload(req.files.cover_image.tempFilePath, {
        use_filename: true,
        folder: 'cover-image-folder'
    });


    fs.unlinkSync(req.files.cover_image.tempFilePath);

    return res.status(StatusCodes.OK).json({ image: { src: result.secure_url } });
}



module.exports = {
    uploadUserImg,
    uploadOrfImg,
    uploadCoverImg,
    updateUserImage,
    updateOrfImage,
    updateCoverImage
}

