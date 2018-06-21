const Movie = require('../models/Movie');

/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  // res.render('home', {
  //   title: 'Home'
  // });
  return res.redirect('/movies/1');
};

/**
 * GET /about
 * Home page.
 */
exports.getAbout = (req, res) => {
  res.render('about', {
    title: 'Author'
  });
};
