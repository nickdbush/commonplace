'use strict';
const uuid = require('uuid');
const debounce = require('debounce');
const _ = require('lodash');
const parser = require('./parser');

module.exports = class Game {
  constructor(words, increment) {
    this.id = uuid.v4();
    // Maybe have this as an object, i.e {know: 912, water: 911}
    this.words = words.map((v, index) => {return {word: v, guessed: false, points: (increment || true) ? words.length - index : index + 1}});
    this.state = {
      active: false,
      scores: {},
      guessedWords: 0
    };
  }

  guess(word, player) {
    word = parser.sanitizeInput(word);
    let index = _.findIndex(this.words, {word: word});
    // If the word is not on the list, return
    if(index === -1 || !this.state.active) return -2;
    // If the word has already been guessed, return
    if(this.words[index].guessed) return -1;
    // Else, mark the word as guessed and return the value
    this.words[index].guessed = true;
    this.state.guessedWords ++;
    let points = this.words[index].points;
    
    if(!this.state.scores[player]) this.state.scores[player] = 0;
    this.state.scores[player] += points;

    return points;
  }

  getScore(player) {
    return this.state.scores[player] || 0;
  }
};