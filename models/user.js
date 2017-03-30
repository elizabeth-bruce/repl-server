const Sequelize = require('sequelize');

let sequelize = new Sequelize('repl_server', 'repl-server', 'repl-server');

let User = sequelize.define('user', {
  // TODO: Enter User schema here
  username: Sequelize.STRING,
  email: Sequelize.STRING,
  password: Sequelize.STRING,
  apiKey: Sequelize.STRING,
  apiSecret: Sequelize.STRING,
  emailValidatedAt: Sequelize.DATE
});

module.exports = User;
