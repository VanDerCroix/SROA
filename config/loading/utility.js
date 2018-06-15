// Utility
// import { getMovieIndexByTitle } from '../strategies/common';
const common = require('../strategies/common');

exports.addUserRating = function(userId, searchTitle, rating, MOVIES_IN_LIST) {
  const { id, title } = common.getMovieIndexByTitle(MOVIES_IN_LIST, searchTitle);
  console.log(id, title);
  return {
    userId,
    rating,
    movieId: id,
    title,
  };
}

exports.sliceAndDice = function(recommendations, MOVIES_BY_ID, count, onlyTitle) {
  recommendations = recommendations.filter(recommendation => MOVIES_BY_ID[recommendation.movieId]);

  recommendations = onlyTitle
    ? recommendations.map(mr => ({ title: MOVIES_BY_ID[mr.movieId].title, score: mr.score }))
    : recommendations.map(mr => ({ movie: MOVIES_BY_ID[mr.movieId], score: mr.score }));

  return recommendations
    .slice(0, count);
}
