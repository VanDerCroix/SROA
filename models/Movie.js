const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  movieId: { type: Number, unique: true },
  title: String,
  adult: String,
  release: String,
  poster_path: String,
  runtime: String,
  budget: String,
  revenue: String,
  language: String,
  genres: Array,
});

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;

/*
  for (var i = 21; i <= 300; i++) {
    pelis.push({
      movieId: parseInt(prepm.MOVIES_IN_LIST[i].id),
      title: prepm.MOVIES_IN_LIST[i].title,
      adult: prepm.MOVIES_IN_LIST[i].adult,
      release: prepm.MOVIES_IN_LIST[i].release,
      poster_path: prepm.MOVIES_IN_LIST[i].poster_path,
      runtime: prepm.MOVIES_IN_LIST[i].runtime,
      budget: prepm.MOVIES_IN_LIST[i].budget,
      revenue: prepm.MOVIES_IN_LIST[i].revenue,
      language: prepm.MOVIES_IN_LIST[i].language,
      genres: prepm.MOVIES_IN_LIST[i].genres.map(function(num) {return num.name;}),
    });
  }
  Movie.insertMany(pelis, function(error, docs) {
    if(error) {
      console.log(error);
    }
    if(docs) {
      console.log(docs.length);
    }
  });
  */