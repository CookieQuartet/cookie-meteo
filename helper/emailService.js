/**
 * Created by Julián on 17/06/2015.
 */

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'cookie.meteo@gmail.com',
        pass: 'cuartetogalleta'
    }
});

var EmailService = {
    sendEmail: function (destination, subject, content) {
        var mailOptions = {
            from: 'Estación Meteorológica', // sender address
            to: destination, // list of receivers
            subject: subject, // Subject line
            text: '', // plaintext body
            html: content // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log(error);
            }else{
                console.log('Message sent: ' + info.response);
            }
        });
    }
};

module.exports = EmailService;