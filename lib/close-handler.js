'use strict';

const SessionRegistry = require('./session-registry');

const closeHandler = function(server) {
    process.on('SIGTERM', function() {
        server.close();
    });
    server.on('close', function() {
        SessionRegistry.getInstance().clear();
    });
};

module.exports = closeHandler;
