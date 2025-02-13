// import natural from 'natural';
const natural = require('natural');

natural.PorterStemmer.attach();

exports.prepareMovies = function(moviesMetaData, moviesKeywords) {
  console.log('Preparing Movies ... \n');

  // Pre-processing movies for unified data structure
  // E.g. get overview property into same shape as studio property
  console.log('(1) Zipping Movies');
  let MOVIES_IN_LIST = zip(moviesMetaData, moviesKeywords);
  MOVIES_IN_LIST = withTokenizedAndStemmed(MOVIES_IN_LIST, 'overview');
  MOVIES_IN_LIST = fromArrayToMap(MOVIES_IN_LIST, 'overview');

  // sort by popularity, slice 1k
  // console.log('...sorting and slicing');
  // MOVIES_IN_LIST.sort((a, b) => b.popularity - a.popularity);
  // MOVIES_IN_LIST.sort((a, b) => new Date(b.release)-new Date(a.release));
  MOVIES_IN_LIST.sort((a, b) => parseInt(b.revenue) - parseInt(a.revenue));
  
  MOVIES_IN_LIST = MOVIES_IN_LIST.slice(0, 5000);


  // Keep a map of movies for later reference
  let MOVIES_BY_ID = MOVIES_IN_LIST.reduce(byId, {});

  console.log('(2) Creating Dictionaries');
  // Preparing dictionaries for feature extraction
  let DICTIONARIES = prepareDictionaries(MOVIES_IN_LIST);

  // Feature Extraction:
  // Map different types to numerical values (e.g. adult to 0 or 1)
  // Map dictionaries to partial feature vectors
  console.log('(3) Extracting Features');
  let X = MOVIES_IN_LIST.map(toFeaturizedMovies(DICTIONARIES));

  // Extract a couple of valuable coefficients
  // Can be used in a later stage (e.g. feature scaling)
  console.log('(4) Calculating Coefficients');
  let { means, ranges } = getCoefficients(X);

  // Synthesize Features:
  // Missing features (such as budget, release, revenue)
  // can be synthesized with the mean of the features
  console.log('(5) Synthesizing Features');
  X = synthesizeFeatures(X, means, [0, 1, 2, 3, 4, 5, 6]);

  // Feature Scaling:
  // Normalize features based on mean and range vectors
  console.log('(6) Scaling Features \n');
  X = scaleFeatures(X, means, ranges);

  return {
    MOVIES_BY_ID,
    MOVIES_IN_LIST,
    X,
  };
}

// export function byId(moviesById, movie) {
let byId = function(moviesById, movie) {
  moviesById[movie.id] = movie;
  return moviesById;
}

let prepareDictionaries = function(movies) {
  let genresDictionary = toDictionary(movies, 'genres');
  let studioDictionary = toDictionary(movies, 'studio');
  let keywordsDictionary = toDictionary(movies, 'keywords');
  let overviewDictionary = toDictionary(movies, 'overview');

  // Customize the threshold to your own needs
  // Depending on threshold you get a different size of a feature vector for a movie
  // The following case attempts to keep feature vector small for computational efficiency
  genresDictionary = filterByThreshold(genresDictionary, 1);
  studioDictionary = filterByThreshold(studioDictionary, 75);
  keywordsDictionary = filterByThreshold(keywordsDictionary, 150);
  overviewDictionary = filterByThreshold(overviewDictionary, 750);

  return {
    genresDictionary,
    studioDictionary,
    keywordsDictionary,
    overviewDictionary,
  };
}

let scaleFeatures = function(X, means, ranges) {
  return X.map((row) => {
    return row.map((feature, key) => {
      return (feature - means[key]) / ranges[key];
    });
  });
};

let synthesizeFeatures = function(X, means, featureIndexes) {
  return X.map((row) => {
    return row.map((feature, key) => {
      if (featureIndexes.includes(key) && feature === 'undefined') {
        return means[key];
      } else {
        return feature;
      }
    });
  });
}

let getCoefficients = function(X) {
  const M = X.length;

  const initC = {
    sums: [],
    mins: [],
    maxs: [],
  };

  const helperC = X.reduce((result, row) => {
    if (row.includes('undefined')) {
      return result;
    }

    return {
      sums: row.map((feature, key) => {
        if (result.sums[key]) {
          return result.sums[key] + feature;
        } else {
          return feature;
        }
      }),
      mins: row.map((feature, key) => {
        if (result.mins[key] === 'undefined') {
          return result.mins[key];
        }

        if (result.mins[key] <= feature) {
          return result.mins[key];
        } else {
          return feature;
        }
      }),
      maxs: row.map((feature, key) => {
        if (result.maxs[key] === 'undefined') {
          return result.maxs[key];
        }

        if (result.maxs[key] >= feature) {
          return result.maxs[key];
        } else {
          return feature;
        }
      }),
    };
  }, initC);

  const means = helperC.sums.map(value => value / M);
  const ranges =  helperC.mins.map((value, key) => helperC.maxs[key] - value);

  return { ranges, means };
}

