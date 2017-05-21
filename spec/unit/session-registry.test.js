const SessionRegistry = require('../../lib/session-registry');

describe('SessionRegistry', () => {
    describe('.add', () => {
        it('adds a new session to the registry', () => {
            SessionRegistry.getInstance().add('abcde');

            expect(SessionRegistry.getInstance().hasSession('abcde')).toBe(true);
            SessionRegistry.getInstance().remove('abcde');
        });
        it('sets a timeout that removes the session', (done) => {
            SessionRegistry.getInstance().add('abcde', 999);
            setTimeout(() => {
                expect(SessionRegistry.getInstance().hasSession('abcde')).toBe(false);
                done();
            }, 1000); 
        });
    });
    describe('.remove', () => {
        it('when the session exists', () => {
            it('removes the session', () => {
                SessionRegistry.getInstance().add('abcde');
                expect(SessionRegistry.getInstance().hasSession('abcde')).toBe(true);
                SessionRegistry.getInstance().remove('abcde');
                expect(SessionRegistry.getInstance().hasSession('abcde')).toBe(false);
            });
        });
        it('when the session does not exist', () => {
            it('throws an error', () => {
                const error = new Error('No active session abcde');
                expect(() => { SessionRegistry.getInstance.remove('abcde'); }).toThrow(error);
            });
        });
    });
    describe('.execute', () => {
        it('routes the execution to the provided session', () => {
            SessionRegistry.getInstance().add('abcde');
            const session = SessionRegistry.getInstance()._sessions.get('abcde');
            spyOn(session, 'execute');
            const command = {
                token: 'foo',
                code: 'let a = 5;'
            };

            SessionRegistry.getInstance().execute('abcde', command);
            expect(session.execute).toHaveBeenCalled();
            SessionRegistry.getInstance().remove('abcde');
        });
    });
    describe('.resetTimeout', () => {
        it('resets the timeout of a given session', (done) => {
            SessionRegistry.getInstance().add('abcde');
            SessionRegistry.getInstance().resetTimeout('abcde', 999);
            setTimeout(() => {
                expect(SessionRegistry.getInstance().hasSession('abcde')).toBe(false);
                done();
            }, 1000);
        });
    });
    describe('.registerAlias', () => {
        it('routes the alias registration to the provided session', () => {
            SessionRegistry.getInstance().add('abcde');
            const session = SessionRegistry.getInstance()._sessions.get('abcde');
            spyOn(session, 'registerAlias');

            SessionRegistry.getInstance().registerAlias('abcde', 'foo', 'bar');
            expect(session.registerAlias).toHaveBeenCalled();
            session.terminate();
        });
    });
    describe('.handleNewConnection', () => {
        it('routes the new connection to the provided session', () => {
            SessionRegistry.getInstance().add('abcde');
            const session = SessionRegistry.getInstance()._sessions.get('abcde');
            spyOn(session, 'handleNewConnection');

            SessionRegistry.getInstance().handleNewConnection('abcde', 'foo');

            expect(session.handleNewConnection).toHaveBeenCalled();
            SessionRegistry.getInstance().remove('abcde');
        });
    });
    describe('.removeActiveUser', () => {
        it('routes the disconnection to the provided session', () => {
            SessionRegistry.getInstance().add('abcde');
            const session = SessionRegistry.getInstance()._sessions.get('abcde');
            spyOn(session, 'removeActiveUser');

            SessionRegistry.getInstance().removeActiveUser('abcde', 'foo');

            expect(session.removeActiveUser).toHaveBeenCalled();
            SessionRegistry.getInstance().remove('abcde');
        });
    });
    describe('.getActiveUsers', () => {
        it('routes the call to the provided session', () => {
            SessionRegistry.getInstance().add('abcde');
            const session = SessionRegistry.getInstance()._sessions.get('abcde'),
                expectedUsers = [ { userId: 'foo', alias: 'bar' } ];

            spyOn(session, 'getActiveUsers').and.returnValue(expectedUsers);

            expect(SessionRegistry.getInstance().getActiveUsers('abcde')).toEqual(expectedUsers);

            expect(session.getActiveUsers).toHaveBeenCalled();
            SessionRegistry.getInstance().remove('abcde');
        });
    });
    describe('.clear', () => { 
        it('terminates and removes all sessions from the registry', () => {
            SessionRegistry.getInstance().add('foo');
            SessionRegistry.getInstance().add('bar');
            SessionRegistry.getInstance().add('baz');

            const sessions = [...SessionRegistry.getInstance()._sessions].map((sessionMap) => {
                let [_, session] = sessionMap;
                spyOn(session, 'terminate').and.callThrough();
                return session;
            });

            SessionRegistry.getInstance().clear();

            expect(SessionRegistry.getInstance()._sessions.size).toEqual(0);

            sessions.forEach((session) => { 
                expect(session.terminate).toHaveBeenCalled();
            });
        });
    });
});
