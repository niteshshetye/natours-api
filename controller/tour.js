const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourSchema');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const SUCCESS = 'success';

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Only image are allowed!'), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.getTop5Tours = async (req, res, next) => {
  req.query.page = '1';
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  next();
};

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) images
  req.body.images = [];
  const resizeImagePromise = [];

  req.files.images.forEach((image, index) => {
    const imageName = `tour-${req.params.id}-${Date.now()}-${index}-cover.jpeg`;
    req.body.images.push(imageName);

    resizeImagePromise.push(
      sharp(image.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${imageName}`)
    );
  });
  await Promise.all(resizeImagePromise);

  next();
});

exports.getTourList = catchAsync(async (req, res, next) => {
  // query
  const features = new APIFeatures(Tour, req.query)
    .filter()
    .sort('-email')
    .limitFields()
    .pagination(0, 5);

  // EXECUTE QUERY
  const tours = await features.query;

  res
    .status(200)
    .json({ status: SUCCESS, data: { count: tours.length, tours } });
});

exports.getTourById = catchAsync(async (req, res, next) => {
  const { id } = req.params; // parameter
  const tour = await Tour.findById(id).populate('reviews');

  if (!tour) {
    return next(new AppError(400, 'Tour not found'));
  }

  return res.status(200).json({
    status: SUCCESS,
    data: {
      tour
    }
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.create(req.body);

  res.status(201).json({
    status: SUCCESS,
    data: {
      tour
    }
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const tour = await Tour.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  });

  if (!tour) {
    return next(new AppError(400, 'Tour not found'));
  }

  return res.status(201).json({ status: SUCCESS, data: { tour } });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const tour = await Tour.findByIdAndDelete(id);

  if (!tour) {
    return next(new AppError(400, 'Tour not found'));
  }

  return res.status(201).json({ status: SUCCESS, message: 'Tour deleted!!' });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        // _id: '$ratingsAverage',
        // _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: {
        avgPrice: 1 // 1 for ascending, -1 for descending
      }
    }
    // {
    //   $match: { _id: { $ne: 'EASY' } } // ne => not equal
    // }
  ]);

  return res.status(200).json({ status: SUCCESS, data: { stats } });
});

exports.getYearlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        totalToursStart: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: {
        month: '$_id'
      }
    },
    {
      $project: { _id: 0 }
    },
    {
      $sort: { totalToursStart: -1 }
    },
    {
      $limit: 12
    }
  ]);
  return res.status(200).json({ status: SUCCESS, data: { plan } });
});

exports.toursWithin = catchAsync(async (req, res, next) => {
  const { distance, unit, latlng } = req.params;

  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(
      new AppError(404, 'Please provide your lat lng to get your near by tours')
    );
  }

  // mongodb require radius in radian
  // it that mean we have to divide our distance with the radius of our earth
  // earth radius in miles => 3963.2
  // earth radius in km => 6378.1
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({ status: 'sucess', data: { tours } });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(
      new AppError(
        404,
        'Please provide your latitude and longitude to calculate the distance'
      )
    );
  }

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({ status: 'sucess', data: { distances } });
});
