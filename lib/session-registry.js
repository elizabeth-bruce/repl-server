'use strict';

const Session = require('./session');

const SESSION_TIMEOUT_LENGTH = 15 * 60 * 1000;

const SessionRegistry = (function() {
    let instance;

    function init() {
        let sessions = new Map();

        function setSessionTimeout(sessionId, timeout) {
            if (!sessions.has(sessionId)) {
                throw new Error(`No active session ${sessionId}`);
            }
            
            let session = sessions.get(sessionId);
            if (session.timeout) {
                clearTimeout(session.timeout);
            }
            session.timeout = setTimeout(session.terminate.bind(session), timeout);
        }

        function add(sessionId) {
             let session = new Session(sessionId);
             sessions.set(sessionId, session);
             setSessionTimeout(sessionId, SESSION_TIMEOUT_LENGTH);

             return sessionId;
        }

        function execute(sessionId, data) {
            if (!sessions.has(sessionId)) {
                throw new Error(`No active session ${sessionId}`);
            }

            let session = sessions.get(sessionId);
            session.execute(data);
            setSessionTimeout(sessionId, SESSION_TIMEOUT_LENGTH);
        }

        function remove(sessionId) {
            if (!sessions.has(sessionId)) {
                throw new Error(`No active session ${sessionId}`);
            }

            let session = sessions.get(sessionId);

            session.terminate();
            sessions.delete(sessionId);
        }

        function hasSession(sessionId) {
            return sessions.has(sessionId);
        }

        function resetTimeout(sessionId) {
            setSessionTimeout(sessionId, SESSION_TIMEOUT_LENGTH);
        }

        function subscribe(sessionId, fn) {
            if (!sessions.has(sessionId)) {
                throw new Error(`No active session ${sessionId}`);
            }

            let session = sessions.get(sessionId);

            return session.subscribe(fn);
        }

        function registerAlias(sessionId, token, alias) {
            if (!sessions.has(sessionId)) {
                throw new Error(`No active session ${sessionId}`);
            }

            let session = sessions.get(sessionId);

            return session.registerAlias(token, alias);
        }

        function addActiveUser(sessionId, userId) {
            if (!sessions.has(sessionId)) {
                throw new Error(`No active session ${sessionId}`);
            }
            let session = sessions.get(sessionId);

            session.addActiveUser(userId);
        }

        function removeActiveUser(sessionId, userId) {
            if (!sessions.has(sessionId)) {
                throw new Error(`No active session ${sessionId}`);
            }
            let session = sessions.get(sessionId);

            session.removeActiveUser(userId);
        }

        function handleNewConnection(sessionId, token) {
            if (!sessions.has(sessionId)) {
                throw new Error(`No active session ${sessionId}`);
            }
            let session = sessions.get(sessionId);

            session.handleNewConnection(token);
        }
        

        function clear() {
            for (let [ _, session] of sessions.entries()) {
                session.terminate();
            }

            sessions.clear();
        }

        return {
            add,
            remove,
            hasSession,
            clear,
            subscribe,
            resetTimeout,
            handleNewConnection,
            execute,
            registerAlias
        };
    }

    return {
        getInstance() {
            if (!instance) {
                instance = init();
            }
            return instance;
        }
    };
})();

module.exports = SessionRegistry;
