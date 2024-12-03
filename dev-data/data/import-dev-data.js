require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const Tour = require('../../models/tourSchema');

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

const connectToDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
  } catch (error) {
    console.log('failed to connect database!!!');
  }
};

const importData = async () => {
  try {
    await connectToDb();
    await Tour.create(tours);
    console.log('Data loaded successfully!!');
    process.exit();
  } catch (error) {
    console.log('failed to create tours');
  }
};

const deleteData = async () => {
  try {
    await connectToDb();
    await Tour.deleteMany();
    console.log('Data deleted successfully!!');
    process.exit();
  } catch (error) {
    console.log('failed to create tours');
  }
};

// console.log(process.argv);

if (process.argv[2] === '--import') importData();
if (process.argv[2] === '--delete') deleteData();
