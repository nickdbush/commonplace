'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  sanitizeInput(input) {
    return input.toLowerCase().replace(/[^a-z|^0-9]/ig,"").replace(/\s{2,}/g," ").trim();
  },
  loadDataFile(filename) {
    let file = path.normalize(path.join('data', filename));
    return fs.readFileSync(file, 'utf8').split('\n').map((v) => {return this.sanitizeInput(v)});
  }
};