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
                },
                eventType: 'executionSuccess'
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
                    eventType: 'executionFailure'
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

    });
    describe('.registerAlias', () => {

    });
    describe('.registerUserId', () => {

    });
    describe('.getAlias', () => {

    });
    describe('.addActiveUser', () => {

    });
    describe('.removeActiveUser', () => {

    });
});
