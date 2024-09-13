const { registerConnectChannelsCommand } = require('./connect-channels');

module.exports.register = (app) => {
  registerConnectChannelsCommand(app);
};
