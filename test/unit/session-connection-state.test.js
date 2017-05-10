const SessionConnectionState = require('../../lib/session-connection-state');
const MockSessionRegistry = require('../support/mock-session-registry');
const mockWs = {
    send: () => {},
};

describe('SessionConnectionState', () => {
    describe('.constructor', () => {
        it('correctly initializes connection state', () => {
             let state = new SessionConnectionState('foo', mockWs, 'token', MockSessionRegistry);

             expect(state.sessionId).toEqual('foo');
             expect(state.websocket).toEqual(mockWs);
             expect(state.registry).toEqual(MockSessionRegistry);
             expect(state.token).toEqual('token');
        });
        it('correctly invokes calls to the session registry', () => {
            let instance = MockSessionRegistry.getInstance();
            spyOn(instance, 'handleNewConnection');
            spyOn(instance, 'subscribe');
            let state = new SessionConnectionState('foo', mockWs, 'token', MockSessionRegistry);

            expect(instance.handleNewConnection).toHaveBeenCalled();
            expect(instance.subscribe).toHaveBeenCalled();
        });
    });
    describe('.registerAlias', () => {
        it('routes the registerAlias call to the session registry', () => {
            let instance = MockSessionRegistry.getInstance();
            spyOn(instance, 'registerAlias');
            let state = new SessionConnectionState('foo', mockWs, 'token', MockSessionRegistry);
            state.registerAlias({ alias: 'baz' });
            expect(instance.registerAlias).toHaveBeenCalledWith('foo', 'token', 'baz');
        });
    });
    describe('.execute', () => {
        it('routes the execute call to the session registry', () => {
            let instance = MockSessionRegistry.getInstance();
            spyOn(instance, 'execute');
            let state = new SessionConnectionState('foo', mockWs, 'token', MockSessionRegistry);
            state.execute({ code: 'code' });
            expect(instance.execute).toHaveBeenCalledWith('foo', { token: 'token', code: 'code' });
        });
    });
    describe('.keepAlive', () => {
        it('routes the resetTimeout call to the session registry', () => {
            let instance = MockSessionRegistry.getInstance();
            spyOn(instance, 'resetTimeout');
            let state = new SessionConnectionState('foo', mockWs, 'token', MockSessionRegistry);
            state.keepAlive();
            expect(instance.resetTimeout).toHaveBeenCalledWith('foo');
        });
    });
    describe('.terminate', () => {
        it('removes the user associated with the connection from the active users in the session', () => {
            let instance = MockSessionRegistry.getInstance();
            spyOn(instance, 'removeActiveUser');
            let state = new SessionConnectionState('foo', mockWs, 'token', MockSessionRegistry);
            state.terminate();

            expect(instance.removeActiveUser).toHaveBeenCalledWith('foo', 'token');
        });
        it('removes the websocket subscription from the session stream', () => {
            let state = new SessionConnectionState('foo', mockWs, 'token', MockSessionRegistry);
            spyOn(state.subscription, 'unsubscribe');

            state.terminate();
            expect(state.subscription.unsubscribe).toHaveBeenCalled();
        });
    });
    describe('.handleMessage', () => {
        it('routes correctly formatted messages to be handled by the correct method', () => {
            let state = new SessionConnectionState('foo', mockWs, 'token', MockSessionRegistry);
            spyOn(state, 'execute');

            const message = {
                verb: 'execute',
                data: {
                    code: 'let a = 5',
                    token: 'token'
                }
            };
            state.handleMessage(JSON.stringify(message));

            expect(state.execute).toHaveBeenCalledWith(message.data);
        });
        it('gracefully rejects incorrectly formatted messages', () => {
            let state = new SessionConnectionState('foo', mockWs, 'token', MockSessionRegistry);
            spyOn(mockWs, 'send');

            const fakeMessage = {
                verb: 'bring',
                data: {
                    subject: 'I',
                    directObject: 'a letter',
                    indirectObject: 'you',
                    tense: 'past',
                    mood: 'exclamatory'
                }
            };

            const error = {
               status: 'ERROR',
               error: "Verb 'bring' not recognized"
            };

            state.handleMessage(JSON.stringify(fakeMessage));

            expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(error));
        });
    });
});
