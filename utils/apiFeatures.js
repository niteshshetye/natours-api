class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    let queryObj = Object.assign({}, this.queryString); // deep copy

    // 1) FILTERING
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(key => delete queryObj[key]);

    // 2) ADVANCED FILTERING
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, match => `$${match}`);
    queryObj = JSON.parse(queryStr);

    this.query = this.query.find(queryObj);

    return this;
  }

  sort(defaultSort) {
    // 3) SORTING
    if (this.queryString.sort) {
      // string with space separated, to ascending
      // -string with space separated to descending
      // EXAMPLE: sort('-price ratingsAverage')
      const sortBy = this.queryString.sort
        .split(',')
        .join(' ')
        .trim();
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort(defaultSort);
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      // string with space separated, to include
      // -string with space separated to exclude
      // EXAMPLE: select('name duration price -__v')
      const fields = this.queryString.fields
        .split(',')
        .join(' ')
        .trim();
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  pagination(defaultSkip, defaultLimit) {
    if (this.queryString.page && this.queryString.limit) {
      const page = this.queryString.page * 1 || 1;
      const limit = this.queryString.limit * 1 || 100;

      const skip = (page - 1) * limit;
      this.query = this.query.skip(skip).limit(limit);
    } else {
      this.query = this.query.skip(defaultSkip).limit(defaultLimit);
    }

    return this;
  }
}

module.exports = APIFeatures;
