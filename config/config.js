const Config = {
    // Non-production session secret for use in expressSession middleware
    SESSION_SECRET: '159ef405-9369-4b5e-8a9d-668761e8f15d',
    // Domain to whitelist CORS requests from
    FRONTEND_WHITELIST_DOMAIN: 'http://localhost:3001'
};

module.exports = Config;
