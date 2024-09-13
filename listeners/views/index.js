const { registerChannelSelectionModal } = require('./channel-selection-modal');
const { registerManageConnectionsModal } = require('./manage-connections-modal');

module.exports.register = (app) => {
  registerChannelSelectionModal(app);
  registerManageConnectionsModal(app);
};
