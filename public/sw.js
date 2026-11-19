/**
 * ZE.io Native Service Worker
 * Handles Native Android & Web Notifications (Chat, Music with Controls, Calls)
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Incoming Chat, Call & Music Notifications via Client Message Relay
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  if (data.type === 'SHOW_NEW_CHAT') {
    const senderName = data.senderName || 'Pengguna ZE.io';
    const text = data.text || 'Pesan baru';
    const chatId = data.chatId || '';
    const title = `Chat baru dari ${senderName}`;
    const body = `Chat baru dari ${senderName}: ${text}`;

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: data.senderPhoto || '/assets/ze_logo.png',
        badge: '/assets/ze_logo.png',
        tag: `chat_msg_${chatId}`,
        renotify: true,
        vibrate: [200, 100, 200],
        data: {
          type: 'chat',
          chatId,
          senderId: data.senderId || '',
          url: chatId ? `/?openChatId=${encodeURIComponent(chatId)}` : '/chats'
        }
      })
    );
  }

  if (data.type === 'SHOW_INCOMING_CALL') {
    const isVideo = data.callType === 'video';
    const title = `Panggilan ${isVideo ? 'Video' : 'Suara'} Masuk`;
    const callerName = data.callerName || 'Pengguna ZE.io';

    event.waitUntil(
      self.registration.showNotification(title, {
        body: `${callerName} sedang memanggil Anda di ZE.io...`,
        icon: data.callerPhoto || '/assets/ze_logo.png',
        badge: '/assets/ze_logo.png',
        tag: `incoming_call_${data.callId}`,
        data: {
          type: 'call',
          callId: data.callId,
          callerId: data.callerId,
          callerName: callerName,
          callType: data.callType,
          url: '/'
        },
        requireInteraction: true,
        vibrate: [400, 250, 400, 250, 600],
        actions: [
          { action: 'accept', title: '📞 ANGKAT' },
          { action: 'reject', title: '❌ TOLAK' }
        ]
      })
    );
  }

  if (data.type === 'DISMISS_CALL_NOTIFICATION') {
    event.waitUntil(
      self.registration.getNotifications({ tag: `incoming_call_${data.callId}` }).then((notifications) => {
        for (const notif of notifications) {
          notif.close();
        }
      })
    );
  }

  if (data.type === 'SHOW_MUSIC_NOTIFICATION') {
    const isPlaying = data.isPlaying !== false;
    event.waitUntil(
      self.registration.showNotification(data.title || 'ZE.io Music', {
        body: data.artist || 'ZE.io Audio Player',
        icon: data.cover || data.thumbnail || '/assets/ze_logo.png',
        badge: '/assets/ze_logo.png',
        tag: 'ze_music_player_notification',
        silent: true,
        requireInteraction: isPlaying,
        data: { type: 'music', url: '/' },
        actions: [
          { action: 'music_prev', title: '⏮ Prev' },
          { action: 'music_toggle', title: isPlaying ? '⏸ Pause' : '▶ Play' },
          { action: 'music_next', title: '⏭ Next' }
        ]
      })
    );
  }

  if (data.type === 'DISMISS_MUSIC_NOTIFICATION') {
    event.waitUntil(
      self.registration.getNotifications({ tag: 'ze_music_player_notification' }).then((notifications) => {
        for (const notif of notifications) {
          notif.close();
        }
      })
    );
  }
});

// Notification Click Handler (Chat deep-link, Music controls, Call Accept/Reject)
self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  const notifData = event.notification.data || {};

  // Music notification action buttons (Prev / Pause-Play / Next)
  if (action === 'music_prev' || action === 'music_toggle' || action === 'music_next') {
    const controlAction =
      action === 'music_prev' ? 'prev' : action === 'music_next' ? 'next' : 'toggle';
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({
            type: 'NATIVE_MUSIC_CONTROL',
            action: controlAction
          });
        }
      })
    );
    return;
  }

  event.notification.close();

  if (action === 'reject') {
    if (notifData.callId) {
      fetch('/api/calls/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: notifData.callId,
          action: 'reject'
        })
      }).catch(() => {});
    }
    return;
  }

  const targetUrl = notifData.url || '/';

  // Open or focus application window
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if (action === 'accept') {
            client.postMessage({
              type: 'NATIVE_CALL_NOTIFICATION_ACCEPT',
              callId: notifData.callId
            });
          } else if (notifData.type === 'chat' && notifData.chatId) {
            client.postMessage({
              type: 'NATIVE_CHAT_NOTIFICATION_OPEN',
              chatId: notifData.chatId,
              senderId: notifData.senderId || ''
            });
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
