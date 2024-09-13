const registerMessageEvent = (app) => {
  app.event('message', async ({ event, client }) => {
    const { text, channel, user, thread_ts, ts } = event;

    try {
      // Retrieve the user connections from the database
      app.db.get('SELECT monitored_channels, notification_channel FROM user_connections WHERE user_id = ?', [user], async (err, row) => {
        if (err) {
          console.error('Error retrieving user connections:', err);
          return;
        }

        if (row && row.monitored_channels.split(',').includes(channel)) {
          // Determine if it's a thread reply or a regular message
          const messageTs = thread_ts || ts; // Use thread_ts for replies, otherwise use ts
          
          // Get the permalink to the message (or thread)
          const permalinkResult = await client.chat.getPermalink({
            channel: channel,
            message_ts: messageTs,
          });

          // Send a notification with a "View Message" button
          await client.chat.postMessage({
            channel: row.notification_channel,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*New message from <@${user}> in <#${channel}>:*\n${text}`,
                },
              },
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: {
                      type: 'plain_text',
                      text: 'View Message',
                    },
                    url: permalinkResult.permalink, // The permalink to the message
                  },
                ],
              },
            ],
          });
        }
      });
    } catch (error) {
      console.error('Error processing message event:', error);
    }
  });
};

module.exports = { registerMessageEvent };
