'use strict';
const express = require('express');
// const faye = require('faye');
const uuid = require('uuid');
const http = require('http');
const parser = require('./parser');
const Game = require('./game');

class Server {
  constructor() {
    this.app = express();
    // this.bayeux = new faye.NodeAdapter({mount: '/faye'});
    this.server = http.createServer(this.app);
    // this.bayeux.attach(server);
    // Any modifications to the order should be done NOW!
    this.game = new Game(parser.loadDataFile('words.txt'));

    // Initialize the express app
    this.app.use(require('body-parser').json());
    this.app.use(require('body-parser').urlencoded({ extended: true }));
    this.app.use(require('cookie-parser')());
    this.app.use(express.static('./client'));

    this.app.use((req, res, next) => {
      if (req.cookies.playerid) {
        req.player_id = req.cookies.playerid;
      } else {
        let id = uuid.v4();
        res.cookie('playerid', id, { expires: new Date(Date.now() + 900000), httpOnly: true });
        req.player_id = id;
      }
      next();
    });

    this.app.post('/guess', (req, res) => {
      // This should be called result, or something like that
      let guess = this.game.guess(req.body.word || "", req.player_id);
      console.log(`${parser.sanitizeInput(req.body.word)} (${guess})`);
      let total = this.game.getScore(req.player_id);
      res.json({ result: guess, score: total, word: parser.sanitizeInput(req.body.word) });
    });

    this.app.post('/state', (req, res) => {
      res.json({ score: this.game.getScore(req.player_id) });
    });

    this.app.get('/startgame', (req, res) => {
      this.game.state.active = true;
      res.sendStatus(200);
    });

    this.app.get('/stopgame', (req, res) => {
      this.game.state.active = false;
      req.url = '/command';
      res.sendStatus(200);
    });
  }

  start(port, cb) {
    this.port = port;
    this.server.listen(port, cb);
  }
}

const server = new Server();
server.start(8080, () => {
  console.log(`Server listening on *:${server.port}`);
});