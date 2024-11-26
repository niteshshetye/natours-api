const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal to 40 characters'],
      minlength: [10, 'A tour name must have more or equal to 10 characters']
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      trim: true,
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or dufficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        message: 'Discount price ({VALUE}) should be less than regular price',
        validator: function(val) {
          // this only point to current doc on NEW document creation
          // and not on update
          return val < this.price;
        }
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have cover image']
    },
    images: [String],
    startDates: [Date],
    slug: String,
    created_at: {
      type: Date,
      default: Date.now()
    },
    secretTour: {
      type: Boolean,
      default: false
    }
  },
  {
    toJSON: { virtuals: true }, // without this virtual properties not will added in response
    toObject: { virtuals: true }
  }
);

// virtual durationWeeks
// this virtual property create each time when we get data from database => .get()
// This we use mostly when we can simply calculate the property using availabel resources instead of storing them in the database
// we have added this here becuase its a business logic
// NOTE: we have used the function delcaration to use "this" keyword
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// **DOCUMENT MIDDLEWARE:
// * run before .save() and .create() command but not .insertMany() or .insert() command
// * pre run before creating document
// * we can have mutiple pre and post middleware
tourSchema.pre('save', function(next) {
  // * this keyword is refer to document which are currently processing
  this.slug = slugify(this.name, { lower: true });
  next();
});

// * post run after document saved to database hence we dont have access to this keyword but we have in parameter
// tourSchema.post('save', function(doc, next) {
//   next();
// });

// **QUERY MIDDLEWARE:
// * this will refer to current query and not the document
tourSchema.pre(/^find/, function(next) {
  // tourSchema.pre('find', function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});
// tourSchema.pre('findOne', function(next) {
//   this.find({ secretTour: { $ne: true } });
//   next();
// });
tourSchema.post(/^find/, function(_docs, next) {
  console.log(`Query took: ${Date.now() - this.start} ms`);
  next();
});

// **AGGREGATION MIDDLEWARE:
// this refer to current aggragation object
tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
