const User = require('../models/User');
const Movie = require('../models/Movie');
const Rating = require('../models/Rating');

/**
 * GET /movies/:page
 * Show movies.
 */
exports.getMovies = (req, res) => {
  let page = req.params.page;
  if(page > 0) {
    Movie.find({}, (err, mo) => {
      if (err) { return next(err); }
      if (mo.length > 0) {
        // console.log(mo.length);
        res.render('movies/all', {
          title: 'Peliculas',
          movies: mo,
          page: page
        });
      } else {
        res.render('movies/error');
      }
    }).skip(20*(page-1)).limit(20);
  } else {
    res.render('movies/error');
  }
};

/**
 * GET /movies/title/:movieId
 * Show movie details.
 */
exports.getMovieDetail = (req, res) => {
  let movieId = req.params.movieId;
  let islogin = (req.user) ? true : false;
  let rating = 0;
  Movie.findOne({movieId: movieId}, (err, mo) => {
    if (err) { return next(err); }
    if (mo) {
      if (islogin) {
        Rating.findOne({
          movieId: movieId,
          userId: req.user.id
        }, (err, ra) => {
          if (err) { return next(err); }
          if (ra) {
            rating = ra.rating;
          }
          res.render('movies/detail', {
            title: mo.title,
            movie: mo,
            logged: islogin,
            rating: rating
          });
        });
      } else {
        res.render('movies/detail', {
          title: mo.title,
          movie: mo,
          logged: islogin,
          rating: rating
        });
      }
    } else {
      res.render('movies/error');
    }
  });
};

/**
 * POST /movies/title/rate/:movieId
 * Save new rate for movie.
 */
exports.postRateMovie = (req, res, next) => {
  req.assert('rating', 'Rating value is not valid').isInt().isIn([1,2,3,4,5]);
  const errors = req.validationErrors();

  const movieId = req.params.movieId;
  const rating = req.body.rating;

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/movies/title/'+movieId);
  }

  Rating.findOne({
    movieId: movieId,
    userId: req.user.id
  }, (err, ra) => {
    if (err) { return next(err); }
    if (ra) {
      ra.rating = rating;
      ra.save((err) => {
        if (err) {
          req.flash('errors', errors);
          return res.redirect('/movies/title/'+movieId);
        }
        req.flash('success', { msg: 'Rating saved successfuly.' });
        res.redirect('/movies/title/'+movieId);
      });
    } else {
      const newRating = new Rating({
        movieId: movieId,
        userId: req.user.id,
        rating: rating
      });
      newRating.save((err) => {
        if (err) {
          req.flash('errors', errors);
          return res.redirect('/movies/title/'+movieId);
        }
        req.flash('success', { msg: 'Rating saved successfuly.' });
        res.redirect('/movies/title/'+movieId);
      });
    }
  });
};

/**
 * GET /movies/myratings
 * Show movies rated by user.
 */
exports.getMoviesRated = (req, res) => {
  Rating.find({
    userId: req.user.id
  }, (err, ratings) => {
    if (err) { return next(err); }
    Movie.find({movieId: ratings.map((item) => {return item.movieId})}, (err, myMovies) => {
      if (err) { return next(err); }
      myMovies.forEach((item, index) => {
        item.rating = ratings.find((ra) => {return ra.movieId == item.movieId}).rating;
      });
      res.render('movies/rated', {
        title: 'My ratings',
        movies: myMovies
      });
    });
  });
};

/**
 * GET /recommendations
 * Show movies recommended to the user
 */
/*exports.getRecommendations = (req, res) => {
  Rating.find({
    userId: req.user.id
  }, (err, ratings) => {
    if (err) { return next(err); }
    if (ratings.length < 10) {
      // NEED MORE RATINGS
    } else {
      // GENERATE RECS
    }
    Movie.find({movieId: ratings.map((item) => {return item.movieId})}, (err, myMovies) => {
      if (err) { return next(err); }
      myMovies.forEach((item, index) => {
        item.rating = ratings.find((ra) => {return ra.movieId == item.movieId}).rating;
      });
      res.render('movies/rated', {
        title: 'My ratings',
        movies: myMovies
      });
    });
  });
};*/