let toFeaturizedMovies = function(dictionaries) {
  return function toFeatureVector(movie) {
    const featureVector = [];

    featureVector.push(toFeaturizedNumber(movie, 'budget'));
    featureVector.push(toFeaturizedNumber(movie, 'popularity'));
    featureVector.push(toFeaturizedNumber(movie, 'revenue'));
    featureVector.push(toFeaturizedNumber(movie, 'runtime'));
    featureVector.push(toFeaturizedNumber(movie, 'voteAverage'));
    featureVector.push(toFeaturizedNumber(movie, 'voteCount'));
    featureVector.push(toFeaturizedRelease(movie));

    featureVector.push(toFeaturizedAdult(movie));
    featureVector.push(toFeaturizedHomepage(movie));
    featureVector.push(toFeaturizedLanguage(movie));

    featureVector.push(...toFeaturizedFromDictionary(movie, dictionaries.genresDictionary, 'genres'));
    featureVector.push(...toFeaturizedFromDictionary(movie, dictionaries.overviewDictionary, 'overview'));
    featureVector.push(...toFeaturizedFromDictionary(movie, dictionaries.studioDictionary, 'studio'));
    featureVector.push(...toFeaturizedFromDictionary(movie, dictionaries.keywordsDictionary, 'keywords'));

    return featureVector;
  }
}

let toFeaturizedRelease = function(movie) {
  return movie.release ? Number((movie.release).slice(0, 4)) : 'undefined';
}

let toFeaturizedAdult = function(movie) {
  return movie.adult === 'False' ? 0 : 1;
}

let toFeaturizedHomepage = function(movie) {
  return movie.homepage ? 0 : 1;
}

let toFeaturizedLanguage = function(movie) {
  return movie.language === 'en' ? 1 : 0;
}

let toFeaturizedFromDictionary = function(movie, dictionary, property) {
  // Fallback, because not all movies have associated keywords
  const propertyIds = (movie[property] || []).map(value => value.id);
  const isIncluded = (value) => propertyIds.includes(value.id) ? 1 : 0;
  return dictionary.map(isIncluded);
}

let toFeaturizedNumber = function(movie, property) {
  const number = Number(movie[property]);

  // Fallback for NaN
  if (number > 0 || number === 0) {
    return number;
  } else {
    return 'undefined';
  }
}

// Refactored in favor of generic function

// function toFeaturizedGenres(movie, genresDictionary) {
//   const movieGenreIds = movie.genres.map(genre => genre.id);
//   const isGenre = (genre) => movieGenreIds.includes(genre.id) ? 1 : 0;
//   return genresDictionary.map(isGenre);
// }

// function getFeatureScalingCoefficients(movies, 'budget') {
//   const { range, mean } = movies.reduce((result, value, property) => {

//   }, {});

//   return { range, mean };
// }

// function toFeaturizedLanguageProperty(movie) {
//   return 0;
// }

let fromArrayToMap = function(array, property) {
  return array.map((value) => {
    const transformed = value[property].map((value) => ({
      id: value,
      name: value,
    }));

    return { ...value, [property]: transformed };
  });
}

let withTokenizedAndStemmed = function(array, property) {
  return array.map((value) => ({
    ...value,
    [property]: value[property].tokenizeAndStem(),
  }));
}

let filterByThreshold = function(dictionary, threshold) {
  return Object.keys(dictionary)
    .filter(key => dictionary[key].count > threshold)
    .map(key => dictionary[key]);
}

let toDictionary = function(array, property) {
  const dictionary = {};

  array.forEach((value) => {
    // Fallback for null value after refactoring
    (value[property] || []).forEach((innerValue) => {
      if (!dictionary[innerValue.id]) {
        dictionary[innerValue.id] = {
          ...innerValue,
          count: 1,
        };
      } else {
        dictionary[innerValue.id] = {
          ...dictionary[innerValue.id],
          count: dictionary[innerValue.id].count + 1,
        }
      }
    });
  });

  return dictionary;
}

// Refactored in favor of toDictionary

// export function toGenresDictionary(movies) {
//   const genresDictionary = {};

//   movies.forEach((movie) => {
//     movie.genres.forEach((genre) => {
//       if (!genresDictionary[genre.id]) {
//         genresDictionary[genre.id] = {
//           name: genre.name,
//           count: 1,
//         };
//       } else {
//         genresDictionary[genre.id] = {
//           name: genre.name,
//           count: genresDictionary[genre.id].count + 1,
//         }
//       }
//     });
//   });

//   return genresDictionary;
// }

let zip = function(movies, keywords) {
  return Object.keys(movies).map(mId => ({
    ...movies[mId],
    ...keywords[mId],
  }));
}

// export default prepareMovies;