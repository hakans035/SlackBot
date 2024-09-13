async function showConnectChannelsModal(triggerId, client) {
  try {
    const publicChannels = await client.conversations.list({ types: 'public_channel' });
    const privateChannels = await client.conversations.list({ types: 'private_channel' });

    const publicChannelOptions = publicChannels.channels.map((channel) => ({
      text: { type: 'plain_text', text: `#${channel.name}` },
      value: channel.id,
    }));

    const privateChannelOptions = privateChannels.channels.map((channel) => ({
      text: { type: 'plain_text', text: `🔒 ${channel.name}` },
      value: channel.id,
    }));

    const channelOptions = [...publicChannelOptions, ...privateChannelOptions];

    await client.views.open({
      trigger_id: triggerId,
      view: {
        type: 'modal',
        callback_id: 'channel_selection_modal',
        title: { type: 'plain_text', text: 'Connect Channels' },
        blocks: [
          {
            type: 'input',
            block_id: 'multi_channel_select_block',
            element: {
              type: 'multi_static_select',
              placeholder: { type: 'plain_text', text: 'Select channels (public and private)' },
              options: channelOptions,
              action_id: 'selected_channels_action',
            },
            label: { type: 'plain_text', text: 'Channels to Monitor' },
          },
          {
            type: 'input',
            block_id: 'notification_channel_select_block',
            element: {
              type: 'static_select',
              placeholder: { type: 'plain_text', text: 'Select a channel for notifications' },
              options: channelOptions,
              action_id: 'notification_channel_action',
            },
            label: { type: 'plain_text', text: 'Notification Channel' },
          },
        ],
        submit: { type: 'plain_text', text: 'Submit' },
      },
    });
  } catch (error) {
    console.error('Error opening modal:', error);
  }
}

const registerChannelSelectionModal = (app) => {
  app.view('channel_selection_modal', async ({ ack, body, view, client }) => {
    await ack(); // Acknowledge the modal submission

    const userId = body.user.id;  // Get the user ID from the modal submission
    const selectedChannels = view.state.values.multi_channel_select_block.selected_channels_action.selected_options.map(option => option.value);  // Extract selected channels
    const notificationChannel = view.state.values.notification_channel_select_block.notification_channel_action.selected_option.value;  // Extract selected notification channel

    // Ensure that some channels were selected
    if (selectedChannels.length > 0) {
      const monitoredChannels = selectedChannels.join(',');  // Convert selected channels into a comma-separated string

      // Insert or update the user's channel selections in the database
      app.db.run(`
        INSERT INTO user_connections (user_id, monitored_channels, notification_channel)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET monitored_channels=excluded.monitored_channels, notification_channel=excluded.notification_channel
      `, [userId, monitoredChannels, notificationChannel], async (err) => {
        if (err) {
          console.error('Error saving connections:', err);
        } else {
          // Fetch the names of the selected channels for confirmation message
          const channelLinks = await Promise.all(selectedChannels.map(async (channelId) => {
            const result = await client.conversations.info({ channel: channelId });
            return `<#${channelId}|${result.channel.name}>`;  // Format channel link
          }));

          // Send confirmation message to the notification channel
          await client.chat.postMessage({
            channel: notificationChannel,  // Send to the selected notification channel
            text: `You will receive updates from: ${channelLinks.join(', ')}`,  // List the selected channels
          });
        }
      });
    } else {
      console.error('No channels selected.');
    }
  });
};

module.exports = { registerChannelSelectionModal,showConnectChannelsModal };


