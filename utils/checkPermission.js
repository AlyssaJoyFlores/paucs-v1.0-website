
// const CustomError = require('../errors')

// const checkPermissions = (requestUser, resourceUserId)=> {
//     console.log(requestUser)
//     console.log(resourceUserId)
//     console.log(typeof resourceUserId)

//     if(requestUser.role === 'admin') return;
//     if(requestUser.userId === resourceUserId.toString()) return;
//     throw new CustomError.UnauthorizedError('Not authorized to access this route')
// }


// module.exports = checkPermissions









const checkPermissions = (requestUser, resourceUserId) => {
    console.log(requestUser);
    console.log(resourceUserId);
    console.log(typeof resourceUserId);

    if (requestUser.role.includes('admin')) return;
    
    const resourceUserIdString = resourceUserId.toString(); // Convert ObjectId to string

    if (requestUser.userId === resourceUserIdString) return;
    
    throw new CustomError.UnauthorizedError('Not authorized to access this route');
};

module.exports = checkPermissions;

