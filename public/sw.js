self.addEventListener("push", function (event) {
  console.log("Push event received:", event.data);
  if (event.data) {
    const data = event.data.json();
    console.log("Push data:", data);
    const options = {
      body: data.body,
      icon: data.icon || "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: "2",
      },
    };
    console.log("Showing notification with options:", options);
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification click received:", event);
  event.notification.close();

  const data = event.notification.data;
  const action = event.action;

  // Handle different notification actions
  if (action === "view" && data && data.conversationId) {
    // Navigate to specific chat conversation
    const urlToOpen = new URL(
      `/matches/${data.conversationId}`,
      self.location.origin
    ).href;
    console.log("Opening chat URL:", urlToOpen);
    event.waitUntil(clients.openWindow(urlToOpen));
  } else if (action === "dismiss") {
    // Just close the notification (already done above)
    console.log("Notification dismissed");
  } else {
    // Default action - open home page
    const urlToOpen = new URL("/", self.location.origin).href;
    console.log("Opening home URL:", urlToOpen);
    event.waitUntil(clients.openWindow(urlToOpen));
  }
});
