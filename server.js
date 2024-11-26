require('dotenv').config();
const mongoose = require('mongoose');

process.on('uncaughtException', err => {
  console.log(`${err.name}: ${err.message}`);
  console.log('UNCAUGHT EXCEPTION! Shutting down');
  process.exit(1); // 1 for error, 0 for not error
});

const app = require('./app');

const connectToDB = async () => {
  try {
    console.log(process.env.MONGO_URL);
    await mongoose.connect(process.env.MONGO_URL);
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      console.log(`database connected & server is running on port: ${port}`);
    });
  } catch (error) {
    console.log(`${error.name}: ${error.message}`);
  }
};

connectToDB();

process.on('unhandledRejection', err => {
  console.log(`${err.name}: ${err.message}`);
  console.log('UNHANDLED REJECTION! Shutting down');
  process.exit(1); // 1 for error, 0 for not error
});
