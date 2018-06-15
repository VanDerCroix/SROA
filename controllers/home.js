const Movie = require('../models/Movie');

/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  // res.render('home', {
  //   title: 'Home'
  // });
Movie.find({}, (err, mo) => {
  if (err) { return next(err); }
  if (mo.length > 0) {
    // console.log(mo.length);
    res.render('movies/all', {
      title: 'Peliculas',
      movies: mo,
      page: 1
    });
  } else {
    res.render('movies/error');
  }
}).limit(20);
};
