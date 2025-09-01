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
  console.log("Notification click received.");
  event.notification.close();
  // Use the current origin instead of hardcoded port
  const urlToOpen = new URL("/", self.location.origin).href;
  console.log("Opening URL:", urlToOpen);
  event.waitUntil(clients.openWindow(urlToOpen));
});
