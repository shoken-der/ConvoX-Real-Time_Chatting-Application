export function formatLastSeen(dateString) {
  if (!dateString) return "Last seen recently";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Last seen recently";

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Last seen just now";
  if (diffInSeconds < 3600) return `Last seen ${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `Last seen ${Math.floor(diffInSeconds / 3600)}h ago`;
  
  const isYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (date.toDateString() === isYesterday.toDateString()) return "Last seen yesterday";

  return `Last seen ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

export function getPresenceText(user, isOnline) {
  if (isOnline) return "Online";
  const lastSeen = user?.lastSeen ? formatLastSeen(user.lastSeen) : "recently";
  return `Offline • ${lastSeen}`;
}
