import {
  LayoutGrid,
  BedSingle,
  BedDouble,
  Sofa,
  Crown,
  ConciergeBell,
  AlarmClock,
  Car,
  SprayCan,
} from "lucide-react";
import { portalUrl, PORTAL_LOGIN, PORTAL_REGISTER } from "./portal";

// Header, mobile drawer aur footer teeno yahin se bante hain
export const mainNav = [
  { label: "Home", to: "/" },
  {
    label: "Rooms",
    to: "/rooms",
    children: [
      { label: "All rooms", description: "See every room type and its rates", to: "/rooms", icon: LayoutGrid },
      { label: "Single", description: "A quiet room for one traveller", to: "/rooms?type=single", icon: BedSingle },
      { label: "Double", description: "A comfortable bed for two", to: "/rooms?type=double", icon: BedDouble },
      { label: "Deluxe", description: "More space and a better view", to: "/rooms?type=deluxe", icon: Sofa },
      { label: "Suite", description: "A separate living area for longer stays", to: "/rooms?type=suite", icon: Crown },
    ],
  },
  {
    label: "Services",
    to: "/services",
    children: [
      { label: "Room service", description: "Meals and drinks brought to your room", to: "/services#room-service", icon: ConciergeBell },
      { label: "Wake-up call", description: "A call at the time you choose", to: "/services#wake-up-call", icon: AlarmClock },
      { label: "Transportation", description: "Pickups and rides arranged by reception", to: "/services#transportation", icon: Car },
      { label: "Housekeeping", description: "Daily cleaning and fresh linen", to: "/services#housekeeping", icon: SprayCan },
    ],
  },
  { label: "About", to: "/about" },
  { label: "Gallery", to: "/gallery" },
  { label: "Reviews", to: "/reviews" },
  { label: "Contact", to: "/contact" },
];

export const footerGroups = [
  {
    title: "Explore",
    links: [
      { label: "Home", to: "/" },
      { label: "Rooms", to: "/rooms" },
      { label: "Services", to: "/services" },
      { label: "About", to: "/about" },
      { label: "Gallery", to: "/gallery" },
      { label: "Reviews", to: "/reviews" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Rooms",
    links: [
      { label: "Single", to: "/rooms?type=single" },
      { label: "Double", to: "/rooms?type=double" },
      { label: "Deluxe", to: "/rooms?type=deluxe" },
      { label: "Suite", to: "/rooms?type=suite" },
    ],
  },
  {
    title: "Guests",
    links: [
      { label: "Log in", to: portalUrl(PORTAL_LOGIN) },
      { label: "Register", to: portalUrl(PORTAL_REGISTER) },
      { label: "Book a stay", to: "/rooms" },
    ],
  },
  {
    title: "Hotel",
    links: [
      { label: "Policies", to: "/policies" },
      { label: "Contact", to: "/contact" },
    ],
  },
];
