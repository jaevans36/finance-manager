const DB_NAME = 'life-manager-sw';
const STORE_NAME = 'reminders';
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(STORE_NAME, { keyPath: 'taskId' });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

async function replaceReminders(reminders) {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.clear();
  reminders.forEach(r => store.put(r));
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

async function checkReminders() {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const all = await new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = reject;
  });

  const now = Date.now();
  for (const reminder of all) {
    const reminderTime = new Date(reminder.reminderAt).getTime();
    const diffMs = Math.abs(now - reminderTime);
    if (diffMs <= 60000) { // within 60 seconds
      try {
        await self.registration.showNotification(reminder.title, {
          body: 'Task reminder',
          icon: '/favicon.svg',
          data: { taskId: reminder.taskId },
        });
        // Delete after firing to prevent duplicates
        const delTx = db.transaction(STORE_NAME, 'readwrite');
        delTx.objectStore(STORE_NAME).delete(reminder.taskId);
      } catch {
        // Notification permission may have been revoked — fail silently
      }
    }
  }
}

self.addEventListener('message', async event => {
  if (event.data?.type === 'SYNC_TASKS') {
    await replaceReminders(event.data.reminders);
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const taskId = event.notification.data?.taskId;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      const url = taskId ? `/tasks?highlight=${taskId}` : '/tasks';
      if (windowClients.length > 0) {
        windowClients[0].focus();
        windowClients[0].navigate(url);
      } else {
        clients.openWindow(url);
      }
    })
  );
});

// Poll every 60 seconds
setInterval(checkReminders, 60000);
