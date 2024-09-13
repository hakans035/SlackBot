const { showConnectChannelsModal } = require('../views/channel-selection-modal');

const registerConnectChannelsCommand = (app) => {
  app.command('/connect-channels', async ({ ack, body, client }) => {
    try {
      console.log('Received /connect-channels command:', body);
      await ack(); // Acknowledge the command

      const commandText = body.text.trim();

      if (commandText === 'settings') {
        handleSettingsCommand(body.user_id, body.trigger_id, client, app.db);
      } else if (commandText === 'help') {
        handleHelpCommand(body.user_id, client);
      } else {
        showConnectChannelsModal(body.trigger_id, client);
      }
    } catch (error) {
      console.error('Error handling /connect-channels command:', error);
    }
  });
};

async function handleHelpCommand(userId, client) {
  try {
    await client.chat.postMessage({
      channel: userId,
      text: "*How to Use `/connect-channels`*",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Welcome to the Channel Connection Helper!*\n\nHere’s how you can use the `/connect-channels` command to manage your channel connections and notifications:",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*1. Connect Channels for Monitoring:*\n- Use the `/connect-channels` command to open a modal where you can select multiple channels to monitor.\n- After selecting, choose a single channel where you want to receive notifications for any updates from the monitored channels.",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*2. Manage Your Connections:*\n- Use the `/connect-channels settings` command to view the channels you’re currently monitoring.\n- You can remove any channels you no longer want to monitor from the settings modal.",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*3. Notifications:*\n- All messages from the channels you monitor will be forwarded to the notification channel you selected.\n- These messages will include clickable links that direct you to the original channel where the message was posted.",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Examples:*\n- To start connecting channels: `/connect-channels`\n- To manage your connections: `/connect-channels settings`\n- To see this help message: `/connect-channels help`",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "If you have any questions or need further assistance, feel free to reach out!",
          },
        },
        {
          type: "divider" // To add a nice separation at the end of the message
        }
      ],
    });
  } catch (error) {
    console.error('Error sending help message:', error);
  }
}


async function handleSettingsCommand(userId, triggerId, client, db) {
  db.get('SELECT monitored_channels, notification_channel FROM user_connections WHERE user_id = ?', [userId], async (err, row) => {
    if (err) {
      console.error('Error retrieving connections:', err);
      await client.chat.postMessage({ channel: userId, text: 'Error retrieving your connections.' });
      return;
    }

    if (row) {
      const monitoredChannels = await Promise.all(row.monitored_channels.split(',').map(async (channelId) => {
        const result = await client.conversations.info({ channel: channelId });
        return {
          text: { type: 'plain_text', text: `#${result.channel.name}` },
          value: channelId,
        };
      }));

      const notificationChannel = row.notification_channel;

      await client.views.open({
        trigger_id: triggerId,
        view: {
          type: 'modal',
          callback_id: 'manage_connections_modal',
          title: { type: 'plain_text', text: 'Manage Your Connections' },
          blocks: [
            { 
              type: 'section', 
              text: { type: 'mrkdwn', text: '*Channels being monitored:*' } 
            },
            {
              type: 'input',  // Correct type for an input block
              block_id: 'monitored_channels_block',
              label: {
                type: 'plain_text',
                text: 'Select channels to remove',
              },
              element: {
                type: 'multi_static_select',
                placeholder: {
                  type: 'plain_text',
                  text: 'Select channels to remove',
                },
                options: monitoredChannels,  // Display channels user is monitoring
                action_id: 'selected_channels_to_remove',
              },
            },
            {
              type: 'section',  // Ensure the block type is correct for displaying info
              text: {
                type: 'mrkdwn',
                text: `*Notification Channel:* <#${notificationChannel}|${notificationChannel}>`,
              },
            },
          ],
          submit: { type: 'plain_text', text: 'Remove Selected' },
        },
      });
    } else {
      await client.chat.postMessage({ channel: userId, text: 'No connections found.' });
    }
  });
}

module.exports = { registerConnectChannelsCommand };
