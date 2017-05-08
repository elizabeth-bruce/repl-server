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
            session.timeout = setTimeout(remove.bind(null, sessionId), timeout);
        }

        function add(sessionId, sessionTimeoutLength=SESSION_TIMEOUT_LENGTH) {
             let session = new Session(sessionId);
             sessions.set(sessionId, session);
             setSessionTimeout(sessionId, sessionTimeoutLength);

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

        function resetTimeout(sessionId, sessionTimeoutLength=SESSION_TIMEOUT_LENGTH) {
            setSessionTimeout(sessionId, sessionTimeoutLength);
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

        function removeActiveUser(sessionId, userId) {
            if (!sessions.has(sessionId)) {
                throw new Error(`No active session ${sessionId}`);
            }
            let session = sessions.get(sessionId);

            session.removeActiveUser(userId);
        }

        function getActiveUsers(sessionId) {
            if (!sessions.has(sessionId)) {
                throw new Error(`No active session ${sessionId}`);
            }
            let session = sessions.get(sessionId);

            return session.getActiveUsers();
        }

        function handleNewConnection(sessionId, token) {
            if (!sessions.has(sessionId)) {
                throw new Error(`No active session ${sessionId}`);
            }
            let session = sessions.get(sessionId);

            return session.handleNewConnection(token);
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
            handleNewConnection,
            removeActiveUser,
            getActiveUsers,
            subscribe,
            resetTimeout,
            execute,
            registerAlias,
            // Expose for testing
            '_sessions': sessions
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
