'use strict';
const express = require('express');
const faye = require('faye');
const uuid = require('uuid');
const http = require('http');
const parser = require('./parser');
const Game = require('./game');

const COOKIE_VERSION = 0;
const TEAMS = [
  '#03A9F4',
  '#9C27B0',
  '#FF5722',
  '#4CAF50'
];
let lastTeamIndex = -1;

class Server {
  constructor() {
    this.app = express();
    this.bayeux = new faye.NodeAdapter({mount: '/faye'});
    this.server = http.createServer(this.app);
    this.bayeux.attach(this.server);
    // Any modifications to the order should be done NOW!
    this.game = new Game(parser.loadDataFile('passwords.txt', true));

    // Initialize the express app
    this.app.use(require('body-parser').json());
    this.app.use(require('body-parser').urlencoded({ extended: true }));
    this.app.use(require('cookie-parser')());
    this.app.use(express.static('./client'));

    let idMiddleware = (req, res, next) => {
      if (req.cookies['playerid_' + COOKIE_VERSION]) {
        req.player_id = req.cookies['playerid_' + COOKIE_VERSION];
      } else {
        let id = uuid.v4();
        res.cookie('playerid_' + COOKIE_VERSION, id, { expires: new Date(Date.now() + 900000), httpOnly: true });
        req.player_id = id;
      }
      if(!this.game.getTeamNameOfPlayer(req.player_id)) {
        let thisTeamIndex = (lastTeamIndex + 1) % TEAMS.length;
        let team = TEAMS[thisTeamIndex];
        this.game.addPlayerToTeam(req.player_id, team);
        console.log(`Assigned ${req.player_id} to ${team}`);
        lastTeamIndex = thisTeamIndex;
      }
      next();
    };

    this.app.post('/guess', idMiddleware, (req, res) => {
      let points = this.game.guess(req.body.word || "", req.player_id);
      console.log(`${parser.sanitizeInput(req.body.word)} (${points})`);
      this.updateClients();
      res.json({ result: points, score: this.game.getScoreForPlayer(req.player_id), word: parser.sanitizeInput(req.body.word) });
    });

    this.app.post('/state', idMiddleware, (req, res) => {
      res.json({ team: this.game.getTeamNameOfPlayer(req.player_id), score: this.game.getScoreForPlayer(req.player_id), open: this.game.state.active });
    });
    
    this.app.post('/gamestate', (req, res) => {
      res.json({scores: this.game.getScores(), open: this.game.state.active});
    });

    this.app.get('/startgame', (req, res) => {
      this.game.state.active = true;
      this.bayeux.getClient().publish('/start', {});
      console.log('GAME STARTED');
      res.sendStatus(200);
      this.updateClients();
    });

    this.app.get('/stopgame', (req, res) => {
      this.game.state.active = false;
      this.bayeux.getClient().publish('/stop', {});
      console.log('GAME STOPPED');
      res.sendStatus(200);
      this.updateClients();
    });
  }
  
  updateClients() {
    this.bayeux.getClient().publish('/update', this.game.getScores());
  }

  start(port, cb) {
    this.port = port;
    this.server.listen(port, () => {
      this.updateClients();
      cb();
    });
    
  }
}

const server = new Server();
server.start(process.env.PORT || 8080, () => {
  console.log(`Server listening on *:${server.port}`);
});