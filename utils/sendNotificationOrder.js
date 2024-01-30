const sendEmail = require('./sendEmail')

// this is the body for the email
// origin will be done in the front-end/client

const sendNotificationOrderStatus = async({
    name, 
    school_email, 
    token, 
    origin, 
    customerName, 
    orderId,
    refId,
    orderDate,
    receivedDate,
    customerEmail,
    customerCourse,
    customerYear,
    customerSection,
    productDetails,
    totalAmount

}) => {
    const productsList = productDetails?.map(item => `
        <ul style="color:gray; font-size:15px; margin:0;">
            <li>Product: ${item?.orderItems[0]?.prod_name}</li>
            <li>Price: ${item?.orderItems[0]?.prod_price}</li>
            <li>Quantity: ${item?.orderItems[0]?.quantity}</li>
            <li>Size: ${item?.orderItems[0]?.ctgy_selection}</li>
        </ul>
    `)

    // const viewOrder = `${origin}/student/orders/${orderId}`

    const orderMessage = `
    <div style='background-color:white; padding:1rem; width:90%; margin:auto; font-family:"Trebuchet MS";'>
        <div style="display:flex; justify-content:space-between; align-items:center; padding:1rem;">
            <h1 style="font-size:30px; font-weight:bold; color:#7286D3; margin:0;">PAUCS</h1>
        </div>

        <div style='box-shadow:0px 2px 5px #7286D3; padding:1rem; width:40rem; margin:auto;'>
        <div style='text-align:center;'><img src="https://res.cloudinary.com/dkxtpgajz/image/upload/v1706433805/email-bg/njdtd0wyjrvtwijllujm.jpg" style='width:450px; margin:auto;'/></div>
        <div style="text-align:center; margin-top:1rem;">
            

            <h1 style="font-style:normal; font-size:35px; margin:0;">Order Status</h1>
            <p style="color:gray; font-size:15px; margin:0;">Hi ${customerName},</p>
            <p style="color:gray; font-size:15px; margin:0;">Your order ${refId} made on ${orderDate} has been processed and expected to be acquired on ${receivedDate} at Phinma Au South Finance Department. Please make sure you have your digital receipt to be able to acquire your order/s. </p>

            <h2 style="font-style:normal; font-size:35px; margin:0;">Customer Details</h2>
            <ul style="color:gray; font-size:15px; margin:0;>
                <li>Name: ${customerName}</li>
                <li>Email: ${customerEmail}</li>
                <li>Course: ${customerCourse}</li>
                <li>Year: ${customerYear}</li>
                <li>Section: ${customerSection}</li>
            </ul>

            <h2 style="font-style:normal; font-size:35px; margin:0;">Order Details</h2>
            <img src= style="width:150px; height:100px; margin:0;">
            ${productsList}
            ${totalAmount}


            <a href="${origin}/student/orders/${orderId}" style="display: inline-block; text-decoration: none;">
                <button style="background-color:#7286D3; color:white; padding:0.80rem; border:none; border-radius:5px; font-size:16px; cursor:pointer;">View Order</button>
            </a>
        </div>
        </div>
        <div style="text-align:center; border-top:1px solid gray; padding-top:1rem;">
            <p>Email sent by PAUCS</p>
            <p>&copy; Copyright 2023 PAUCS ORG, All rights reserved.</p>
        </div>
    </div>`


  return sendEmail({to:school_email, subject:'Order Status', html:orderMessage})
}

module.exports = sendNotificationOrderStatus