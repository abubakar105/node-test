const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service : 'gmail',
    host : 'smtp.gmail.com',
    port : 587,
    secure : false,
    auth : {
        user : process.env.EMAIL_USER,
        pass : process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false, 
    },
});

const sendEmail = async(option) =>{
    try {
        if (!option.to || !option.subject || !option.text) {
            throw new Error('Missing required email options');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(option.to)) {
            throw new Error("Invalid email format");
        }

        await transporter.sendMail({
            from : `"gmail" <${process.env.EMAIL_USER}>`,
            to : option.to,
            subject : option.subject,
            text : option.text,
        });
        
    } catch (error) {
        alert("error sending email", error);
    }
};
module.exports = sendEmail;
