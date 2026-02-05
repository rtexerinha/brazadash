export const SERVICE_CATEGORIES = [
  { id: "cleaning", label: "Cleaning", icon: "spray-bottle" },
  { id: "beauty", label: "Beauty", icon: "content-cut" },
  { id: "auto", label: "Auto", icon: "car" },
  { id: "legal", label: "Legal", icon: "gavel" },
  { id: "immigration", label: "Immigration", icon: "passport" },
  { id: "fitness", label: "Fitness", icon: "dumbbell" },
  { id: "education", label: "Education", icon: "school" },
  { id: "construction", label: "Construction", icon: "hammer" },
  { id: "photography", label: "Photography", icon: "camera" },
  { id: "translation", label: "Translation", icon: "translate" },
  { id: "other", label: "Other", icon: "dots-horizontal" },
] as const;

export const EVENT_CATEGORIES = [
  { id: "festival", label: "Festivals" },
  { id: "concert", label: "Concerts" },
  { id: "meetup", label: "Meetups" },
  { id: "sports", label: "Sports" },
  { id: "cultural", label: "Cultural" },
  { id: "food", label: "Food" },
  { id: "workshop", label: "Workshops" },
  { id: "other", label: "Other" },
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "On the Way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  preparing: "#8B5CF6",
  ready: "#06B6D4",
  out_for_delivery: "#1B9B59",
  delivered: "#22C55E",
  cancelled: "#EF4444",
};

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  accepted: "#3B82F6",
  declined: "#EF4444",
  confirmed: "#1B9B59",
  in_progress: "#8B5CF6",
  completed: "#22C55E",
  cancelled: "#EF4444",
};
