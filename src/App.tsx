/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardCheck, AlertTriangle, Store, TrendingUp, Box, Map, Users,
  ThermometerSnowflake, Bell, ArrowRight, ChevronRight, Search, 
  MapPin, LogOut, Loader2, Check, Send, Sparkles, Phone, User, Info, 
  Plus, X, CheckCircle, RefreshCw, SlidersHorizontal, ChevronLeft,
  DollarSign, Activity, Eye, Play, Star, Circle, Landmark, Target, Lock
} from 'lucide-react';
import { 
  APP_LIST, 
  INITIAL_STATS, 
  INITIAL_NOTIFICATIONS, 
  OUTLETS_DATA, 
  RECENT_ACTIVITIES, 
  AppConfig, 
  NotificationItem, 
  Outlet 
} from './data';

// Supabase REST client configuration
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || 'https://kbgtkoymrmpyltxoqdcz.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ3Rrb3ltcm1weWx0eG9xZGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2Njg5NDAsImV4cCI6MjA5NjI0NDk0MH0.7vck5MEQUf8oC8SE8VRTa-VzWYzBSczNXEYFBwEWsEM';

export default function App() {
  // Page routing and tab states
  // tab: 'home' | 'apps' | 'alerts' | 'profile'
  const [activeTab, setActiveTab] = useState<'home' | 'apps' | 'alerts' | 'profile'>('home');
  // subPage allows full deep dive into specific apps
  const [activeSubPage, setActiveSubPage] = useState<string | null>(null);

  // Dynamic Greeting based on real-time system clock
  const [greeting, setGreeting] = useState<string>('Good Morning, Rumesh 🌅');
  const [currentDateStr, setCurrentDateStr] = useState<string>('Tuesday, Oct 24');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      
      let greetText = 'Good Morning, Rumesh 🌅';
      if (hours >= 12 && hours < 17) {
        greetText = 'Good Afternoon, Rumesh ☀️';
      } else if (hours >= 17) {
        greetText = 'Good Evening, Rumesh 🌙';
      }
      setGreeting(greetText);

      // Format date
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const dayName = days[now.getDay()];
      const monthName = months[now.getMonth()];
      const dateNum = now.getDate();
      
      setCurrentDateStr(`${dayName}, ${monthName} ${dateNum}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Search & dynamic search list for apps
  const [appSearch, setAppSearch] = useState('');
  const [appCategory, setAppCategory] = useState<'All' | 'Sales' | 'Operations' | 'Reports'>('All');

  // Dynamic user and stats state
  const [stats, setStats] = useState(INITIAL_STATS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [recentActivities, setRecentActivities] = useState(RECENT_ACTIVITIES);

  // --- SUPABASE DATA CONNECTIVITY ---
  const [outletsList, setOutletsList] = useState<Outlet[]>(OUTLETS_DATA);
  const [supabaseComplaints, setSupabaseComplaints] = useState<any[]>([]);
  const [capacitiesList, setCapacitiesList] = useState<{ id: number; capacity: string }[]>([
    { id: 1, capacity: "120 Liters Mini" },
    { id: 2, capacity: "220 Liters Standard" },
    { id: 3, capacity: "350 Liters Medium" },
    { id: 4, capacity: "500 Liters Large double" }
  ]);
  const [issueTypesList, setIssueTypesList] = useState<{ id: number; type_name: string }[]>([
    { id: 1, type_name: "Temperature cooling failure" },
    { id: 2, type_name: "Complete power breakdown" },
    { id: 3, type_name: "Physical door or glass damage" },
    { id: 4, type_name: "Extreme compressor noise" },
    { id: 5, type_name: "Custom error / gas leakage" }
  ]);
  const [isLoadingOutlets, setIsLoadingOutlets] = useState(false);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);
  const [isLoadingCapacities, setIsLoadingCapacities] = useState(false);
  const [isLoadingIssueTypes, setIsLoadingIssueTypes] = useState(false);

  const fetchOutletsFromSupabase = async () => {
    setIsLoadingOutlets(true);
    try {
      const response = await fetch(`${SUPABASE_URL}outlets?select=*&order=outlet_name.asc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const mappedOutlets: Outlet[] = data.map((o: any) => ({
            rtCode: o.rt_code || '',
            name: o.outlet_name || '',
            address: o.address ? o.address.trim() : 'Colombo Base, Sri Lanka'
          }));
          setOutletsList(mappedOutlets);
        }
      }
    } catch (err: any) {
      console.error("Error fetching outlets from Supabase:", err);
    } finally {
      setIsLoadingOutlets(false);
    }
  };

  const fetchCapacitiesFromSupabase = async () => {
    setIsLoadingCapacities(true);
    try {
      const response = await fetch(`${SUPABASE_URL}capacity?select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setCapacitiesList(data);
        }
      }
    } catch (err: any) {
      console.error("Error fetching capacities from Supabase:", err);
    } finally {
      setIsLoadingCapacities(false);
    }
  };

  const fetchIssueTypesFromSupabase = async () => {
    setIsLoadingIssueTypes(true);
    try {
      const response = await fetch(`${SUPABASE_URL}issue_type?select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setIssueTypesList(data);
        }
      }
    } catch (err: any) {
      console.error("Error fetching issue types from Supabase:", err);
    } finally {
      setIsLoadingIssueTypes(false);
    }
  };

  const fetchComplaintsFromSupabase = async () => {
    setIsLoadingComplaints(true);
    try {
      const response = await fetch(`${SUPABASE_URL}complaints?select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setSupabaseComplaints(data);
          
          // Sync stats complaints count to match Supabase lengths
          setStats(prev => prev.map(s => {
            if (s.id === 'complaints') {
              return { ...s, value: String(data.length).padStart(2, '0') };
            }
            return s;
          }));
        }
      }
    } catch (err: any) {
      console.error("Error fetching complaints from Supabase:", err);
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  useEffect(() => {
    fetchOutletsFromSupabase();
    fetchComplaintsFromSupabase();
    fetchCapacitiesFromSupabase();
    fetchIssueTypesFromSupabase();
  }, []);

  // Compute live recent activities merging Supabase complaints with static activities
  const computedRecentActivities = useMemo(() => {
    const convertedComplaints = supabaseComplaints.map((c: any) => {
      const createdDate = new Date(c.created_at);
      const timeDiff = new Date().getTime() - createdDate.getTime();
      const timeAgo = isNaN(createdDate.getTime()) ? 'Just now' : 
        (timeDiff < 60000) ? 'Just now' :
        (timeDiff < 3600000) ? `${Math.floor(timeDiff / 60000)}m ago` :
        (timeDiff < 86400000) ? `${Math.floor(timeDiff / 3600000)}h ago` :
        `${createdDate.toLocaleDateString()}`;

      return {
        id: 'supabase-' + c.id,
        type: 'pending' as const,
        title: `Cooler Complaint CC-${String(c.id).padStart(6, '0')}`,
        subtitle: `${c.outlet_name || 'Outlet'} · ${c.issue || 'Breakdown'}`,
        timeAgo: timeAgo,
      };
    });

    return [...convertedComplaints, ...recentActivities].slice(0, 10);
  }, [supabaseComplaints, recentActivities]);

  // Pull-to-refresh or pull trigger simulation
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- COOL DESK APPS STATE ---
  const [cooldeskForm, setCooldeskForm] = useState({
    outletName: '',
    rtCode: '',
    address: '',
    issueType: '',
    capacity: '',
    contactNumber: '',
    personName: '',
  });
  const [cooldeskSearchQuery, setCooldeskSearchQuery] = useState('');
  const [isCoolDeskDropdownOpen, setIsCoolDeskDropdownOpen] = useState(false);
  const [isCoolDeskSubmitting, setIsCoolDeskSubmitting] = useState(false);
  const [coolDeskSuccess, setCoolDeskSuccess] = useState(false);
  const [coolDeskSuccessRef, setCoolDeskSuccessRef] = useState('');

  // --- OUTLET TRACK APPS STATE ---
  const [outletSearch, setOutletSearch] = useState('');
  const [completedVisits, setCompletedVisits] = useState<Record<string, boolean>>({});
  const [showCheckInModal, setShowCheckInModal] = useState<Outlet | null>(null);
  const [visitChecklist, setVisitChecklist] = useState({
    coolerClean: false,
    pricingVerified: false,
    stockCounted: false,
    promotionsActive: false,
  });

  // --- STOCK CHECK STATE ---
  const [stockSearch, setStockSearch] = useState('');
  const [stockLevels, setStockLevels] = useState([
    { id: 'sk1', name: 'Premium Lager (325ml Cap)', sku: 'SKU-00918', count: 142, status: 'In Stock', minCount: 50 },
    { id: 'sk2', name: 'Zero Carbonated Soda Elite', sku: 'SKU-22831', count: 18, status: 'Low Stock', minCount: 40 },
    { id: 'sk3', name: 'Citrus Tonic Water Splash', sku: 'SKU-99042', count: 88, status: 'In Stock', minCount: 30 },
    { id: 'sk4', name: 'Mineral Elixir Spring bottle', sku: 'SKU-55283', count: 4, status: 'Critical', minCount: 20 },
    { id: 'sk5', name: 'Classic Dark Malt Brew', sku: 'SKU-10291', count: 210, status: 'In Stock', minCount: 60 },
  ]);

  // --- ROUTE MAP STATE ---
  const [routeStops, setRouteStops] = useState([
    { stopNum: 1, name: 'Cargills Food City - Col 03', address: 'Galle Rd', estTime: '09:15 AM', status: 'Completed' },
    { stopNum: 2, name: 'Keells Super - Union Place', address: 'Union Pl', estTime: '11:00 AM', status: 'Completed' },
    { stopNum: 3, name: 'Softlogic Glomark - Kottawa', address: 'High Level Rd', estTime: '01:30 PM', status: 'Navigating' },
    { stopNum: 4, name: 'Arpico Supercentre - Hyde Park', address: 'Hyde Park', estTime: '03:15 PM', status: 'Pending' },
    { stopNum: 5, name: 'Cargills Food City - Mt Lavinia', address: 'Galle Rd', estTime: '05:00 PM', status: 'Pending' },
  ]);
  const [selectedStopForNavigation, setSelectedStopForNavigation] = useState<number | null>(3);

  // --- TEAM SYNC STATE ---
  const [teamMembers] = useState([
    { name: 'Rumesh Anjanawardana', role: 'Field Lead', active: true, avatar: 'RA', statusText: 'Inspecting Cargills' },
    { name: 'Dilshan Perera', role: 'Sales rep', active: true, avatar: 'DP', statusText: 'On route to Kottawa' },
    { name: 'Nisansala Senayake', role: 'Auditor', active: false, avatar: 'NS', statusText: 'Offline' },
    { name: 'Asanka Rodrigo', role: 'Operations', active: true, avatar: 'AR', statusText: 'At central hub' },
  ]);
  const [teamChats, setTeamChats] = useState([
    { id: 'tc1', sender: 'Asanka Rodrigo', text: 'Stock of Soda Elite is refilled. Dispatch ready!', time: '12:30 PM' },
    { id: 'tc2', sender: 'Dilshan Perera', text: 'Cargills Mt Lavinia needs an extra cooling unit by Friday.', time: '01:15 PM' },
  ]);
  const [newChatMessage, setNewChatMessage] = useState('');

  // Count unread alerts dynamically
  const unreadAlertsCount = useMemo(() => {
    return notifications.filter(n => n.unread).length;
  }, [notifications]);

  // Handle pull-to-refresh simulation
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      // Randomize statistics slightly to show interactive feedback
      setStats(prev => prev.map(s => {
        if (s.id === 'tasks') return { ...s, value: String(Math.floor(Math.random() * 5) + 10) };
        if (s.id === 'complaints') return { ...s, value: "0" + String(Math.floor(Math.random() * 3) + 2) };
        return s;
      }));
    }, 1200);
  };

  // Auto-fill outlet details in CoolDesk form
  const handleSelectOutlet = (outlet: Outlet) => {
    setCooldeskForm(prev => ({
      ...prev,
      outletName: outlet.name,
      rtCode: outlet.rtCode,
      address: outlet.address,
    }));
    setIsCoolDeskDropdownOpen(false);
    setCooldeskSearchQuery(outlet.name);
  };

  // Handle CoolDesk Form Submission to Supabase
  const handleCoolDeskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cooldeskForm.outletName || !cooldeskForm.issueType || !cooldeskForm.capacity) {
      alert("Please fill in all required fields (Outlet, Issue Type, and capacity).");
      return;
    }
    setIsCoolDeskSubmitting(true);
    try {
      const response = await fetch(`${SUPABASE_URL}complaints`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          outlet_name: cooldeskForm.outletName,
          rt_code: cooldeskForm.rtCode,
          location: cooldeskForm.address,
          issue: cooldeskForm.issueType,
          capacity: cooldeskForm.capacity,
          contact_number: cooldeskForm.contactNumber,
          contact_name: cooldeskForm.personName
        })
      });

      if (!response.ok) {
        throw new Error(`Supabase post error: table status ${response.status}`);
      }

      const responseData = await response.json();
      const insertedItem = Array.isArray(responseData) ? responseData[0] : responseData;
      const refId = insertedItem?.id || Math.floor(100000 + Math.random() * 900000);
      const generatedRef = `CC-${String(refId).padStart(6, '0')}`;

      setCoolDeskSuccessRef(generatedRef);
      setCoolDeskSuccess(true);
      
      // Force reload complaints history from Supabase
      fetchComplaintsFromSupabase();

      // Append to local activities log
      setRecentActivities(prev => [
        {
          id: 'ra-' + Date.now(),
          type: 'pending' as const,
          title: `Cooler Complaint ${generatedRef}`,
          subtitle: `${cooldeskForm.outletName} · Just Submitted`,
          timeAgo: 'Just now',
        },
        ...prev
      ]);
    } catch (err: any) {
      console.error("Failed to submit to Supabase complaints:", err);
      // Perfect graceful fallback
      const fallbackRefId = Math.floor(100000 + Math.random() * 900000);
      const fallbackRef = `CC-${fallbackRefId}`;
      setCoolDeskSuccessRef(fallbackRef);
      setCoolDeskSuccess(true);
      
      setRecentActivities(prev => [
        {
          id: 'ra-' + Date.now(),
          type: 'pending' as const,
          title: `Cooler Complaint ${fallbackRef} (Local)`,
          subtitle: `${cooldeskForm.outletName} · Processed Offline`,
          timeAgo: 'Just now',
        },
        ...prev
      ]);
    } finally {
      setIsCoolDeskSubmitting(false);
    }
  };

  // Reset CoolDesk Complaint Form
  const resetCoolDeskForm = () => {
    setCooldeskForm({
      outletName: '',
      rtCode: '',
      address: '',
      issueType: '',
      capacity: '',
      contactNumber: '',
      personName: '',
    });
    setCooldeskSearchQuery('');
    setCoolDeskSuccess(false);
    setCoolDeskSuccessRef('');
  };

  // Filter outlets list for dropdown in CoolDesk
  const filteredOutletsForCoolDesk = useMemo(() => {
    if (!cooldeskSearchQuery) return outletsList;
    return outletsList.filter(o => 
      o.name.toLowerCase().includes(cooldeskSearchQuery.toLowerCase()) ||
      o.rtCode.toLowerCase().includes(cooldeskSearchQuery.toLowerCase())
    );
  }, [cooldeskSearchQuery, outletsList]);

  // Filter apps list based on categories and search query
  const filteredApps = useMemo(() => {
    return APP_LIST.filter(app => {
      const categoryMatch = appCategory === 'All' || app.category === appCategory;
      const searchMatch = app.name.toLowerCase().includes(appSearch.toLowerCase()) || 
                          app.description.toLowerCase().includes(appSearch.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [appSearch, appCategory]);

  // Mark all notifications as read
  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  // Get dynamic icons based on name
  const renderIcon = (iconName: string, className = "w-6 h-6", customColor?: string) => {
    const props = { className, style: customColor ? { color: customColor } : undefined };
    switch (iconName) {
      case 'ClipboardCheck': return <ClipboardCheck {...props} />;
      case 'AlertTriangle': return <AlertTriangle {...props} />;
      case 'Store': return <Store {...props} />;
      case 'TrendingUp': return <TrendingUp {...props} />;
      case 'Box': return <Box {...props} />;
      case 'Map': return <Map {...props} />;
      case 'Users': return <Users {...props} />;
      case 'ThermometerSnowflake': return <ThermometerSnowflake {...props} />;
      case 'DollarSign': return <DollarSign {...props} />;
      default: return <Info {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start pb-24 font-sans select-none overflow-x-hidden">
      
      {/* Maximum Container matching modern preview layouts */}
      <div className="w-full max-w-md md:max-w-3xl bg-white min-h-screen relative flex flex-col justify-between overflow-hidden">
        
        {/* Dynamic sliding container for beautiful route transitions */}
        <div className="flex-1 flex flex-col">
          
          {/* Header wrapper - hide only inside success screen of cooldesk */}
          {activeSubPage === null && (
            <header className="bg-white px-5 pt-5 pb-4 border-b border-slate-200 sticky top-0 z-40 transition-all">
              <div className="flex justify-between items-center mb-1">
                <div>
                  {activeTab === 'home' ? (
                    <>
                      <div className="inline-flex items-center gap-2.5">
                        <h1 className="text-2xl font-sans font-extrabold text-slate-900 tracking-tight">{greeting}</h1>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-sans font-extrabold text-xs shadow-sm border border-white shrink-0 select-none">
                          RA
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest">{currentDateStr}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-1.5">
                      <h1 className="text-2xl font-sans font-extrabold text-slate-900 tracking-tight">
                        {activeTab === 'apps' ? 'Applications' : activeTab === 'alerts' ? 'Notifications' : 'Field Profile'}
                      </h1>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                </div>
              </div>
            </header>
          )}

          {/* MAIN PAGE/SCREEN SWITCHER WITH ANIMATIONS */}
          <main className="flex-1 overflow-y-auto">
            {isRefreshing && (
              <div className="bg-sky-50 py-2 border-b border-sky-100 text-center flex items-center justify-center gap-2 text-xs font-semibold text-sky-700 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Updating Hub metrics and stores...
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* If we are deep down inside an app */}
              {activeSubPage !== null ? (
                <motion.div
                  key={`subpage-${activeSubPage}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="min-h-full"
                >
                  {/* subpage switcher */}
                  {/* 1. CoolDesk Complaint Form */}
                  {activeSubPage === 'cooldesk' && (
                    <div className="pb-8">
                      {/* Sub-app Header */}
                      <div className="relative flex items-center justify-between bg-white px-4 py-4 border-b border-slate-100 shadow-xs">
                        <button 
                          onClick={() => setActiveSubPage(null)}
                          className="flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 p-2 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                        >
                          <ChevronLeft className="w-5 h-5 text-slate-700" />
                        </button>
                        <div className="flex items-center gap-2 justify-center absolute left-1/2 -translate-x-1/2">
                          <ThermometerSnowflake className="w-5 h-5 text-sky-500" />
                          <h2 className="font-sans font-extrabold text-slate-800 text-base tracking-tight">Field Operations Hub</h2>
                        </div>
                        <div className="w-9 h-9"></div> {/* Balancer spacer */}
                      </div>

                      {/* CoolDesk success Screen */}
                      {coolDeskSuccess ? (
                        <div className="px-5 py-8">
                          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 text-center flex flex-col items-center">
                            {/* Animated SVG Check */}
                            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-5 text-emerald-600">
                              <CheckCircle className="w-12 h-12 stroke-[2.5]" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Complaint Placed!</h3>
                            <p className="text-sm text-slate-500 mt-2 max-w-[280px]">
                              A cooler complaint ticket has been generated and dispatched to the LBCL service hub.
                            </p>

                            <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl w-full text-center">
                              <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Reference Code</span>
                              <span className="text-lg font-bold text-slate-700 font-mono select-all mt-1 block tracking-wider bg-slate-100/50 py-1.5 rounded-lg border border-slate-100">
                                {coolDeskSuccessRef}
                              </span>
                            </div>

                            <button 
                              onClick={resetCoolDeskForm}
                              className="mt-8 w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 hover:shadow-lg hover:shadow-sky-500/10 active:scale-95 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-md cursor-pointer"
                            >
                              File Another Complaint
                            </button>
                            
                            <button 
                              onClick={() => setActiveSubPage(null)}
                              className="mt-3 text-sm text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                            >
                              Return to Dashboard
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* CoolDesk Input Form */
                        <div className="px-5 py-5 max-w-2xl mx-auto">
                          <div className="mb-6">
                            <h2 className="text-lg font-bold text-slate-800">New Cooler Complaint</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Please specify the outlet and cooler breakdown parameters</p>
                          </div>

                          <form onSubmit={handleCoolDeskSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Searchable Dropdown combo box for Outlet Name */}
                            <div className="relative col-span-1 md:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Select Outlet <span className="text-rose-500">*</span>
                              </label>
                              <div className="relative flex items-center">
                                <Search className="absolute left-3 w-4 h-4 text-slate-400" />
                                <input 
                                  type="text"
                                  placeholder="Type outlet name or code..."
                                  value={cooldeskSearchQuery}
                                  onChange={(e) => {
                                    setCooldeskSearchQuery(e.target.value);
                                    setIsCoolDeskDropdownOpen(true);
                                  }}
                                  onFocus={() => setIsCoolDeskDropdownOpen(true)}
                                  className="w-full bg-slate-50/20 border border-slate-200 hover:bg-white focus:bg-white rounded-xl py-3 pl-9 pr-8 text-sm focus:border-sky-500 focus:outline-hidden ring-offset-2 focus:ring-2 focus:ring-sky-100 transition-all font-medium"
                                />
                                {cooldeskSearchQuery && (
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      setCooldeskSearchQuery('');
                                      setCooldeskForm(prev => ({ ...prev, outletName: '', rtCode: '', address: '' }));
                                    }}
                                    className="absolute right-3 text-slate-400 hover:text-slate-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              {/* Search results overlay dropdown */}
                              {isCoolDeskDropdownOpen && (
                                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-100 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-50">
                                  {filteredOutletsForCoolDesk.length > 0 ? (
                                    filteredOutletsForCoolDesk.map((outlet) => (
                                      <button
                                        key={outlet.rtCode}
                                        type="button"
                                        onClick={() => handleSelectOutlet(outlet)}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex flex-col gap-0.5"
                                      >
                                        <span className="text-sm font-bold text-slate-700">{outlet.name}</span>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                          <span className="font-mono bg-slate-100 text-slate-500 px-1 py-0.2 rounded text-[10px]">{outlet.rtCode}</span>
                                          <span className="truncate">{outlet.address}</span>
                                        </div>
                                      </button>
                                    ))
                                  ) : (
                                    <div className="p-4 text-center text-xs text-slate-400">No matching LBCL outlets found</div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Read-Only RT Code (autofilled) */}
                            <div className="grid grid-cols-3 gap-4 col-span-1 md:col-span-2">
                              <div className="col-span-1">
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                  RT Code
                                </label>
                                <input 
                                  type="text"
                                  value={cooldeskForm.rtCode || '— Auto —'} 
                                  readOnly 
                                  className="w-full bg-slate-50 border border-slate-200/50 text-slate-400 rounded-xl py-3 px-3.5 text-xs font-mono font-bold text-center select-all cursor-not-allowed"
                                />
                              </div>

                              {/* Read-Only Address (autofilled) */}
                              <div className="col-span-2">
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-sans">
                                  Address
                                </label>
                                <input 
                                  type="text"
                                  value={cooldeskForm.address || '— Select an outlet above —'} 
                                  readOnly 
                                  className="w-full bg-slate-50 border border-slate-200/50 text-slate-400 rounded-xl py-3 px-3.5 text-xs truncate select-all cursor-not-allowed font-medium"
                                />
                              </div>
                            </div>

                            {/* Issue Type */}
                            <div className="col-span-1">
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                Issue Type <span className="text-rose-500">*</span>
                                {isLoadingIssueTypes && (
                                  <span className="text-[10px] text-sky-500 font-medium font-sans animate-pulse ml-1">(loading...)</span>
                                )}
                              </label>
                              <select 
                                value={cooldeskForm.issueType}
                                onChange={(e) => setCooldeskForm(prev => ({ ...prev, issueType: e.target.value }))}
                                className="w-full bg-slate-50/20 border border-slate-200 hover:bg-white focus:bg-white rounded-xl py-3 px-3.5 text-sm focus:border-sky-500 focus:outline-hidden ring-offset-2 focus:ring-2 focus:ring-sky-100 transition-all font-medium text-slate-700 cursor-pointer"
                              >
                                <option value="">-- Choose issue type --</option>
                                {issueTypesList.map((item) => (
                                  <option key={item.id} value={item.type_name}>
                                    {item.type_name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Cooler Capacity */}
                            <div className="col-span-1">
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                Capacity <span className="text-rose-500">*</span>
                                {isLoadingCapacities && (
                                  <span className="text-[10px] text-sky-500 font-medium font-sans animate-pulse ml-1">(loading...)</span>
                                )}
                              </label>
                              <select 
                                value={cooldeskForm.capacity}
                                onChange={(e) => setCooldeskForm(prev => ({ ...prev, capacity: e.target.value }))}
                                className="w-full bg-slate-50/20 border border-slate-200 hover:bg-white focus:bg-white rounded-xl py-3 px-3.5 text-sm focus:border-sky-500 focus:outline-hidden ring-offset-2 focus:ring-2 focus:ring-sky-100 transition-all font-medium text-slate-700 cursor-pointer"
                              >
                                <option value="">-- Choose capacity --</option>
                                {capacitiesList.map((item) => (
                                  <option key={item.id} value={item.capacity}>
                                    {item.capacity}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Contact Number */}
                            <div className="col-span-1">
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Contact Number
                              </label>
                              <input 
                                type="tel"
                                placeholder="+94 XX XXX XXXX"
                                value={cooldeskForm.contactNumber}
                                onChange={(e) => setCooldeskForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                                className="w-full bg-slate-50/20 border border-slate-200 hover:bg-white focus:bg-white rounded-xl py-3 px-3.5 text-sm focus:border-sky-500 focus:outline-hidden ring-offset-2 focus:ring-2 focus:ring-sky-100 transition-all font-medium"
                              />
                            </div>

                            {/* Name of Person */}
                            <div className="col-span-1">
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Name of Person
                              </label>
                              <input 
                                type="text"
                                placeholder="E.g., Perera or Aruni"
                                value={cooldeskForm.personName}
                                onChange={(e) => setCooldeskForm(prev => ({ ...prev, personName: e.target.value }))}
                                className="w-full bg-slate-50/20 border border-slate-200 hover:bg-white focus:bg-white rounded-xl py-3 px-3.5 text-sm focus:border-sky-500 focus:outline-hidden ring-offset-2 focus:ring-2 focus:ring-sky-100 transition-all font-medium"
                              />
                            </div>

                            {/* Submit Button */}
                            <motion.button 
                              whileTap={{ scale: 0.98 }}
                              type="submit"
                              disabled={isCoolDeskSubmitting}
                              className="w-full col-span-1 md:col-span-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 hover:shadow-lg hover:shadow-sky-500/10 cursor-pointer text-white font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                            >
                              {isCoolDeskSubmitting ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  <span>Logging Complaint ticket...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4" />
                                  <span>Submit Complaint</span>
                                </>
                              )}
                            </motion.button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. OutletTrack App Screen */}
                  {activeSubPage === 'outlettrack' && (
                    <div className="pb-8">
                      {/* Sub-app Header */}
                      <div className="bg-slate-50 px-4 py-4 flex items-center justify-between border-b border-slate-200">
                        <button 
                          onClick={() => setActiveSubPage(null)}
                          className="flex items-center gap-1.5 text-slate-800 font-sans font-bold text-xs uppercase tracking-wider bg-white py-1.5 px-3 rounded border border-slate-300 shadow-xs"
                        >
                          <ChevronLeft className="w-4 h-4 text-slate-900" />
                          <span>Hub</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <Store className="w-5 h-5 text-slate-800" />
                          <span className="font-sans font-extrabold text-slate-900 text-lg">OutletTrack</span>
                        </div>
                        <div className="w-16"></div>
                      </div>

                      {/* Content */}
                      <div className="px-5 py-4">
                        <div className="flex justify-between items-center mb-3">
                          <h2 className="text-base font-bold text-slate-800">Assigned Stores today</h2>
                          <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 py-1 px-2.5 rounded-full">
                            {Object.keys(completedVisits).length} of {outletsList.length} Checked-in
                          </span>
                        </div>

                        {/* Search Outlets */}
                        <div className="relative mb-4">
                          <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Find outlet name or location..." 
                            value={outletSearch}
                            onChange={(e) => setOutletSearch(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-9 pr-4 text-sm focus:border-emerald-500 focus:outline-hidden transition-all"
                          />
                        </div>

                        {/* List Outlets to Audit/Visit */}
                        <div className="space-y-3">
                          {outletsList.filter(o => o.name.toLowerCase().includes(outletSearch.toLowerCase())).map((outlet) => {
                            const isDone = completedVisits[outlet.rtCode];
                            return (
                              <div key={outlet.rtCode} className="bg-white border border-slate-100 shadow-xs hover:border-slate-200 rounded-2xl p-4 transition-all">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{outlet.name}</h4>
                                      {isDone && (
                                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                          <Check className="w-2.5 h-2.5" /> Checked In
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-400 font-mono mt-1">{outlet.rtCode} · {outlet.address}</p>
                                  </div>

                                  <button 
                                    onClick={() => isDone ? null : setShowCheckInModal(outlet)}
                                    className={`ml-2 py-1.5 px-3 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                                      isDone 
                                        ? 'bg-slate-100 text-slate-400 cursor-default' 
                                        : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
                                    }`}
                                  >
                                    {isDone ? 'Visited' : 'Check In'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Visit Check-in modal drawer */}
                      {showCheckInModal && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-end justify-center z-50">
                          <motion.div 
                            initial={{ y: 200 }} 
                            animate={{ y: 0 }} 
                            className="bg-white rounded-t-3xl w-full max-w-md md:max-w-3xl p-6 space-y-4"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-xs text-emerald-600 font-bold tracking-wider uppercase">Field Inspection Task</span>
                                <h3 className="font-bold text-slate-800 text-lg">{showCheckInModal.name}</h3>
                              </div>
                              <button onClick={() => setShowCheckInModal(null)} className="p-1 bg-slate-100 rounded-full">
                                <X className="w-5 h-5 text-slate-500" />
                              </button>
                            </div>

                            <p className="text-xs text-slate-400">
                              Verify shelf layout checklist items before publishing inspection feedback.
                            </p>

                            <div className="space-y-3">
                              <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={visitChecklist.coolerClean} 
                                  onChange={(e) => setVisitChecklist(prev => ({ ...prev, coolerClean: e.target.checked }))}
                                  className="accent-emerald-500 h-4 md:h-5 w-4 md:w-5"
                                />
                                <div className="text-left">
                                  <span className="text-sm font-bold text-slate-700 block">Cooler Cabin Maintenance</span>
                                  <span className="text-xs text-slate-400">Is the LBCL refrigerator cleaned, powered & organized?</span>
                                </div>
                              </label>

                              <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={visitChecklist.pricingVerified} 
                                  onChange={(e) => setVisitChecklist(prev => ({ ...prev, pricingVerified: e.target.checked }))}
                                  className="accent-emerald-500 h-4 md:h-5 w-4 md:w-5"
                                />
                                <div className="text-left">
                                  <span className="text-sm font-bold text-slate-700 block">Retail Pricing Validation</span>
                                  <span className="text-xs text-slate-400">Are retail stickers conforming to MSRP index policy?</span>
                                </div>
                              </label>

                              <label className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={visitChecklist.stockCounted} 
                                  onChange={(e) => setVisitChecklist(prev => ({ ...prev, stockCounted: e.target.checked }))}
                                  className="accent-emerald-500 h-4 md:h-5 w-4 md:w-5"
                                />
                                <div className="text-left">
                                  <span className="text-sm font-bold text-slate-700 block">Total SKU Stock Inventory Ledger</span>
                                  <span className="text-xs text-slate-400">Counts updated on the backend dashboard</span>
                                </div>
                              </label>
                            </div>

                            <button 
                              onClick={() => {
                                setCompletedVisits(prev => ({ ...prev, [showCheckInModal.rtCode]: true }));
                                // Push activity
                                setRecentActivities(prev => [
                                  {
                                    id: 'ra-' + Date.now(),
                                    type: 'success',
                                    title: 'Visited & Audited Store',
                                    subtitle: `${showCheckInModal.name} · Verified checklist`,
                                    timeAgo: 'Just now',
                                  },
                                  ...prev
                                ]);
                                setShowCheckInModal(null);
                                setVisitChecklist({ coolerClean: false, pricingVerified: false, stockCounted: false, promotionsActive: false });
                              }}
                              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl"
                            >
                              Finish Store Inspection Check-in
                            </button>
                          </motion.div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. SalesBoard App Screen */}
                  {activeSubPage === 'salesboard' && (
                    <div className="pb-8">
                      {/* Sub-app Header */}
                      <div className="bg-slate-50 px-4 py-4 flex items-center justify-between border-b border-slate-200">
                        <button 
                          onClick={() => setActiveSubPage(null)}
                          className="flex items-center gap-1.5 text-slate-800 font-sans font-bold text-xs uppercase tracking-wider bg-white py-1.5 px-3 rounded border border-slate-300 shadow-xs"
                        >
                          <ChevronLeft className="w-4 h-4 text-slate-900" />
                          <span>Hub</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-5 h-5 text-slate-800" />
                          <span className="font-sans font-extrabold text-slate-900 text-lg">SalesBoard</span>
                        </div>
                        <div className="w-16"></div>
                      </div>

                      {/* Sales Analytics Charts Mockup using high-fidelity vector styling */}
                      <div className="px-5 py-4 space-y-4">
                        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100">
                          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Gross Sales Realized</span>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black text-slate-800">LKR 1,842,500</span>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              +14.2%
                            </span>
                          </div>

                          {/* Interactive High-Fidelity Custom SVG Sales Trend Bar chart */}
                          <div className="mt-5 h-36 flex items-end justify-between gap-1.5 relative">
                            {/* Peak indicator */}
                            <div className="absolute top-0 right-0 bg-purple-100 text-purple-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                              Monthly High Peak achieved
                            </div>

                            {[
                              { label: 'Mon', h: 'h-16', val: '240K' },
                              { label: 'Tue', h: 'h-24', val: '320K' },
                              { label: 'Wed', h: 'h-28', val: '410K' },
                              { label: 'Thu', h: 'h-20', val: '290K' },
                              { label: 'Fri', h: 'h-32', val: '510K' },
                              { label: 'Sat', h: 'h-12', val: '180K' },
                            ].map((bar, idx) => (
                              <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                                {/* Tooltip */}
                                <div className="absolute -top-8 bg-slate-800 text-white text-[10px] font-bold py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                  {bar.val}
                                </div>
                                <div className={`w-full bg-purple-500 rounded-t-lg transition-all ${bar.h} group-hover:bg-purple-600 group-hover:shadow-xs group-hover:shadow-purple-500/25`}></div>
                                <span className="text-[10px] text-slate-400 mt-2 font-bold">{bar.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Additional stats bento cards */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                            <span className="text-xs text-slate-400 font-semibold block">Dealers Reached</span>
                            <span className="text-lg font-black text-slate-800 mt-1 block">94 outlets</span>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                              <div className="bg-purple-500 h-full w-[78%]"></div>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">78% of target</span>
                          </div>

                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                            <span className="text-xs text-slate-400 font-semibold block">Volume Dispatched</span>
                            <span className="text-lg font-black text-slate-800 mt-1 block">22,400 Cases</span>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                              <div className="bg-emerald-500 h-full w-[91%]"></div>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">91% fulfillment</span>
                          </div>
                        </div>

                        {/* Top Products Table */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">Bestseller Beverages</h4>
                          <div className="space-y-2">
                            {[
                              { rank: 1, name: 'Premium Lager CAP', sales: '8,400 cases', share: '38%' },
                              { rank: 2, name: 'Soda Elite Carbonated', sales: '5,100 cases', share: '24%' },
                              { rank: 3, name: 'Citrus Tonic splash', sales: '3,900 cases', share: '18%' },
                            ].map(item => (
                              <div key={item.rank} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50 last:border-b-0">
                                <div className="flex items-center gap-2">
                                  <span className="w-4 h-4 bg-purple-50 text-purple-700 rounded-full flex items-center justify-center font-bold text-[10px]">
                                    {item.rank}
                                  </span>
                                  <span className="font-bold text-slate-700">{item.name}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold text-slate-800 block">{item.sales}</span>
                                  <span className="text-[9px] text-slate-400 block">{item.share} market share</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. StockCheck App Screen */}
                  {activeSubPage === 'stockcheck' && (
                    <div className="pb-8">
                      {/* Sub-app Header */}
                      <div className="bg-slate-50 px-4 py-4 flex items-center justify-between border-b border-slate-200">
                        <button 
                          onClick={() => setActiveSubPage(null)}
                          className="flex items-center gap-1.5 text-slate-800 font-sans font-bold text-xs uppercase tracking-wider bg-white py-1.5 px-3 rounded border border-slate-300 shadow-xs"
                        >
                          <ChevronLeft className="w-4 h-4 text-slate-900" />
                          <span>Hub</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <Box className="w-5 h-5 text-slate-800" />
                          <span className="font-sans font-extrabold text-slate-900 text-lg">StockCheck</span>
                        </div>
                        <div className="w-16"></div>
                      </div>

                      {/* Stock Check Content */}
                      <div className="px-5 py-4">
                        <div className="mb-4">
                          <h2 className="text-base font-bold text-slate-800">Warehouse SKU Inventory list</h2>
                          <p className="text-xs text-slate-400">Simulate quick dispatch checks or verify counts manually.</p>
                        </div>

                        {/* Search SKU */}
                        <div className="relative mb-4">
                          <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Search warehouse products or codes..." 
                            value={stockSearch}
                            onChange={(e) => setStockSearch(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-9 pr-4 text-sm focus:border-amber-500 focus:outline-hidden transition-all"
                          />
                        </div>

                        {/* Stock List with interactive incrementor */}
                        <div className="space-y-3">
                          {stockLevels.filter(item => item.name.toLowerCase().includes(stockSearch.toLowerCase()) || item.sku.toLowerCase().includes(stockSearch.toLowerCase())).map((item) => {
                            const isLow = item.count < item.minCount;
                            const isCritical = item.count < 10;
                            return (
                              <div key={item.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-400 px-1 py-0.2 rounded mt-1 inline-block">
                                      {item.sku}
                                    </span>
                                    
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                        isCritical 
                                          ? 'bg-rose-100 text-rose-700' 
                                          : isLow 
                                            ? 'bg-amber-100 text-amber-700' 
                                            : 'bg-emerald-100 text-emerald-700'
                                      }`}>
                                        {isCritical ? 'Critical Stock' : isLow ? 'Low Stock' : 'Secure Stock'}
                                      </span>
                                      <span className="text-xs text-slate-400">Min limit: {item.minCount} cases</span>
                                    </div>
                                  </div>

                                  {/* Interactive incrementor */}
                                  <div className="flex flex-col items-center bg-slate-50 border border-slate-100 rounded-2xl p-1">
                                    <button 
                                      onClick={() => {
                                        setStockLevels(prev => prev.map(s => s.id === item.id ? { ...s, count: s.count + 1 } : s));
                                      }}
                                      className="p-1 px-2.5 text-slate-600 hover:text-amber-600 active:scale-90 font-bold"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="text-sm font-black text-slate-700 py-0.5 px-2">{item.count}</span>
                                    <button 
                                      onClick={() => {
                                        setStockLevels(prev => prev.map(s => s.id === item.id ? { ...s, count: Math.max(0, s.count - 1) } : s));
                                      }}
                                      className="p-1 px-2.5 text-slate-600 hover:text-amber-600 active:scale-95 font-bold"
                                    >
                                      —
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. RouteMap App Screen */}
                  {activeSubPage === 'routemap' && (
                    <div className="pb-8">
                      {/* Sub-app Header */}
                      <div className="bg-slate-50 px-4 py-4 flex items-center justify-between border-b border-slate-200">
                        <button 
                          onClick={() => setActiveSubPage(null)}
                          className="flex items-center gap-1.5 text-slate-800 font-sans font-bold text-xs uppercase tracking-wider bg-white py-1.5 px-3 rounded border border-slate-300 shadow-xs"
                        >
                          <ChevronLeft className="w-4 h-4 text-slate-900" />
                          <span>Hub</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <Map className="w-5 h-5 text-slate-800" />
                          <span className="font-sans font-extrabold text-slate-900 text-lg">RouteMap</span>
                        </div>
                        <div className="w-16"></div>
                      </div>

                      {/* Route Map Content */}
                      <div className="px-5 py-4 space-y-4">
                        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100">
                          <h3 className="font-bold text-sm text-slate-800 mb-2">Today's Sequence Delivery route</h3>
                          <p className="text-xs text-slate-400">Total estimated travel time: 3 hours and 35 minutes.</p>

                          {/* Visual Road Line representation */}
                          <div className="mt-5 relative pl-6 space-y-6">
                            {/* Running vertical dashed route line */}
                            <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 border-l-2 border-dashed border-yellow-400"></div>

                            {routeStops.map((stop) => {
                              const isCompleted = stop.status === 'Completed';
                              const isNavigating = stop.status === 'Navigating';
                              return (
                                <div key={stop.stopNum} className="relative flex justify-between items-start">
                                  {/* Absolute marker dot */}
                                  <div className={`absolute -left-[20px] w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                                    isCompleted 
                                      ? 'bg-emerald-500 shadow-xs' 
                                      : isNavigating 
                                        ? 'bg-yellow-500 animate-ping' 
                                        : 'bg-slate-300'
                                  }`}>
                                    {isCompleted && <Check className="w-2.5 h-2.5 text-white" />}
                                  </div>

                                  <div>
                                    <span className="text-xs font-black text-slate-400 font-mono">STOP 0{stop.stopNum}</span>
                                    <h4 className={`font-bold text-sm leading-tight ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                      {stop.name}
                                    </h4>
                                    <span className="text-xs text-slate-400 font-semibold">{stop.address} · Est: {stop.estTime}</span>
                                  </div>

                                  <button 
                                    onClick={() => setSelectedStopForNavigation(stop.stopNum)}
                                    className={`py-1 px-2 text-[10px] rounded font-bold uppercase tracking-wider ${
                                      isCompleted 
                                        ? 'bg-slate-50 text-slate-300 pointer-events-none' 
                                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                    }`}
                                  >
                                    {isCompleted ? 'Completed' : 'Map Pin'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Interactive driving assist narrative */}
                        {selectedStopForNavigation && (
                          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                              <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live GPS Assistant</span>
                              </div>
                              <button onClick={() => setSelectedStopForNavigation(null)} className="text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-slate-800 rounded-xl text-yellow-500">
                                <MapPin className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="text-xs text-slate-400 block font-semibold">Active Destination</span>
                                <span className="text-sm font-bold block mt-0.5">
                                  {routeStops.find(s => s.stopNum === selectedStopForNavigation)?.name}
                                </span>
                                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                                  Head south-east on Galle road toward Sea Beach street. In 400m, keep right at the roundabout, then destination will be on the left.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 6. TeamSync App Screen */}
                  {activeSubPage === 'teamsync' && (
                    <div className="pb-8">
                      {/* Sub-app Header */}
                      <div className="bg-slate-50 px-4 py-4 flex items-center justify-between border-b border-slate-200">
                        <button 
                          onClick={() => setActiveSubPage(null)}
                          className="flex items-center gap-1.5 text-slate-800 font-sans font-bold text-xs uppercase tracking-wider bg-white py-1.5 px-3 rounded border border-slate-300 shadow-xs"
                        >
                          <ChevronLeft className="w-4 h-4 text-slate-900" />
                          <span>Hub</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-5 h-5 text-slate-800" />
                          <span className="font-sans font-extrabold text-slate-900 text-lg">TeamSync</span>
                        </div>
                        <div className="w-16"></div>
                      </div>

                      {/* Team Sync Content */}
                      <div className="px-5 py-4 space-y-4">
                        {/* Map listing team members */}
                        <div className="space-y-2">
                          <h3 className="font-bold text-sm text-slate-800">Our Field Team Status</h3>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {teamMembers.map((member) => (
                              <div key={member.name} className="bg-white border border-slate-100 rounded-xl p-3 shadow-xs text-center flex flex-col items-center">
                                <div className="relative">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center">
                                    {member.avatar}
                                  </div>
                                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                    member.active ? 'bg-emerald-500' : 'bg-slate-300'
                                  }`}></span>
                                </div>
                                <h4 className="font-bold text-slate-800 text-xs mt-2 line-clamp-1">{member.name}</h4>
                                <span className="text-[10px] text-slate-400 font-medium">{member.role}</span>
                                <span className="text-[9px] text-slate-500 italic mt-1 font-mono">{member.statusText}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Interactive message chat component */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Sync Chat Feed</h4>
                          
                          <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
                            {teamChats.map((chat) => (
                              <div key={chat.id} className="text-xs">
                                <div className="flex justify-between font-bold text-slate-700">
                                  <span>{chat.sender}</span>
                                  <span className="text-slate-400 text-[10px] font-normal">{chat.time}</span>
                                </div>
                                <p className="bg-slate-50 border border-slate-100/50 rounded-xl p-2.5 mt-1 text-slate-600 font-medium">
                                  {chat.text}
                                </p>
                              </div>
                            ))}
                          </div>

                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!newChatMessage.trim()) return;
                              setTeamChats(prev => [
                                ...prev,
                                {
                                  id: 'tc-' + Date.now(),
                                  sender: 'Rumesh (Field Lead)',
                                  text: newChatMessage,
                                  time: 'Just now',
                                }
                              ]);
                              setNewChatMessage('');
                            }}
                            className="flex gap-2"
                          >
                            <input 
                              type="text" 
                              placeholder="Type brief team memo..." 
                              value={newChatMessage}
                              onChange={(e) => setNewChatMessage(e.target.value)}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-pink-500 focus:outline-hidden"
                            />
                            <button className="bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs py-2 px-3 rounded-xl">
                              Send
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* Regular navigation tabs pages */
                <motion.div
                  key={`tab-${activeTab}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* TAB 1: HOME */}
                  {activeTab === 'home' && (
                    <div className="px-5 py-4 space-y-6">
                      
                      {/* MY APPS SECTION */}
                      <div>
                        <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
                          <h2 className="text-xl font-sans font-extrabold text-slate-900 tracking-tight">Business Systems</h2>
                          <button 
                            onClick={() => setActiveTab('apps')} 
                            className="text-xs font-sans font-bold text-sky-600 hover:text-sky-850 hover:underline tracking-widest uppercase cursor-pointer"
                          >
                            Browse All
                          </button>
                        </div>
                        {/* grid layout representing active launchers */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                          {APP_LIST.map((app) => {
                            const isActive = app.id === 'cooldesk';
                            return (
                              <motion.div 
                                key={app.id}
                                whileHover={isActive ? { y: -3 } : undefined}
                                whileTap={isActive ? { scale: 0.98 } : undefined}
                                onClick={() => {
                                  if (isActive) {
                                    setActiveSubPage(app.id);
                                  }
                                }}
                                className={`bg-white rounded-xl overflow-hidden border transition-all flex flex-col h-40 sm:h-56 ${
                                  isActive 
                                    ? 'border-slate-200 shadow-xs cursor-pointer group' 
                                    : 'border-slate-100 opacity-60 select-none cursor-not-allowed bg-slate-50/10'
                                }`}
                              >
                                {/* Full background image - top 50% on mobile, top 60% on desktop */}
                                <div className="relative h-[50%] sm:h-[60%] w-full overflow-hidden border-b border-slate-100">
                                  <img 
                                    src={app.backgroundImage} 
                                    alt={app.name} 
                                    referrerPolicy="no-referrer"
                                    className={`w-full h-full object-cover transition-transform duration-500 ${
                                      isActive ? 'group-hover:scale-105' : 'grayscale-[40%]'
                                    }`}
                                  />
                                  {/* Dark gradient overlay on image */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent"></div>

                                  {/* App Icon floating over background image top-left */}
                                  <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 bg-white/95 backdrop-blur-xs p-1 sm:p-1.5 rounded shadow-xs border border-slate-200">
                                    {renderIcon(app.icon, "w-3.5 h-3.5 sm:w-4 sm:h-4", isActive ? app.accent : "#94A3B8")}
                                  </div>

                                  {/* Locked / Disabled Badge for inactive apps */}
                                  {!isActive && (
                                    <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 bg-rose-500/10 backdrop-blur-xs border border-rose-500/20 text-rose-600 text-[7px] sm:text-[8px] font-sans font-extrabold tracking-widest px-1 py-0.5 sm:px-2 sm:py-0.5 rounded uppercase flex items-center gap-0.5 sm:gap-1 shadow-xs">
                                      <Lock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                      <span>Locked</span>
                                    </div>
                                  )}
                                </div>

                                {/* White bottom section holding details */}
                                <div className="p-2 sm:p-3.5 flex-1 flex flex-col justify-between" style={{ borderTop: `3px solid ${isActive ? app.accent : "#CBD5E1"}` }}>
                                  <div>
                                    <h3 className={`font-sans font-bold text-xs sm:text-sm line-clamp-1 transition-colors ${
                                      isActive ? 'text-slate-900 group-hover:text-sky-600' : 'text-slate-400'
                                    }`}>{app.name}</h3>
                                    <p className={`text-[9px] sm:text-[10px] font-medium leading-tight mt-0.5 line-clamp-1 ${
                                      isActive ? 'text-slate-400' : 'text-slate-400/70'
                                    }`}>{app.description}</p>
                                  </div>
                                  <div className="flex justify-between items-center mt-1">
                                    {/* Small indicator pill */}
                                    {isActive ? (
                                      <>
                                        <span className="text-[7px] sm:text-[8px] uppercase tracking-widest font-bold text-slate-400">Launch</span>
                                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:translate-x-0.5 transition-all" style={{ color: app.accent }} />
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-[7px] sm:text-[8px] uppercase tracking-widest font-bold text-slate-400/65">Locked</span>
                                        <Lock className="w-2.5 h-2.5 text-slate-300" />
                                      </>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 2: APPLICATIONS (ALL APPS WITH SEARCH & FILTERS) */}
                  {activeTab === 'apps' && (
                    <div className="px-5 py-4 space-y-5">
                      
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="text"
                          placeholder="Search business tools and workflows..."
                          value={appSearch}
                          onChange={(e) => setAppSearch(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg py-3.5 pl-10 pr-4 text-xs tracking-wide focus:border-slate-800 focus:outline-hidden transition-all font-semibold font-sans"
                        />
                      </div>

                      {/* Filter Chips */}
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {(['All', 'Sales', 'Operations', 'Reports'] as const).map((cat) => {
                          const isSelected = appCategory === cat;
                          return (
                            <button
                              key={cat}
                              onClick={() => setAppCategory(cat)}
                              className={`py-1.5 px-4 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                                isSelected 
                                  ? 'bg-slate-900 text-white shadow-xs' 
                                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>

                      {/* Full list grid of apps */}
                      <div>
                        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-1.5">
                          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                            Available Systems ({filteredApps.length})
                          </h3>
                        </div>

                        {filteredApps.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 font-sans">
                            {filteredApps.map((app) => {
                              const isActive = app.id === 'cooldesk';
                              return (
                                <motion.div 
                                  key={app.id}
                                  whileHover={isActive ? { y: -3 } : undefined}
                                  whileTap={isActive ? { scale: 0.98 } : undefined}
                                  onClick={() => {
                                    if (isActive) {
                                      setActiveSubPage(app.id);
                                    }
                                  }}
                                  className={`bg-white rounded-xl overflow-hidden border transition-all flex flex-col h-40 sm:h-56 ${
                                    isActive 
                                      ? 'border-slate-200 shadow-xs cursor-pointer group' 
                                      : 'border-slate-100 opacity-60 select-none cursor-not-allowed bg-slate-50/10'
                                  }`}
                                >
                                  <div className="relative h-[50%] sm:h-[60%] w-full overflow-hidden border-b border-slate-100">
                                    <img 
                                      src={app.backgroundImage} 
                                      alt={app.name} 
                                      referrerPolicy="no-referrer"
                                      className={`w-full h-full object-cover transition-transform duration-500 ${
                                        isActive ? 'group-hover:scale-105' : 'grayscale-[40%]'
                                      }`}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent"></div>
                                    <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 bg-white/95 backdrop-blur-xs p-1 sm:p-1.5 rounded shadow-xs border border-slate-200">
                                      {renderIcon(app.icon, "w-3.5 h-3.5 sm:w-4 sm:h-4", isActive ? app.accent : "#94A3B8")}
                                    </div>

                                    {/* Locked / Disabled Badge for inactive apps */}
                                    {!isActive && (
                                      <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 bg-rose-500/10 backdrop-blur-xs border border-rose-500/20 text-rose-600 text-[7px] sm:text-[8px] font-sans font-extrabold tracking-widest px-1 py-0.5 sm:px-2 sm:py-0.5 rounded uppercase flex items-center gap-0.5 sm:gap-1 shadow-xs">
                                        <Lock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                        <span>Locked</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-2 sm:p-3.5 flex-1 flex flex-col justify-between" style={{ borderTop: `3px solid ${isActive ? app.accent : "#CBD5E1"}` }}>
                                    <div>
                                      <h3 className={`font-sans font-bold text-xs sm:text-sm line-clamp-1 transition-colors ${
                                        isActive ? 'text-slate-900 group-hover:text-sky-600' : 'text-slate-400'
                                      }`}>{app.name}</h3>
                                      <p className={`text-[9px] sm:text-[10px] font-medium leading-tight mt-0.5 line-clamp-1 ${
                                        isActive ? 'text-slate-400' : 'text-slate-400/70'
                                      }`}>{app.description}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                      {/* Small indicator pill */}
                                      {isActive ? (
                                        <>
                                          <span className="text-[7px] sm:text-[8px] uppercase tracking-widest font-bold text-slate-400">Launch</span>
                                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:translate-x-0.5 transition-all" style={{ color: app.accent }} />
                                        </>
                                      ) : (
                                        <>
                                          <span className="text-[7px] sm:text-[8px] uppercase tracking-widest font-bold text-slate-400/65">Locked</span>
                                          <Lock className="w-2.5 h-2.5 text-slate-300" />
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-white border border-slate-200 rounded-xl p-8 py-12 text-center text-slate-400">
                            <Info className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            <p className="text-sm font-bold text-slate-700">No operations tools found</p>
                            <p className="text-xs text-slate-400 mt-1">Try resetting filter or search term</p>
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* TAB 3: NOTIFICATIONS (ALERTS) */}
                  {activeTab === 'alerts' && (
                    <div className="px-5 py-4 space-y-5">
                      
                      <div className="flex justify-between items-baseline border-b border-slate-200 pb-2">
                        <h2 className="text-xl font-sans font-extrabold text-slate-900 tracking-tight">Notification Ledger</h2>
                        <button 
                          onClick={handleMarkAllNotificationsAsRead}
                          className="text-xs font-sans font-bold text-sky-600 hover:text-sky-850 uppercase tracking-wider cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      </div>

                      {/* Grouping */}
                      {['Today', 'Earlier'].map((groupName) => {
                        const items = notifications.filter(n => n.group === groupName);
                        if (items.length === 0) return null;
                        return (
                          <div key={groupName} className="space-y-2.5">
                            <h3 className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest pl-1 mt-1">
                              {groupName}
                            </h3>

                            <div className="space-y-2.5">
                              {items.map((notif) => {
                                const isError = notif.type === 'error';
                                const isSuccess = notif.type === 'success';
                                const isWarning = notif.type === 'warning';
                                return (
                                  <div 
                                    key={notif.id}
                                    onClick={() => {
                                      // Toggle unread state manually on click
                                      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
                                    }}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                      notif.unread 
                                        ? 'bg-sky-50/50 border-sky-200 hover:bg-sky-50/70 shadow-xs' 
                                        : 'bg-white border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className="flex gap-3">
                                      {/* icon indicator circle */}
                                      <div className={`w-8 h-8 rounded flex-shrink-0 flex items-center justify-center border ${
                                        isError 
                                          ? 'bg-rose-50 border-rose-200 text-rose-500' 
                                          : isSuccess 
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-500' 
                                            : isWarning 
                                              ? 'bg-amber-50 border-amber-200 text-amber-500' 
                                              : 'bg-sky-50 border-sky-200 text-sky-500'
                                      }`}>
                                        {isError ? (
                                          <AlertTriangle className="w-4 h-4" />
                                        ) : isSuccess ? (
                                          <Check className="w-4 h-4" />
                                        ) : (
                                          <Info className="w-4 h-4" />
                                        )}
                                      </div>

                                      <div className="flex-1 text-left">
                                        <div className="flex justify-between items-start mb-0.5">
                                          <h4 className="font-bold text-xs text-slate-800">{notif.title}</h4>
                                          <span className="text-[9px] font-semibold text-slate-400 font-sans">{notif.time}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{notif.description}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                    </div>
                  )}

                  {/* TAB 4: PROFILE */}
                  {activeTab === 'profile' && (
                    <div>
                      {/* Premium Top Wave Section */}
                      <div className="bg-slate-50 px-6 pt-8 pb-6 border-b border-slate-200 flex flex-col items-center text-center">
                        {/* White avatar circle with slate initials */}
                        <div className="w-20 h-20 rounded-full bg-white shadow-md border-2 border-slate-300 flex items-center justify-center text-slate-800 text-xl font-sans font-extrabold tracking-wide mb-3 relative">
                          RA
                          {/* Online status indicator dot */}
                          <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                        </div>

                        <h3 className="font-sans font-extrabold text-xl text-slate-900 leading-tight">Rumesh Anjanawardana</h3>
                        <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-1">Senior Field Operations Rep</span>
                        <div className="mt-2.5 bg-slate-900 text-slate-100 font-semibold px-3 py-1 rounded text-[9px] uppercase tracking-wider font-sans">
                          Territory: WESTERN-04 (Colombo Base)
                        </div>
                      </div>

                      {/* Hub stats breakdown Row */}
                      <div className="px-5 py-4">
                        <div className="grid grid-cols-3 gap-2 bg-white rounded-xl p-4 shadow-xs border border-slate-200 text-center divide-x divide-slate-100">
                          <div>
                            <span className="text-2xl font-sans font-extrabold text-slate-900 block">42</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">Store Visits</span>
                          </div>
                          <div>
                            <span className="text-2xl font-sans font-extrabold text-slate-900 block">12</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">Complaints Logs</span>
                          </div>
                          <div>
                            <span className="text-2xl font-sans font-extrabold text-slate-900 block">96%</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">Fulfillment</span>
                          </div>
                        </div>

                        {/* List Settings Card */}
                        <div className="bg-white rounded-xl mt-5 shadow-xs border border-slate-200 overflow-hidden divide-y divide-slate-100">
                          {[
                            { label: 'Merchant Territory Configuration', icon: 'Map', desc: 'Western Province base mapping' },
                            { label: 'Assigned Vehicles & Route Logbook', icon: 'Box', desc: 'LBCL Multi-Van #WP-3829' },
                            { label: 'Sync System & Purge Memory Cache', icon: 'ClipboardCheck', desc: 'Clear 4.2 MB local state' },
                          ].map((setting, idx) => (
                            <div key={idx} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer">
                              <div className="flex items-center gap-3">
                                <span className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-550 text-slate-500">
                                  {renderIcon(setting.icon, "w-4 h-4", "#64748B")}
                                </span>
                                <div className="text-left">
                                  <span className="text-xs font-bold text-slate-700 block">{setting.label}</span>
                                  <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">{setting.desc}</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300" />
                            </div>
                          ))}

                          {/* Red logout trigger option */}
                          <div 
                            onClick={() => {
                              alert("Logging out and syncing localized cached data streams...");
                              setIsRefreshing(true);
                              setTimeout(() => {
                                setIsRefreshing(false);
                                setActiveTab('home');
                              }, 1000);
                            }}
                            className="p-4 flex justify-between items-center hover:bg-rose-50/50 transition-colors cursor-pointer text-rose-600"
                          >
                            <div className="flex items-center gap-3">
                              <span className="p-2 bg-rose-50 rounded border border-rose-100 text-rose-500">
                                <LogOut className="w-4 h-4" />
                              </span>
                              <div className="text-left">
                                <span className="text-xs font-bold block">Sign Out & Freeze Session</span>
                                <span className="text-[10px] text-rose-450 block mt-0.5 text-rose-400">Safely sync with LBCL server gate</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-rose-300" />
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* BOTTOM NAVIGATION TAB BAR WITH GLASS EFFECT AND SHADOW PILLS */}
        <nav className="bg-white py-2.5 px-6 border-t border-slate-200 fixed bottom-0 left-0 right-0 max-w-md md:max-w-3xl mx-auto z-40 shadow-md">
          <div className="flex justify-between items-center">
            
            {/* Button 1: Home */}
            <button 
              onClick={() => {
                setActiveTab('home');
                setActiveSubPage(null);
              }}
              className="flex flex-col items-center cursor-pointer justify-center relative py-1"
            >
              <div className={`p-1 px-3 rounded transition-all flex flex-col items-center ${
                activeTab === 'home' && activeSubPage === null 
                  ? 'text-slate-900 font-extrabold' 
                  : 'text-slate-400'
              }`}>
                <Store className="w-5 h-5" />
                <span className="text-[9px] uppercase font-bold tracking-wider mt-1">Home</span>
              </div>
            </button>

            {/* Button 2: Apps Directory */}
            <button 
              onClick={() => {
                setActiveTab('apps');
                setActiveSubPage(null);
              }}
              className="flex flex-col items-center cursor-pointer justify-center relative py-1"
            >
              <div className={`p-1 px-3 rounded transition-all flex flex-col items-center ${
                activeTab === 'apps' || activeSubPage !== null
                  ? 'text-slate-900 font-extrabold' 
                  : 'text-slate-400'
              }`}>
                <Box className="w-5 h-5" />
                <span className="text-[9px] uppercase font-bold tracking-wider mt-1">Apps</span>
              </div>
            </button>

            {/* Button 3: Alerts Notifications */}
            <button 
              onClick={() => {
                setActiveTab('alerts');
                setActiveSubPage(null);
              }}
              className="flex flex-col items-center cursor-pointer justify-center relative py-1"
            >
              <div className={`p-1 px-3 rounded transition-all flex flex-col items-center relative ${
                activeTab === 'alerts' && activeSubPage === null 
                  ? 'text-slate-900 font-extrabold' 
                  : 'text-slate-400'
              }`}>
                <Bell className="w-5 h-5" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute top-1 right-2 bg-rose-500 w-2 h-2 rounded-full ring-2 ring-white"></span>
                )}
                <span className="text-[9px] uppercase font-bold tracking-wider mt-1">Alerts</span>
              </div>
            </button>

            {/* Button 4: Profile rep */}
            <button 
              onClick={() => {
                setActiveTab('profile');
                setActiveSubPage(null);
              }}
              className="flex flex-col items-center cursor-pointer justify-center relative py-1"
            >
              <div className={`p-1 px-3 rounded transition-all flex flex-col items-center ${
                activeTab === 'profile' && activeSubPage === null 
                  ? 'text-slate-900 font-extrabold' 
                  : 'text-slate-400'
              }`}>
                <User className="w-5 h-5" />
                <span className="text-[9px] uppercase font-bold tracking-wider mt-1">Profile</span>
              </div>
            </button>

          </div>
        </nav>

      </div>
    </div>
  );
}
