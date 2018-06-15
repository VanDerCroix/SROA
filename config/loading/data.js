// import fs from 'fs';
// import csv from 'fast-csv';
const fs = require('fs');
const csv = require('fast-csv');

let MOVIES_META_DATA = {};
let MOVIES_KEYWORDS = {};
let RATINGS = [];

exports.moviesMetaDataPromise = new Promise((resolve) =>
  fs
    .createReadStream('./config/data/movies_metadata.csv')
    .pipe(csv({ headers: true }))
    .on('data', fromMetaDataFile)
    .on('end', () => resolve(MOVIES_META_DATA)));

exports.moviesKeywordsPromise = new Promise((resolve) =>
  fs
    .createReadStream('./config/data/keywords.csv')
    .pipe(csv({ headers: true }))
    .on('data', fromKeywordsFile)
    .on('end', () => resolve(MOVIES_KEYWORDS)));

exports.ratingsPromise = new Promise((resolve) =>
  fs
    .createReadStream('./config/data/ratings_small.csv')
    .pipe(csv({ headers: true }))
    .on('data', fromRatingsFile)
    .on('end', () => resolve(RATINGS)));

function fromMetaDataFile(row) {
  MOVIES_META_DATA[row.id] = {
    id: row.id,
    adult: row.adult,
    budget: row.budget,
    genres: softEval(row.genres, []),
    homepage: row.homepage,
    language: row.original_language,
    title: row.original_title,
    overview: row.overview,
    popularity: row.popularity,
    studio: softEval(row.production_companies, []),
    release: row.release_date,
    revenue: row.revenue,
    runtime: row.runtime,
    voteAverage: row.vote_average,
    voteCount: row.vote_count,
    poster_path: row.poster_path,
  };
}

function fromKeywordsFile(row) {
  MOVIES_KEYWORDS[row.id] = {
    keywords: softEval(row.keywords, []),
  };
}

function fromRatingsFile(row) {
  RATINGS.push(row);
}

function softEval(string, escape) {
  if (!string) {
    return escape;
  }

  try {
    return eval(string);
  } catch (e) {
    return escape;
  }
}
// export function loadData() {
//   	Promise.all([
// 		moviesMetaDataPromise,
// 		moviesKeywordsPromise,
// 		ratingsPromise,
// 	]).then(values => { 
// 		// console.log(values); // [3, 1337, "foo"] 
// 		return values
// 	});
// }
