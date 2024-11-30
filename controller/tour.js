const Tour = require('../models/tourSchema');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const SUCCESS = 'success';

exports.getTop5Tours = async (req, res, next) => {
  req.query.page = '1';
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  next();
};

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
  const tour = await Tour.findById(id);

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
