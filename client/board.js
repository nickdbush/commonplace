'use strict';

var client = new Faye.Client('/faye');

var model = new Vue({
    el: '#board',
    data: {
        open: false,
        teams: []
    },
    methods: {
        toggleState: toggleState
    }
});

var changingState = false;

function toggleState() {
    if (changingState) return;

    var url = model.open ? '/stopgame' : '/startgame';
    changingState = true;
    axios.get(url);
}

axios.post('/gamestate').then(function (response) {
    if (response.status === 200) {
        model.teams = response.data.scores;
        model.open = response.data.open;
    } else {
        console.error("Response with status " + response.data);
    }
});

client.subscribe('/update', function (teams) {
    if (!teams || !Array.isArray(teams)) return;
    model.teams = teams;
});

client.subscribe('/start', function () {
    model.open = true;
    changingState = false;
});

client.subscribe('/stop', function () {
    model.open = false;
    changingState = false;
});