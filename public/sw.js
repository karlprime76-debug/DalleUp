self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || "DalleUp";
    const options = {
      body: data.message || "",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      tag: data.tag || data.type || "default",
      requireInteraction: true,
      data: { url: data.url || "/" },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    event.waitUntil(
      self.registration.showNotification("DalleUp", { body: "Nouvelle notification" })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
