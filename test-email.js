const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'crownevecenter@gmail.com',
    pass: 'znws fvqu yams tabz',
  },
});

transporter.verify(function(error, success) {
  if (error) {
    console.log("SMTP Error:", error);
  } else {
    console.log("Server is ready to take our messages");
  }
});
