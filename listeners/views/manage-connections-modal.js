const registerManageConnectionsModal = (app) => {
    app.view('manage_connections_modal', async ({ ack, body, view, client }) => {
      await ack();
  
      const userId = body.user.id;
      const channelsToRemove = view.state.values.monitored_channels_block.selected_channels_to_remove.selected_options.map(option => option.value);
  
      if (channelsToRemove.length > 0) {
        app.db.get('SELECT monitored_channels FROM user_connections WHERE user_id = ?', [userId], async (err, row) => {
          if (row) {
            const remainingChannels = row.monitored_channels.split(',').filter(channel => !channelsToRemove.includes(channel));
  
            if (remainingChannels.length > 0) {
              app.db.run('UPDATE user_connections SET monitored_channels = ? WHERE user_id = ?', [remainingChannels.join(','), userId], async (err) => {
                const channelNames = await Promise.all(remainingChannels.map(async (channelId) => {
                  const result = await client.conversations.info({ channel: channelId });
                  return `#${result.channel.name}`;
                }));
                await client.chat.postMessage({
                  channel: userId,
                  text: `Remaining channels: ${channelNames.join(', ')}`,
                });
              });
            } else {
              app.db.run('DELETE FROM user_connections WHERE user_id = ?', [userId], async (err) => {
                await client.chat.postMessage({ channel: userId, text: 'All connections removed.' });
              });
            }
          }
        });
      } else {
        await client.chat.postMessage({ channel: userId, text: 'No channels selected for removal.' });
      }
    });
  };
  
  module.exports = { registerManageConnectionsModal };
  