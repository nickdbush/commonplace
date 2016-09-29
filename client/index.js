'use strict';

var model = new Vue({
  el: '#commonplace',
  data: {
    round_name: "Words",
    score: 0,
    last_guess: null,
    message: null
  },
  methods: {
    submit: submit
  }
});


axios.post('/state').then(function (response) {
  if (response.status == 200) {
    model.score = response.data.score;
  } else {
    console.error("Response with status " + response.data);
  }
});

function submit(event) {
  event.preventDefault();
  var guess = model.guess;
  
  model.guess = "";
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