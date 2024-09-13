const { registerMessageEvent } = require('./message');

module.exports.register = (app) => {
  registerMessageEvent(app);
};
