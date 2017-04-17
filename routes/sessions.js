const express = require('express'),
  passport = require('passport'),
  uuid = require('node-uuid'),
  SessionRegistry = require('../lib/session-registry'),
  SessionConnectionState = require('../lib/session-connection-state'); 
 
let router = express.Router();

router.post(
  '/',
  // TODO: Reenable user authentication after MVP 
  // passport.authenticate('api', { session: false }),
  (req, res) => {
        res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
        res.json({ uuid: SessionRegistry.getInstance().add(uuid.v4()) });
   }
);

router.ws('/:sessionId', (ws, req) => {
    let session = req.session;

    if (!session.token) {
        session.token = uuid.v4();
        session.save();
    }

    if (!SessionRegistry.getInstance().hasSession(req.params['sessionId'])) {
        res.send(401, 'Session not found');
    }

    const sessionState = new SessionConnectionState(req.params['sessionId'], ws, req.session.token);

    ws.on('message', sessionState.handleMessage.bind(sessionState));
    ws.on('close', sessionState.terminate.bind(sessionState));
  }
);

router.post('/:sessionId/alias', (req, res) => {
    let session = req.session,
        body = JSON.parse(req.body);

    if (!session.token) {
        res.send(401, 'No authorization token');
    }

    if (!SessionRegistry.getInstance().hasSession(req.params['sessionId'])) {
        res.send(401, 'Session not found');
    }

    SessionRegistry.getInstance().registerAlias(req.params['sessionId'], session.token, body.alias);

});

// Empty response solely for the Set-Cookie header
// that enables identification/communication with the rest of the endpoints in /sessions
router.get('/touch', (req, res) => {
    let session = req.session;
    if (!session.token) {
        session.token = uuid.v4();
        session.save();
    }

    res.json();
});

router.get('/:sessionId/activeUsers', (req, res) => {
    let session = req.session;

    if (!session.token) {
        res.send(401, 'No authorization token');
    }

    if (!SessionRegistry.getInstance().hasSession(req.params['sessionId'])) {
        res.send(401, 'Session not found');
    }

    const activeUsers = SessionRegistry.getInstance().getActiveUsers(req.params['sessionId']);

    res.json(JSON.stringify([...activeUsers]));
});

module.exports = router;
