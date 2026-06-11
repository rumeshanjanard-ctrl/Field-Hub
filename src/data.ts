/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AppConfig {
  id: string;
  name: string;
  description: string;
  backgroundImage: string;
  icon: string;
  accent: string;
  topBorder: string;
  category: 'Sales' | 'Operations' | 'Reports' | 'All';
}

export interface StatsCard {
  id: string;
  label: string;
  value: string;
  icon: string;
  color: string;
  badge?: string;
}

export interface RecentActivityItem {
  id: string;
  type: 'success' | 'alert' | 'pending';
  title: string;
  subtitle: string;
  timeAgo: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'warning' | 'info' | 'error';
  unread: boolean;
  group: 'Today' | 'Earlier';
}

export interface Outlet {
  rtCode: string;
  name: string;
  address: string;
}

export const APP_LIST: AppConfig[] = [
  {
    id: 'cooldesk',
    name: 'CoolDesk',
    description: 'Cooler Complaint Management',
    backgroundImage: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=600&q=80',
    icon: 'ThermometerSnowflake',
    accent: '#0EA5E9',
    topBorder: '#0EA5E9',
    category: 'Operations',
  },
  {
    id: 'outlettrack',
    name: 'OutletTrack',
    description: 'Outlet Visits & Tracking',
    backgroundImage: 'https://images.unsplash.com/photo-1601599561213-832382fd07ba?auto=format&fit=crop&w=600&q=80',
    icon: 'Store',
    accent: '#10B981',
    topBorder: '#10B981',
    category: 'Operations',
  },
  {
    id: 'salesboard',
    name: 'SalesBoard',
    description: 'Sales Performance Dashboard',
    backgroundImage: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=600&q=80',
    icon: 'TrendingUp',
    accent: '#8B5CF6',
    topBorder: '#8B5CF6',
    category: 'Sales',
  },
  {
    id: 'stockcheck',
    name: 'StockCheck',
    description: 'Product Stock Availability',
    backgroundImage: 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=600&q=80',
    icon: 'Box',
    accent: '#F59E0B',
    topBorder: '#F59E0B',
    category: 'Operations',
  },
  {
    id: 'routemap',
    name: 'RouteMap',
    description: 'Daily Route Planning',
    backgroundImage: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=600&q=80',
    icon: 'Map',
    accent: '#EAB308',
    topBorder: '#EAB308',
    category: 'Sales',
  },
  {
    id: 'teamsync',
    name: 'TeamSync',
    description: 'Team Tasks & Communication',
    backgroundImage: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=600&q=80',
    icon: 'Users',
    accent: '#EC4899',
    topBorder: '#EC4899',
    category: 'Reports',
  },
];

export const INITIAL_STATS: StatsCard[] = [
  { id: 'tasks', label: "Today's Tasks", value: "12", icon: 'ClipboardCheck', color: '#0EA5E9' },
  { id: 'complaints', label: "Pending Complaints", value: "04", icon: 'AlertTriangle', color: '#EF4444' },
  { id: 'outlets', label: "Active Outlets", value: "128", icon: 'Store', color: '#10B981' },
  { id: 'target', label: "Monthly Target", value: "85%", icon: 'TrendingUp', color: '#8B5CF6', badge: 'On Track' },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Target Achieved!',
    description: "Congratulations! You've reached 100% of your daily outlet visit target.",
    time: '2m ago',
    type: 'success',
    unread: true,
    group: 'Today',
  },
  {
    id: 'n2',
    title: 'Cooler Alert',
    description: 'Cooler #8829 at Cargills Food City reported a temperature spike.',
    time: '45m ago',
    type: 'error',
    unread: true,
    group: 'Today',
  },
  {
    id: 'n3',
    title: 'Route Updated',
    description: 'Your supervisor has added 2 new outlets to your afternoon route.',
    time: '2h ago',
    type: 'info',
    unread: true,
    group: 'Today',
  },
  {
    id: 'n4',
    title: 'Stock Update',
    description: "New SKU for Beverage 'Z' is now available in the central warehouse.",
    time: 'Yesterday',
    type: 'warning',
    unread: false,
    group: 'Earlier',
  },
  {
    id: 'n5',
    title: 'TeamSync Message',
    description: "Rumsh: 'Don't forget to submit the monthly feedback form by EOD.'",
    time: 'Yesterday',
    type: 'error',
    unread: false,
    group: 'Earlier',
  },
  {
    id: 'n6',
    title: 'System Maintenance',
    description: 'LBCL Hub will be offline for 15 minutes tonight at 11:50 PM.',
    time: '2 days ago',
    type: 'warning',
    unread: false,
    group: 'Earlier',
  },
];

export const OUTLETS_DATA: Outlet[] = [
  { rtCode: 'RT-1092', name: 'Cargills Food City - Colombo 03', address: '243 Galle Rd, Colombo 00300, Sri Lanka' },
  { rtCode: 'RT-4482', name: 'Softlogic Glomark - Kottawa', address: '45 High Level Rd, Pannipitiya 10230, Sri Lanka' },
  { rtCode: 'RT-9938', name: 'Keells Super - Union Place', address: '115 Union Pl, Colombo 00200, Sri Lanka' },
  { rtCode: 'RT-2231', name: 'Arpico Supercentre - Hyde Park', address: '69 Hyde Park Corner, Colombo 00200, Sri Lanka' },
  { rtCode: 'RT-8541', name: 'Cargills Food City - Mount Lavinia', address: '382 Galle Rd, Mount Lavinia 10370, Sri Lanka' },
  { rtCode: 'RT-6712', name: 'Sudarshana Grocery Store', address: '12 Temple Rd, Maharagama 10280, Sri Lanka' },
  { rtCode: 'RT-3044', name: 'Nilmini Mini Mart', address: '55 Kandy Rd, Kiribathgoda 11850, Sri Lanka' },
];

export const RECENT_ACTIVITIES: RecentActivityItem[] = [
  {
    id: 'ra1',
    type: 'success',
    title: 'Outlet visit completed',
    subtitle: 'Cargills Food City · 10 mins ago',
    timeAgo: '10m ago',
  },
  {
    id: 'ra2',
    type: 'alert',
    title: 'New complaint received',
    subtitle: 'Softlogic Glomark · 45 mins ago',
    timeAgo: '45m ago',
  },
  {
    id: 'ra3',
    type: 'pending',
    title: 'Stock survey submitted',
    subtitle: 'Keells Super - Union Place · 2 hours ago',
    timeAgo: '2h ago',
  },
];
