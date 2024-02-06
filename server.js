// dependencies
const express = require('express');
require('dotenv').config();
require('express-async-errors')
const cors = require('cors');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2
const morgan = require('morgan');
const cookieParser = require('cookie-parser')
const path = require("path");
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const adminLogModel = require('./models/adminLogModel')

const http = require('http')
const socketIo = require('socket.io')
const User = require('./models/usersModel')




// invoke
const server = express();
const serverIO = http.createServer(server)
const io = socketIo(serverIO)

server.set('trust proxy', true);


// Socket.IO connection handling
io.on('connection', async(socket) => {
    // console.log('A user connected');
    socket.on('connect', () => {
        console.log('User connected');
        
    });

    // for notifications
    socket.on('newAnnouncement', (data) => {
        console.log('New Announcement:', data);
    });

    socket.on('newProduct', (data) => {
        console.log('New Product:', data);
    });
    
    socket.on('newPolicy', (data) => {
        console.log('New Policy:', data);
    });

    socket.on('updatePolicy', (data) => {
        console.log('Update Policy:', data);
    });

    socket.on('updateOrder', (data) => {
        console.log('Update Order:', data);
    });

    socket.on('createOrder', (data) => {
        console.log('Create Order:', data);
    });

    socket.on('createReview', (data) => {
        console.log('Create Review:', data);
    });

    socket.on('notificationUpdated', (data) => {
        console.log('Notification Updated:', data);
    })

    socket.on('notificationOrderUpdated', (data) => {
        console.log('Notification Order Updated:', data);
    })
    
    socket.on('notificationAdminUpdated', (data) => {
        console.log('Notification Admin Updated:', data);
    })

    socket.on('stockNotification', (data) => {
        console.log('Stock Notification', data);
      
    })

    socket.on('disconnect', () => {
        console.log('User disconnected');
        
    });
});

global.io = io;


// cloudinary
cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_API_SECRET
})


// imports
const connectDb = require('./db/dbConnection');


// middleware
const notFoundMiddleware = require('./middleware/not-found')
const errorHandlerMiddleware = require('./middleware/error-handler')

// Morgan setup
// server.use(morgan('tiny'))
morgan.token('user', (req) => (req.user ? req.user.full_name : 'guest'));
morgan.token('action', (req, res) => req.logAction || '-');
const morganFormat = ':method :url :status :response-time ms - :res[content-length] | User: :user | Action: :action';
server.use(morgan(morganFormat));




// //FOR CSP
// server.use(
//   helmet.contentSecurityPolicy({
//     useDefaults: true,
//     directives: {
//       "img-src": ["https://paucs-server.onrender.com/", "https://res.cloudinary.com/", "https://ui-avatars.com/api/"],
//       "connect-src": ["https://paucs-server.onrender.com/", "https://res.cloudinary.com/", "https://ui-avatars.com/api/"], 
//       upgradeInsecureRequests: [],
//     },
//     reportOnly: false,
//   })
// );

//===========




server.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ['https://www.google.com' , 'https://paucs.store/assets/index-20d2dddb.js'], // Ensure proper domain for reCAPTCHA
      styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
      imgSrc: ["'self'", "https://paucs.store", "https://res.cloudinary.com", "https://ui-avatars.com/api"],
      fontSrc: ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'", "https://paucs.store"],
      connectSrc: ["'self'", "https://paucs.store", "https://res.cloudinary.com", "https://ui-avatars.com/api", "https://www.google.com"], // Allowing Google for reCAPTCHA
      mediaSrc: ["'self'", "https://paucs.store"],
      formAction: ["'self'", "https://paucs.store"],
      requireTrustedTypesFor: ['script'], // Adjusted based on error message
    },
  }),
  helmet.frameguard({ action: "deny" }),
  helmet.hsts({ maxAge: 31536000, includeSubDomains: false }),
  helmet.referrerPolicy({ policy: "no-referrer" }),
  helmet.noSniff()
);



server.use(mongoSanitize())

const corsOptions = {
    origin: 'https://paucs.store',
    // origin: 'http://localhost:3000',
    credentials: true,
    //https://paucs-v1.onrender.com
};
server.use(cors(corsOptions));

server.use(express.json()); //passer - to be able to receive the data from the client into the server
server.use(express.urlencoded({ extended: true}));
server.use(fileUpload({useTempFiles:true}));
server.use(cookieParser(process.env.JWT_SECRET));


server.use(express.static(path.join(__dirname, 'dist')));

// Serve the static files from the "dist" directory
// server.use(express.static(path.resolve(__dirname, 'dist')));

// server.get('/*', function (req, res, next) {
//   // res.sendFile(path.join(__dirname, 'dist', 'index.html'));
//      res.status(200).json({message: 'link to the client'})
//     res.setHeader('Last-Modified', (new Date()).toUTCString());
//   next(); 
    
// });


// api routes
server.use('/api/auth', require('./routes/authRouter'))
server.use('/api/users', require('./routes/userRouter'))
server.use('/api/announcements', require('./routes/announcementRouter'));
server.use('/api/products', require('./routes/productRouter'));
server.use('/api/images', require('./routes/userImageRouter'))
server.use('/api/reviews', require('./routes/reviewRouter'))
server.use('/api/policy', require('./routes/policyRouter'))
server.use('/api/orders', require('./routes/orderRouter'));
server.use('/api/statistics', require('./routes/adminDashboardRouter'))
server.use('/api/inventory', require('./routes/inventoryRouter'))
server.use('/api/search', require('./routes/searchRouter'))
server.use('/api/notification', require('./routes/notificationRouter'));
server.use('/api/logs', require('./routes/logRouter'))
server.use('/api/info', require('./routes/infoRouter'))

server.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
        // res.status(200).json({message: 'link to the client'})
    //     res.setHeader('Last-Modified', (new Date()).toUTCString());
    //   next(); 

});


server.use(notFoundMiddleware)
server.use(errorHandlerMiddleware)


// server port
const port = process.env.PORT || 5000;

const startServer = async() => {
    try {
        await connectDb();
        serverIO.listen(port, ()=> {
            console.log(`Server start listening on port ${port}`);
        });
    } catch (error) {
        console.log(error);
    }
   
};

startServer();

