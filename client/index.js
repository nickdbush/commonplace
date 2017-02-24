'use strict';

var client = new Faye.Client('/faye');

var model = new Vue({
  el: '#commonplace',
  data: {
    round_name: 'Passwords',
    score: 0,
    last_guess: null,
    message: null,
    team: '#0f0b2b',
    colours: ['#f5f7fa', '#c3cfe2'],
    open: false
  },
  methods: {
    submit: submit
  }
});

axios.post('/state').then(function (response) {
  if (response.status == 200) {
    model.score = response.data.score;
    model.team = response.data.team;
    model.open = response.data.open;
    if (model.open) {
      model.colours = generateColours();
    }
  } else {
    console.error("Response with status " + response.data);
  }
});

function submit(event) {
  event.preventDefault();
  var guess = model.guess.toLowerCase();

  model.guess = "";
  model.last_guess = guess;
  model.message = " is being checked";
  axios.post('/guess', {
    word: guess
  }).then(function (response) {
    if (response.status == 200) {
      model.last_guess = response.data.word;
      if (response.data.result == -1) {
        // Already guessed
        model.message = " was already guessed";
      } else if (response.data.result == -2) {
        // Not found
        model.message = " was not found";
      } else {
        model.score = response.data.score;
        model.message = " got you " + response.data.result + " points";
      }
    } else {
      console.error("Response with status " + response.data);
    }
  });
}

client.subscribe('/update', function (teams) {
  if (!teams || !Array.isArray(teams)) return;
  for (var i = 0; i < teams.length; i++) {
    if (teams[i].name === model.team) {
      model.score = teams[i].score;
      break;
    }
  }
});

client.subscribe('/start', function () {
  model.colours = generateColours();
  model.open = true;
  Vue.nextTick(function () {
    document.getElementById('input').focus();
  });
});

client.subscribe('/stop', function () {
  model.colours = ['#f5f7fa', '#c3cfe2'];
  model.open = false;
});

function generateColours() {
  return [model.team, new tinycolor(model.team).darken(8).toHexString()];
}