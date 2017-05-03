'use strict';

const Session = require('../../lib/session'),
    MockSessionUserClient = require('../support/mock-session-user-client');

describe('Session', () => {
    describe('constructor', () => {
        it('initializes session state', () => {
            let session = new Session('abcde');

            expect(session.sessionId).toEqual('abcde');
            expect(session.worker.child.pid).not.toBeNull();
            expect(session.worker.child.connected).toBe(true);

            expect(session.tokens.size).toEqual(0);
            expect(session.activeUsers.size).toEqual(0);

            expect(session.log).toEqual([]);
        });
    });
    describe('.terminate', () => {
        it('frees all resources associated with the session', () => {
            let session = new Session('abcde');

            session.terminate();

            expect(session.worker.child.killed).toBe(true);
            expect(session.subject.isStopped).toBe(true);
            expect(session.subject.closed).toBe(true);
        });
        it('removes all records of itself from transient stores', () => {
            // TODO: Validate it removes records from Redis
        });
    });
    describe('.execute', () => {
        it('executes the code in the worker function provided and publishes the result', (done) => {
            let session = new Session('abcde');

            const expectedResult = {
                data: {
                    userId: 'abcde',
                    code: 'let a = 5',
                    result: 'undefined'
                },
                type: 'executionSuccess',
            };

            session.userClient = MockSessionUserClient;

            session.subscribe((result) => {
                expect(result).toEqual(JSON.stringify(expectedResult));
                expect(session.log[0]).toEqual(expectedResult);
                session.terminate();            
                done();
            });

            session.execute({ code: 'let a = 5', token: 'foo'});
        });
        describe('when an execution error occurs', () => {
            it('publishes the error', (done) => {
                let session = new Session('abcde');

                const expectedResult = {
                    data: {
                        userId: 'abcde',
                        code: 'warglbargl',
                        error: 'warglbargl is not defined'
                    },
                    type: 'executionFailure'
                };

                session.userClient = MockSessionUserClient;

                session.subscribe((result) => {
                    expect(result).toEqual(JSON.stringify(expectedResult));
                    expect(session.log[0]).toEqual(expectedResult);
                    session.terminate();
                    done();
                });

                session.execute({ code: 'warglbargl', token: 'foo'});
            });
        });
    });
    describe('.handleNewConnection', () => {
        it('correctly populates the session state with the new user', (done) => {
            let session = new Session('abcde');

            session.userClient = MockSessionUserClient;
            session.subscribe((result) => {
                expect([...session.activeUsers]).toEqual([ { userId: 'abcde', alias: 'Test User' } ]);
                session.terminate();
                done();
            });

            session.handleNewConnection('foo');
        });

        it('emits a connectUser event', (done) => {
            let session = new Session('abcde');

            session.userClient = MockSessionUserClient;

            const connectionEvent = {
                data: {
                    userId: 'abcde',
                    alias: 'Test User'
                },
                type: 'connectUser'
            };

            session.subscribe((result) => {
                expect(result).toEqual(JSON.stringify(connectionEvent));
                expect(session.log[0]).toEqual(connectionEvent);
                session.terminate();
                done();
            });

            session.handleNewConnection('foo');
        });
    });
    describe('.registerAlias', () => {
        it('routes a registerAlias request to the correct client', () => {
            let session = new Session('abcde'),
            instance = MockSessionUserClient.getInstance();

            session.userClient = MockSessionUserClient;
            spyOn(instance, 'setAlias').and.callThrough();

            session.registerAlias('foo', 'bar');

            expect(instance.setAlias).toHaveBeenCalledWith('abcde', 'foo', 'bar');

            session.terminate();
        });
    });
    describe('.registerUserId', () => {
        it('routes a registerUserId request to the correct client', () => {
            let session = new Session('abcde'),
            instance = MockSessionUserClient.getInstance();

            session.userClient = MockSessionUserClient;
            spyOn(instance, 'setUserId').and.callThrough();

            session.registerUserId('foo', 'bar');

            expect(instance.setUserId).toHaveBeenCalledWith('abcde', 'foo', 'bar');

            session.terminate();
        });
    });
    describe('.getAlias', () => {
        it('routes a getAlias request to the correct client', (done) => {
            let session = new Session('abcde'),
            instance = MockSessionUserClient.getInstance();

            session.userClient = MockSessionUserClient;
            spyOn(instance, 'getAlias').and.callThrough();

            session.getAlias('foo').then((result) => {
                expect(instance.getAlias).toHaveBeenCalledWith('abcde', 'foo');
                expect(result).toEqual('Test User');
                session.terminate();
                done();
            });
        });
    });
    describe('.addActiveUser', () => {
        it('updates the session state appropriately', (done) => {
            let session = new Session('abcde'),
            instance = MockSessionUserClient.getInstance();

            session.userClient = MockSessionUserClient;
            
            session.addActiveUser('foo').then((_) => {
                expect([...session.getActiveUsers()]).toEqual([{ userId: 'abcde', alias: 'Test User' }]);
                session.terminate();
                done();
            });
        });
        it('emits a connectUser event', (done) => {
            let session = new Session('abcde'),
            instance = MockSessionUserClient.getInstance();

            session.userClient = MockSessionUserClient;

            const connectionEvent = {
                data: {
                    userId: 'abcde',
                    alias: 'Test User'
                },
                type: 'connectUser'
            };

            session.subscribe((result) => {
                expect(result).toEqual(JSON.stringify(connectionEvent));
                expect(session.log[0]).toEqual(connectionEvent);
                session.terminate();
                done();
            });

            session.addActiveUser('foo');
        });
    });
    describe('.removeActiveUser', () => {
        it('updates the session state appropriately', (done) => {
            let session = new Session('abcde'),
            instance = MockSessionUserClient.getInstance();

            session.userClient = MockSessionUserClient;

            session.addActiveUser('foo').then((_) => {
                return session.removeActiveUser('foo');
            }).then((_) => {
                expect([...session.getActiveUsers()]).toEqual([]);
                session.terminate();
                done();
            });
        });

        it('emits a disconnectUser event', (done) => {
            let session = new Session('abcde'),
            instance = MockSessionUserClient.getInstance(),
            numMessages = 0;

            session.userClient = MockSessionUserClient;

            const disconnectionEvent = {
                data: {
                    userId: 'abcde',
                    alias: 'Test User'
                },
                type: 'disconnectUser'
            };

            session.subscribe((result) => {
                numMessages++;
                if (numMessages != 2) { 
                    return; 
                }

                expect(result).toEqual(JSON.stringify(disconnectionEvent));
                expect(session.log[1]).toEqual(disconnectionEvent);
                session.terminate();
                done();
            });

            session.addActiveUser('foo').then(() => session.removeActiveUser('foo'));
        });
    });
});
