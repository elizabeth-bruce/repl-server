const express = require('express'),
  cors = require('cors'),
  uuid = require('node-uuid'),
  SessionRegistry = require('../lib/session-registry'),
  SessionConnectionState = require('../lib/session-connection-state'),
  Config = require('../config/config');
 
let router = express.Router();

const corsOptions = {
    origin: Config.FRONTEND_WHITELIST_DOMAIN,
    credentials: true
};


const generateSessionId = function() {
    const sampleString = 'abcdefghijklmnopqrstufwxyzABCDEFGHIJKLMNOPQRSTUFWXYZ1234567890';
        idLength = 10;

    return [...Array(idLength)].map(() => {
        const samplePosition = Math.floor(Math.random() * sampleString.length);
        return sampleString[samplePosition];
    }).join('');
};

router.options('*', cors(corsOptions));

router.post(
  '/',
  cors(corsOptions),
  (req, res) => {
        let sessionId = generateSessionId();
        while (SessionRegistry.getInstance().hasSession(sessionId)) {
            sessionId = generateSessionId();
        }

        SessionRegistry.getInstance().add(sessionId);
        res.json({ sessionId });
   }
);

router.ws('/', (ws, req) => {});

router.ws('/:sessionId', (ws, req) => {
    let session = req.session;

    if (!session.token) {
        session.token = uuid.v4();
        session.save();
    }

    if (!SessionRegistry.getInstance().hasSession(req.params['sessionId'])) {
        ws.close();
        return;
    }

    const sessionState = new SessionConnectionState(req.params['sessionId'], ws, req.session.token);

    ws.on('message', sessionState.handleMessage.bind(sessionState));
    ws.on('close', sessionState.terminate.bind(sessionState));
  }
);

router.post('/:sessionId/alias', cors(corsOptions), (req, res) => {
    let session = req.session;
    const body = req.body;

    if (!session.token) {
        res.status(401).send('No authorization token');
    }

    if (!SessionRegistry.getInstance().hasSession(req.params['sessionId'])) {
        res.status(401).send('Session not found');
    }

    SessionRegistry.getInstance().registerAlias(req.params['sessionId'], session.token, body.alias);

    res.status(200).send('SUCCESS');
});

// Empty response solely for the Set-Cookie header
// that enables identification/communication with the rest of the endpoints in /sessions
router.get('/touch', cors(corsOptions), (req, res) => {
    let session = req.session;
    if (!session.token) {
        session.token = uuid.v4();
        session.save();
    }

    res.json();
});

router.get('/:sessionId/activeUsers', cors(corsOptions), (req, res) => {
    let session = req.session;

    if (!session.token) {
        res.status(401).send('No authorization token');
    }

    if (!SessionRegistry.getInstance().hasSession(req.params['sessionId'])) {
        res.status(401).send('Session not found');
    }

    const activeUsers = SessionRegistry.getInstance().getActiveUsers(req.params['sessionId']);

    res.json([...activeUsers]);
});

module.exports = router;
