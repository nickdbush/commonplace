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
      teams: [],
      guessedWords: 0
    };
  }

  addPlayerToTeam(player, team) {
    let teamIndex = _.findIndex(this.state.teams, ['name', team]);
    if(teamIndex === -1) {
      this.state.teams.push({name: team, members: [player], score: 0});
      return;
    }
    this.state.teams[teamIndex].members.push(player);
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
    
    // FIND TEAM PLAYER IS IN, ADD SCORES
    let teamIndex = _.findIndex(this.state.teams, team => _.includes(team.members, player));
    if(teamIndex === -1) {
      return points;
    }

    this.state.teams[teamIndex].score += points;
    return points;
  }

  getScoreForTeam(team) {
    let teamIndex = _.findIndex(this.state.teams, ['name', team]);
    if(teamIndex === -1) {
      return 0;
    } else {
      return this.state.teams[teamIndex].score;
    }
  }
  
  getScoreForPlayer(player) {
    let teamIndex = _.findIndex(this.state.teams, team => _.includes(team.members, player));
    if(teamIndex === -1) {
      return 0;
    } else {
      return this.state.teams[teamIndex].score;
    }
  }
  
  getTeamNameOfPlayer(player) {
    let teamIndex = _.findIndex(this.state.teams, team => _.includes(team.members, player));
    if(teamIndex === -1) {
      return null;
    } else {
      return this.state.teams[teamIndex].name;
    }
  } 
  
  getScores() {
    return _.map(this.state.teams, team => ({name: team.name, score: team.score}));
  }
};