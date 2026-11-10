/* Shared helpers and metadata for room cards, filters, and modals. */
import {
  BedDouble,
  BellRing,
  Car,
  CheckCircle2,
  Coffee,
  DoorClosed,
  Flower2,
  Shield,
  Sparkles,
  Tv,
  UtensilsCrossed,
  Wifi,
  Wind,
  Wrench,
} from "lucide-react";

export const roomTypeLabels = {
  single: "Single",
  double: "Double",
  deluxe: "Deluxe",
  suite: "Suite",
};

export const roomStatusMeta = {
  available: { label: "Available", tone: "success", icon: CheckCircle2 },
  occupied: { label: "Occupied", tone: "error", icon: DoorClosed },
  cleaning: { label: "Cleaning", tone: "warning", icon: Sparkles },
  maintenance: { label: "Maintenance", tone: "dark", icon: Wrench },
};

export const amenityIcons = {
  WiFi: Wifi,
  AC: Wind,
  TV: Tv,
  "Mini Bar": Coffee,
  Balcony: BedDouble,
  "Sea View": Flower2,
  "Room Service": BellRing,
  Safe: Shield,
  Parking: Car,
  Breakfast: UtensilsCrossed,
  default: Sparkles,
};

export function formatPrice(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(number);
}

export function getRoomMainImage(room) {
  return room?.images?.[0]?.url || "";
}

export function getAmenityIcon(name) {
  return amenityIcons[name] || amenityIcons.default;
}

export function getRoomStatusMeta(status) {
  return roomStatusMeta[status] || roomStatusMeta.available;
}

export function getRoomTypeLabel(type) {
  return roomTypeLabels[type] || type;
}

export const amenityOptions = [
  "WiFi",
  "AC",
  "TV",
  "Mini Bar",
  "Balcony",
  "Sea View",
  "Room Service",
  "Safe",
  "Parking",
  "Breakfast",
];

export const roomTypeOptions = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "deluxe", label: "Deluxe" },
  { value: "suite", label: "Suite" },
];

export const statusOptions = [
  { value: "available", label: "Available" },
  { value: "occupied", label: "Occupied" },
  { value: "cleaning", label: "Cleaning" },
  { value: "maintenance", label: "Maintenance" },
];

export function buildAmenitySummary(amenities = []) {
  const unique = [...new Set((amenities || []).map((item) => item.trim()).filter(Boolean))];
  return unique.slice(0, 3);
}

export function getStatusOptionsForRole(role) {
  if (role === "housekeeping") {
    return statusOptions.filter((option) => option.value !== "occupied");
  }
  return statusOptions;
}
