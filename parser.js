'use strict';
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

module.exports = {
  sanitizeInput(input) {
    return input.toLowerCase().replace(/[^a-z|^0-9]/ig,"").replace(/\s{2,}/g," ").trim();
  },
  loadDataFile(filename, reversed) {
    let file = path.normalize(path.join('data', filename));
    let words = fs.readFileSync(file, 'utf8').split('\n').map(v => this.sanitizeInput(v));
    words = _.uniq(words);
    if(reversed) {
      return words.reverse();
    } else {
      return words;
    }
  }
};