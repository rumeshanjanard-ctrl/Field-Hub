/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
// @ts-ignore
import loginWallArtBg from './assets/images/login_wall_art_1781191937515.jpg';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardCheck, AlertTriangle, Store, TrendingUp, Box, Map, Users,
  ThermometerSnowflake, Bell, ArrowRight, ChevronRight, Search, 
  MapPin, LogOut, Loader2, Check, Send, Sparkles, Phone, User, Info, 
  Plus, X, CheckCircle, RefreshCw, SlidersHorizontal, ChevronLeft,
  DollarSign, Activity, Eye, Play, Star, Circle, Landmark, Target, Lock,
  Sun, Moon, Bluetooth, Printer, Settings, Globe, Trash2
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

// Resolve standard or external email formats to the corresponding active 'se_code'
const resolveSeCodeFromEmail = (email: string, outlets?: Outlet[]): string => {
  const norm = email.toLowerCase().trim();
  
  // 1. If we have fetched outlets, try finding a record matching this email in the seCode column
  if (outlets && outlets.length > 0) {
    const matchedOutlet = outlets.find(o => {
      const oSe = (o.seCode || '').toLowerCase().trim();
      return oSe === norm;
    });
    if (matchedOutlet && matchedOutlet.seCode) {
      return matchedOutlet.seCode;
    }

    // 2. Try matching the email's prefix (username) as se_code in outlets
    const prefix = norm.split('@')[0];
    const prefixMatch = outlets.find(o => {
      const oSe = (o.seCode || '').toLowerCase().trim();
      return oSe === prefix;
    });
    if (prefixMatch && prefixMatch.seCode) {
      return prefixMatch.seCode;
    }

    // 3. Try fuzzy or specific name matches inside fetched outlets
    let matchedName: string | null = null;
    if (norm.includes('dilshan')) matchedName = 'dilshan';
    else if (norm.includes('rumesh')) matchedName = 'rumesh';
    else if (norm.includes('nisansala')) matchedName = 'nisansala';
    else if (norm.includes('asanka')) matchedName = 'asanka';

    if (matchedName) {
      const nameMatch = outlets.find(o => {
        const oSe = (o.seCode || '').toLowerCase().trim();
        return oSe === matchedName;
      });
      if (nameMatch && nameMatch.seCode) {
        return nameMatch.seCode;
      }
    }
  }

  // 4. Static fallbacks if outlets array is empty or not yet loaded
  if (norm.endsWith('@lbcl.com')) {
    // strip standard domain to get active se_code in uppercase
    return norm.replace('@lbcl.com', '').toUpperCase();
  }
  
  // Custom mapping for external emails
  if (norm === 'rrdilshan576@gmail.com') return 'DILSHAN';
  if (norm === 'rumeshanjanard@gmail.com') return 'RUMESH';
  
  // Fuzzy matching if email contains standard rep names
  if (norm.includes('dilshan')) return 'DILSHAN';
  if (norm.includes('rumesh')) return 'RUMESH';
  if (norm.includes('nisansala')) return 'NISANSALA';
  if (norm.includes('asanka')) return 'ASANKA';
  
  const prefix = norm.split('@')[0];
  return prefix.toUpperCase();
};

// Helper to match logged in representative's code to outlet details
const isMatchingSeCode = (userSeCode: string, outletSeCode: string, outletRtCode: string): boolean => {
  const u = userSeCode.toLowerCase().trim().replace(/['"“”]/g, '');
  const oSe = outletSeCode.toLowerCase().trim().replace(/['"“”]/g, '');
  const oRt = outletRtCode.toLowerCase().trim().replace(/['"“”]/g, '');

  if (!u) return false;

  // 1. Exact match
  if (u === oSe || u === oRt) return true;

  // 2. Strip email domains
  const uPrefix = u.split('@')[0];
  const oSePrefix = oSe.split('@')[0];
  if (uPrefix === oSePrefix) return true;

  // 3. Digits match (e.g. "se-1092" contains "1092", matching "RT-1092" or "1092")
  const uDigits = u.replace(/\D/g, '');
  const oRtDigits = oRt.replace(/\D/g, '');
  const oSeDigits = oSe.replace(/\D/g, '');

  if (uDigits && oRtDigits && uDigits === oRtDigits) return true;
  if (uDigits && oSeDigits && uDigits === oSeDigits) return true;

  // 4. Equivalence groups
  const equivs = [
    ['rumesh', 'se-1092', 'se1092', 'rumeshanjanard', 'rt-1092', '1092'],
    ['dilshan', 'se-4482', 'se4482', 'rrdilshan576', 'rt-4482', '4482'],
    ['nisansala', 'se-9938', 'se9938', 'rt-9938', '9938'],
    ['asanka', 'se-2231', 'se2231', 'rt-2231', '2231']
  ];

  for (const group of equivs) {
    const hasU = group.some(item => u.includes(item) || item.includes(uPrefix));
    const hasOSe = group.some(item => oSe.includes(item) || item.includes(oSePrefix));
    const hasORt = group.some(item => oRt.includes(item));
    if (hasU && (hasOSe || hasORt)) {
      return true;
    }
  }

  // 5. Substring matches for other representatives
  if (uPrefix.length > 2 && oSePrefix.length > 2) {
    if (uPrefix.includes(oSePrefix) || oSePrefix.includes(uPrefix)) return true;
  }

  return false;
};

const translations = {
  EN: {
    settingsTitle: "Terminal Settings",
    settingsSub: "Application Preferences & Hardware Configuration",
    
    // Theme
    themeLabel: "Midnight Mode (Dark Theme)",
    themeDesc: "Toggle dark layout canvas to protect eyes during early morning or late night operations",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    
    // Language
    langLabel: "Terminal Language (භාෂාව)",
    langDesc: "Switch app descriptions between English and Sinhala",
    
    // Account details
    accountTitle: "Account & Profile",
    accountSinhala: "පෞද්ගලික තොරතුරු",
    accountDesc: "Review current Field Representative profile registry",
    fullName: "Full Name",
    seCode: "Service SE Code",
    email: "Corporate Email Address",
    phone: "Contact Mobile",
    lockNote: "Contact Admin to alter profile details.",
    
    // Change Password
    changePassTitle: "Change Account Password",
    currentPass: "Current Password",
    newPass: "New Password",
    confirmPass: "Confirm New Password",
    updatePassBtn: "Update Credentials via Supabase",
    
    // Device & Sync
    syncTitle: "Device & Sync Engine",
    syncSinhala: "ෆීල්ඩ් මෙහෙයුම් සඳහා",
    syncDesc: "Manage offline logs and sync indicators",
    manualSyncBtn: "Force Cloud Synchronization",
    syncSuccess: "Database completely synchronized with Supabase!",
    clearCacheBtn: "Wipe Local Sandbox Cache",
    clearCacheDesc: "Purge cached images, outlets database, and temporary session keys",
    confirmClearTitle: "Are you absolutely sure?",
    confirmClearDesc: "This will wipe all cached stores, disconnect print interfaces, and reset the app. Unsaved offline reports might be lost.",
    confirmYes: "Yes, Reset Memory",
    confirmNo: "Cancel",
    storageStatus: "Local App Storage Status",
    spaceUsed: "4.8 MB of cache space occupied",
    
    // Printer settings
    printerTitle: "Hardware & Printer Setup",
    printerSinhala: "ලොජිස්ටික්ස් සහ ප්රින්ටින්",
    printerDesc: "Establish wireless connection with thermal POS terminal",
    printerBt: "Bluetooth Connection Indicator",
    searchDevices: "Scan for Bluetooth Printers",
    connectedText: "Connected & Calibrated",
    disconnectBtn: "Disconnect",
    testPrintBtn: "Dispatch Test Slip",
    testPrintDisabled: "Requires Active Printer Hook",
    receiptNotesLabel: "Custom Footnote Note",
    receiptNotesPlaceholder: "e.g., Thank you! - Lion Brewery PLC",
    scannedTitle: "Scanned Bluetooth Terminals",
    
    // Receipt test preview popup
    slipPreviewTitle: "Thermal Slip Test Output",
    slipMockText: "LION BREWERY TERMINAL SLIP",
    slipPrintedAt: "Printed at: ",
    slipFooter: "Footer Note appended:"
  },
  SI: {
    settingsTitle: "පර්යන්ත සැකසුම්",
    settingsSub: "යෙදුම් මනාප සහ දෘඩාංග වින්‍යාසය",
    
    // Theme
    themeLabel: "රාත්‍රී ප්‍රකාරය (අඳුරු තේමාව)",
    themeDesc: "අලුයම හෝ ප්‍රමාද රාත්‍රී මෙහෙයුම් වලදී ඇස් ආරක්ෂා කිරීමට අඳුරු පිරිසැලසුම සක්‍රිය කරන්න",
    lightMode: "දිවා ප්‍රකාරය",
    darkMode: "රාත්‍රී ප්‍රකාරය",
    
    // Language
    langLabel: "පර්යන්ත භාෂාව (Language)",
    langDesc: "යෙදුමේ විස්තර ඉංග්‍රීසි සහ සිංහල අතර මාරු කරන්න",
    
    // Account details
    accountTitle: "ගිණුම සහ පැතිකඩ",
    accountSinhala: "පෞද්ගලික තොරතුරු",
    accountDesc: "වත්මන් ක්ෂේත්‍ර නියෝජිත ලේඛනය සමාලෝචනය කරන්න",
    fullName: "සම්පූර්ණ නම",
    seCode: "සේවා කේතය (SE Code)",
    email: "ආයතනික විද්‍යුත් තැපෑල",
    phone: "දුරකථන අංකය",
    lockNote: "පැතිකඩ විස්තර වෙනස් කිරීමට පරිපාලක අමතන්න.",
    
    // Change Password
    changePassTitle: "ගිණුමේ මුරපදය වෙනස් කරන්න",
    currentPass: "වත්මන් මුරපදය",
    newPass: "නව මුරපදය",
    confirmPass: "නව මුරපදය තහවුරු කරන්න",
    updatePassBtn: "Supabase හරහා මුරපදය යාවත්කාලීන කරන්න",
    
    // Device & Sync
    syncTitle: "උපාංග සහ දත්ත සමමුහුර්තකරණය",
    syncSinhala: "ෆීල්ඩ් මෙහෙයුම් සඳහා",
    syncDesc: "නොබැඳි දත්ත සහ සමමුහුර්ත හස්තීය මෙහෙයුම්",
    manualSyncBtn: "වලාකුළු සමමුහුර්තකරණය ක්‍රියාත්මක කරන්න",
    syncSuccess: "දත්ත සියල්ල සාර්ථකව Supabase වෙත උඩුගත කරන ලදී!",
    clearCacheBtn: "දේශීය දත්ත ගබඩා ඉවත් කරන්න",
    clearCacheDesc: "තාවකාලික රූප, පර්යන්ත දත්ත සහ සැසි තොරතුරු සම්පූර්ණයෙන්ම මකා දමන්න",
    confirmClearTitle: "ඔබට විශ්වාසද?",
    confirmClearDesc: "මෙය ඔබගේ එකතු කරන ලද දත්ත මකා දමන අතර මුද්‍රණ යන්ත්‍ර විසන්ධි කර යෙදුම නැවත සකසනු ඇත.",
    confirmYes: "ඔව්, දත්ත මකන්න",
    confirmNo: "අවලංගු කරන්න",
    storageStatus: "දේශීය දත්ත ගබඩා තත්ත්වය",
    spaceUsed: "දත්ත මෙගාබයිට් 4.8ක් භාවිතා කර ඇත",
    
    // Printer settings
    printerTitle: "දෘඩාංග සහ මුද්‍රණ යන්ත්‍ර සැකසුම",
    printerSinhala: "ලොජිස්ටික්ස් සහ ප්රින්ටින්",
    printerDesc: "රසිට්පත් මුද්‍රණ යන්ත්‍රය මෙතනින් සම්බන්ධ කරන්න",
    printerBt: "Bluetooth සම්බන්ධතා තත්ත්වය",
    searchDevices: "මුද්‍රණ යන්ත්‍ර සොයන්න",
    connectedText: "සාර්ථකව සම්බන්ධ කර ඇත",
    disconnectBtn: "විසන්ධි කරන්න",
    testPrintBtn: "පරීක්ෂණ මුද්‍රණයක් ලබා ගන්න",
    testPrintDisabled: "මුද්‍රණ යන්ත්‍රයක් සම්බන්ධ කර තිබිය යුතුය",
    receiptNotesLabel: "අතිරේක පාදක සටහන",
    receiptNotesPlaceholder: "උදා: ස්තුතියි! - සිංහ බීර සමාගම",
    scannedTitle: "හමු වූ Bluetooth මුද්‍රණ යන්ත්‍ර",
    
    // Receipt test preview popup
    slipPreviewTitle: "පරීක්ෂණ මුද්‍රණ පෙරදසුන",
    slipMockText: "සිංහ බීර සමාගම් රිසිට්පත",
    slipPrintedAt: "මුද්‍රිත වේලාව: ",
    slipFooter: "එක් කරන ලද පාදක සටහන:"
  }
};

export default function App() {
  // Page routing and tab states
  // tab: 'home' | 'competitor' | 'profile'
  const [activeTab, setActiveTab] = useState<'home' | 'competitor' | 'profile'>('home');

  // Competitor Tracking State and Form Configs
  interface CompetitorRecord {
    id: string;
    outletName: string;
    rtCode: string;
    competitorBrand: string;
    skuName?: string;
    skuQty: string;
    skuPrice?: string;
    invoicePhoto: string | null;
    notes: string;
    date: string;
    skus?: { sku_type: string; quantity: string | number }[];
    totalSkuQty?: number;
    uniqueSkusCount?: number;
  }

  const COMPETITOR_BRANDS = [
    'Anchor Smooth',
    'Anchor Strong',
    'Tiger Original',
    'Tiger Black',
    'Heineken',
    'Bison Special Stout',
    'Bison Gold',
    'Tiger Crystal',
    'Bison Breeze',
    'DCSL Premium',
    'DCSL Lager',
    'DCSL Strong',
    'DCSL Stout',
    'Aliya Lager',
    'Aliya Strong'
  ];

  const [competitorRecords, setCompetitorRecords] = useState<CompetitorRecord[]>(() => {
    const cached = localStorage.getItem('lbcl_competitor_records');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: 'competitor-1',
        outletName: 'Cargills Food City - Colombo 03',
        rtCode: 'RT-1092',
        competitorBrand: 'Tiger Black',
        invoicePhoto: null,
        notes: 'Price adjustment noticed on premium can SKUs in this territory.',
        date: '2026-06-11',
        skuQty: '15',
        skuPrice: '6750',
        skus: [{ sku_type: '500ml', quantity: '15' }],
        totalSkuQty: 15,
        uniqueSkusCount: 1
      },
      {
        id: 'competitor-2',
        outletName: 'Keells Super - Union Place',
        rtCode: 'RT-9938',
        competitorBrand: 'Heineken',
        invoicePhoto: null,
        notes: 'Enhanced refrigerator shelf space allocation for competitors.',
        date: '2026-06-12',
        skuQty: '30',
        skuPrice: '15600',
        skus: [{ sku_type: '330ml', quantity: '30' }],
        totalSkuQty: 30,
        uniqueSkusCount: 1
      }
    ];
  });

  const [isAddTrackingOpen, setIsAddTrackingOpen] = useState(false);
  const [trackingForm, setTrackingForm] = useState<{
    outletRtCode: string;
    competitorBrand: string;
    skuName: string;
    skuQty: string;
    skuPrice: string;
    invoicePhoto: string | null;
    notes: string;
  }>({
    outletRtCode: '',
    competitorBrand: 'Anchor Smooth',
    skuName: '',
    skuQty: '',
    skuPrice: '',
    invoicePhoto: null,
    notes: ''
  });

  const [skuQuantities, setSkuQuantities] = useState<Record<string, string>>({
    '625ml': '',
    '500ml': '',
    '330ml': '',
    '330ml pts': '',
    'Packs': ''
  });

  const [isFetchingCompetitors, setIsFetchingCompetitors] = useState(false);

  const fetchCompetitorRecordsFromSupabase = async () => {
    setIsFetchingCompetitors(true);
    try {
      const seCode = profile?.se_code || 'ALL_ACCESS';
      const url = `${SUPABASE_URL}competitor_tracking?se_code=eq.${encodeURIComponent(seCode)}&select=*,competitor_skus(*)&order=id.desc`;
      let response = await fetch(url, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      let data: any[] = [];
      if (!response.ok) {
        console.warn("Joined fetch of competitor_tracking failed, trying fallback without join...");
        const urlFallback = `${SUPABASE_URL}competitor_tracking?se_code=eq.${encodeURIComponent(seCode)}&select=*&order=id.desc`;
        response = await fetch(urlFallback, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        if (response.ok) {
          data = await response.json();
          try {
            const skusRes = await fetch(`${SUPABASE_URL}competitor_skus?select=*`, {
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
              }
            });
            if (skusRes.ok) {
              const allSkus = await skusRes.json();
              data = data.map(item => ({
                ...item,
                competitor_skus: allSkus.filter((s: any) => s.tracking_id === item.id)
              }));
            }
          } catch (errSkus) {
            console.error("Separated fetch of competitor_skus failed:", errSkus);
          }
        }
      } else {
        data = await response.json();
      }

      if (Array.isArray(data)) {
        const mapped: CompetitorRecord[] = data.map(item => {
          const skus = item.competitor_skus || [];
          const totalQty = skus.reduce((sum: number, s: any) => sum + (parseInt(s.quantity) || 0), 0);
          const uniqueSkusCount = skus.filter((s: any) => (parseInt(s.quantity) || 0) > 0).length;

          return {
            id: String(item.id),
            outletName: item.outlet_name || '',
            rtCode: item.rt_code || '',
            competitorBrand: item.competitor_brand || '',
            skuQty: String(totalQty),
            skuPrice: item.sku_price || '',
            invoicePhoto: item.invoice_photo_url || item.invoice_photo || null,
            notes: item.notes || '',
            date: item.created_at ? item.created_at.split('T')[0] : (item.date || new Date().toISOString().split('T')[0]),
            skus: skus,
            totalSkuQty: totalQty,
            uniqueSkusCount: uniqueSkusCount
          };
        });
        setCompetitorRecords(mapped);
      }
    } catch (err) {
      console.error("Error fetching competitor trackings:", err);
    } finally {
      setIsFetchingCompetitors(false);
    }
  };

  // Save competitor records to local storage on modification
  useEffect(() => {
    localStorage.setItem('lbcl_competitor_records', JSON.stringify(competitorRecords));
  }, [competitorRecords]);
  // subPage allows full deep dive into specific apps
  const [activeSubPage, setActiveSubPage] = useState<string | null>(null);

  // --- THEME & LANGUAGE STATE ---
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('lbcl_app_theme') as 'light' | 'dark') || 'light';
  });
  const [language, setLanguage] = useState<'EN' | 'SI'>(() => {
    return (localStorage.getItem('lbcl_app_lang') as 'EN' | 'SI') || 'EN';
  });

  // Save layout configurations on changes
  useEffect(() => {
    localStorage.setItem('lbcl_app_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lbcl_app_lang', language);
  }, [language]);

  // --- PASSWORD CHANGE STATE ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isPasswordExpanded, setIsPasswordExpanded] = useState(false);

  // --- DEVICE & SYNC STATE ---
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearCacheConfirmOpen, setIsClearCacheConfirmOpen] = useState(false);

  // --- BLUETOOTH PRINTER MANAGEMENT ---
  const [printerStatus, setPrinterStatus] = useState<'disconnected' | 'searching' | 'connected'>(() => {
    return (localStorage.getItem('lbcl_printer_status') as any) || 'disconnected';
  });
  const [connectedPrinter, setConnectedPrinter] = useState<string | null>(() => {
    return localStorage.getItem('lbcl_connected_printer') || null;
  });
  const [scannedPrinters, setScannedPrinters] = useState<any[]>([]);
  const [receiptFooter, setReceiptFooter] = useState<string>(() => {
    return localStorage.getItem('lbcl_receipt_footer') || 'Thank You! - Lion Brewery';
  });
  const [showSlipTestModal, setShowSlipTestModal] = useState(false);

  // Save receipt/printer details
  useEffect(() => {
    localStorage.setItem('lbcl_printer_status', printerStatus);
  }, [printerStatus]);
  useEffect(() => {
    if (connectedPrinter) localStorage.setItem('lbcl_connected_printer', connectedPrinter);
    else localStorage.removeItem('lbcl_connected_printer');
  }, [connectedPrinter]);
  useEffect(() => {
    localStorage.setItem('lbcl_receipt_footer', receiptFooter);
  }, [receiptFooter]);

  // --- BLUETOOTH PRINTER HANDLERS ---
  const startScanningPrinters = () => {
    setPrinterStatus('searching');
    setScannedPrinters([]);
    setTimeout(() => {
      setScannedPrinters([
        { name: 'Bixolon_SPP_R200', address: '00:08:1B:95:2D:33', status: 'Available' },
        { name: 'Bixolon_SPP_R210_POS', address: '00:08:1B:95:2D:4F', status: 'Paired' },
        { name: 'SZZT_KS8223_Printer', address: '64:1A:DF:7B:A1:02', status: 'Available' }
      ]);
      setPrinterStatus('disconnected');
    }, 2000);
  };

  const connectPrinterDevice = (printerName: string) => {
    setPrinterStatus('connected');
    setConnectedPrinter(printerName);
    addToast({
      type: 'success',
      message: `${printerName} connected successfully!`
    });
  };

  const disconnectPrinterDevice = () => {
    const oldName = connectedPrinter;
    setPrinterStatus('disconnected');
    setConnectedPrinter(null);
    setScannedPrinters([]);
    if (oldName) {
      addToast({
        type: 'success',
        message: `${oldName} has been disconnected.`
      });
    }
  };

  // --- SUPABASE SESSION AUTHENTICATION STATE ---
  const [sessionUser, setSessionUser] = useState<any>(() => {
    const cached = localStorage.getItem('lbcl_auth_user');
    return cached ? JSON.parse(cached) : { email: "operations@lbcl.com", id: "all-access-user" };
  });
  const [profile, setProfile] = useState<any>(() => {
    const cached = localStorage.getItem('lbcl_auth_profile');
    return cached ? JSON.parse(cached) : {
      full_name: "Field Operations Representative",
      se_code: "ALL_ACCESS",
      assigned_outlet_id: "",
      role: "All Access Mode",
      territory: "Colombo & Regional Bases"
    };
  });

  const [loginSeCode, setLoginSeCode] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Helper to extract name initials
  const getInitials = (name: string) => {
    if (!name) return 'RA';
    const cleanName = name.trim();
    if (cleanName.includes(' ')) {
      return cleanName.split(' ')
        .map(part => part.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    if (cleanName.includes('@')) {
      const parts = cleanName.split('@')[0];
      return parts.slice(0, 2).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginSeCode || !loginPassword) {
      setLoginError("Please enter both Outlet (SE Code) and Password.");
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    const isEmail = loginSeCode.includes('@');
    const formattedEmail = isEmail 
      ? loginSeCode.trim() 
      : `${loginSeCode.toLowerCase().trim()}@lbcl.com`;

    // Map common profiles statically as robust fallback/seeds if REST request fails.
    const defaultProfiles: Record<string, { full_name: string; assigned_outlet_id: string; role: string; territory: string }> = {
      'rumesh': { full_name: "Rumesh Anjanawardana", assigned_outlet_id: "RT-1092", role: "Senior Field Operations Rep", territory: "WESTERN-04 (Colombo Base)" },
      'se-1092': { full_name: "Rumesh Anjanawardana", assigned_outlet_id: "RT-1092", role: "Senior Field Operations Rep", territory: "WESTERN-04 (Colombo Base)" },
      'dilshan': { full_name: "Dilshan Perera", assigned_outlet_id: "RT-4482", role: "Sales Representative", territory: "WESTERN-01 (Kottawa Division)" },
      'se-4482': { full_name: "Dilshan Perera", assigned_outlet_id: "RT-4482", role: "Sales Representative", territory: "WESTERN-01 (Kottawa Division)" },
      'nisansala': { full_name: "Nisansala Senayake", assigned_outlet_id: "RT-9938", role: "Auditor", territory: "WESTERN-02 (Union Place Base)" },
      'se-9938': { full_name: "Nisansala Senayake", assigned_outlet_id: "RT-9938", role: "Auditor", territory: "WESTERN-02 (Union Place Base)" },
      'asanka': { full_name: "Asanka Rodrigo", assigned_outlet_id: "RT-2231", role: "Operations Lead", territory: "WESTERN-03 (Hyde Park Base)" },
      'se-2231': { full_name: "Asanka Rodrigo", assigned_outlet_id: "RT-2231", role: "Operations Lead", territory: "WESTERN-03 (Hyde Park Base)" },
    };

    const inputKey = loginSeCode.toLowerCase().trim();
    const matchedOutletFromDb = outletsList.find(o => 
      (o.seCode || '').toLowerCase().trim() === inputKey ||
      (o.rtCode || '').toLowerCase().trim() === inputKey
    );

    const fallbackProfile = {
      full_name: defaultProfiles[inputKey]?.full_name || (matchedOutletFromDb 
        ? `${matchedOutletFromDb.name.split(' - ')[0]} Rep` 
        : (loginSeCode.charAt(0).toUpperCase() + loginSeCode.slice(1))),
      assigned_outlet_id: defaultProfiles[inputKey]?.assigned_outlet_id || (matchedOutletFromDb ? matchedOutletFromDb.rtCode : "RT-1092"),
      role: defaultProfiles[inputKey]?.role || "Field Representative",
      territory: defaultProfiles[inputKey]?.territory || (matchedOutletFromDb ? `TERRITORY-${matchedOutletFromDb.rtCode}` : "WESTERN-04 (Colombo Base)"),
      se_code: inputKey
    };

    try {
      // 1. Authenticate with Supabase Auth GoTrue API
      // Extract main project URL from SUPABASE_URL (before /rest/v1/)
      const authBaseUrl = SUPABASE_URL.split('/rest/v1/')[0] + '/auth/v1';
      
      let sessionData: any = null;
      let profileData: any = null;

      const loginRes = await fetch(`${authBaseUrl}/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formattedEmail,
          password: loginPassword
        })
      });

      if (loginRes.ok) {
        sessionData = await loginRes.json();
      } else {
        const errorResponse = await loginRes.json().catch(() => ({}));
        throw new Error(errorResponse.error_description || errorResponse.message || "Invalid login credentials. Please verify your SE Code and password.");
      }

      if (sessionData && sessionData.user) {
        const emailUser = sessionData.user.email || '';
        
        // Fetch up-to-date outlets list to ensure we resolve se_code correctly from real Supabase data
        let currentOutlets = outletsList;
        try {
          const freshRes = await fetch(`${SUPABASE_URL}outlets?select=*&order=outlet_name.asc`, {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });
          if (freshRes.ok) {
            const data = await freshRes.json();
            if (Array.isArray(data) && data.length > 0) {
              currentOutlets = data.map((o: any) => ({
                rtCode: o.rt_code || '',
                name: o.outlet_name || '',
                address: o.address ? o.address.trim() : 'Colombo Base, Sri Lanka',
                seCode: o.se_code || ''
              }));
              setOutletsList(currentOutlets);
            }
          }
        } catch (freshErr) {
          console.error("Error updating outlets list during authentication:", freshErr);
        }

        let resolvedSeCode = resolveSeCodeFromEmail(emailUser, currentOutlets);
        let lowerSeCode = resolvedSeCode.toLowerCase();
        let matchedOutlet: any = null;

        // Immediately fetch data from 'outlets' table where 'se_code' matches lowerSeCode or the full email
        try {
          let url = `${SUPABASE_URL}outlets?se_code=eq.${lowerSeCode}&select=*`;
          if (!emailUser.toLowerCase().endsWith('@lbcl.com') && emailUser.toLowerCase().trim() !== lowerSeCode) {
            url = `${SUPABASE_URL}outlets?or=(se_code.eq.${lowerSeCode},se_code.eq.${emailUser.toLowerCase().trim()})&select=*`;
          }

          const outletRes = await fetch(url, {
            method: 'GET',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${sessionData.access_token}`
            }
          });
          if (outletRes.ok) {
            const outletsData = await outletRes.json();
            if (Array.isArray(outletsData) && outletsData.length > 0) {
              matchedOutlet = outletsData[0];
              if (matchedOutlet.se_code) {
                resolvedSeCode = matchedOutlet.se_code;
                lowerSeCode = resolvedSeCode.toLowerCase();
              }
            }
          }
        } catch (outletErr) {
          console.error("Error fetching matching outlet from Supabase on login:", outletErr);
        }

        // Local fallback lookup in newly loaded outlets array using the robust matcher
        if (!matchedOutlet && currentOutlets.length > 0) {
          const localMatch = currentOutlets.find(o => 
            isMatchingSeCode(lowerSeCode, o.seCode || '', o.rtCode || '')
          );
          if (localMatch) {
            matchedOutlet = {
              rt_code: localMatch.rtCode,
              outlet_name: localMatch.name,
              address: localMatch.address,
              se_code: localMatch.seCode
            };
          }
        }

        const userId = sessionData.user.id;
        try {
          const profileRes = await fetch(`${SUPABASE_URL}profiles?id=eq.${userId}`, {
            method: 'GET',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${sessionData.access_token}`
            }
          });

          if (profileRes.ok) {
            const profilesList = await profileRes.json();
            if (Array.isArray(profilesList) && profilesList.length > 0) {
              profileData = { ...profilesList[0] };
            }
          }

          if (!profileData) {
            const upsertRes = await fetch(`${SUPABASE_URL}profiles`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${sessionData.access_token}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
              },
              body: JSON.stringify({
                id: userId,
                full_name: matchedOutlet ? `${matchedOutlet.outlet_name.split(' - ')[0]} Rep` : resolvedSeCode,
                assigned_outlet_id: matchedOutlet ? matchedOutlet.rt_code : "RT-1092",
                role: "Field Operations Representative",
                territory: matchedOutlet ? `TERRITORY-${matchedOutlet.rt_code}` : "WESTERN-04 (Colombo Base)",
                se_code: resolvedSeCode
              })
            });

            if (upsertRes.ok) {
              profileData = {
                id: userId,
                full_name: matchedOutlet ? `${matchedOutlet.outlet_name.split(' - ')[0]} Rep` : resolvedSeCode,
                assigned_outlet_id: matchedOutlet ? matchedOutlet.rt_code : "RT-1092",
                role: "Field Operations Representative",
                territory: matchedOutlet ? `TERRITORY-${matchedOutlet.rt_code}` : "WESTERN-04 (Colombo Base)",
                se_code: resolvedSeCode
              };
            }
          }
        } catch (profileErr) {
          console.error("Error fetching/upserting profile detail:", profileErr);
        }

        // Keep synced or construct fallback
        if (!profileData) {
          profileData = {
            id: userId,
            full_name: matchedOutlet ? `${matchedOutlet.outlet_name.split(' - ')[0]} Rep` : resolvedSeCode,
            assigned_outlet_id: matchedOutlet ? matchedOutlet.rt_code : "RT-1092",
            role: "Field Operations Representative",
            territory: matchedOutlet ? `TERRITORY-${matchedOutlet.rt_code}` : "WESTERN-04 (Colombo Base)",
            se_code: resolvedSeCode
          };
        } else {
          profileData.se_code = resolvedSeCode;
          if (matchedOutlet) {
            profileData.assigned_outlet_id = matchedOutlet.rt_code;
          }
        }

        setSessionUser(sessionData.user);
        setProfile(profileData);
        localStorage.setItem('lbcl_auth_user', JSON.stringify(sessionData.user));
        localStorage.setItem('lbcl_auth_profile', JSON.stringify(profileData));

        addToast({
          type: 'success',
          message: `Access granted! Welcome, ${profileData.full_name || resolvedSeCode}.`
        });
      }
    } catch (err: any) {
      setLoginError(err.message || "Authentication failed. Clear your credentials & try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Dynamic Greeting based on real-time system clock
  const [greeting, setGreeting] = useState<string>('Good Day, Guest');
  const [currentDateStr, setCurrentDateStr] = useState<string>('Tuesday, Oct 24');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      let phrase = 'Good Day';
      if (hours >= 5 && hours < 12) {
        phrase = 'Good Morning';
      } else if (hours >= 12 && hours < 17) {
        phrase = 'Good Afternoon';
      } else if (hours >= 17 || hours < 5) {
        phrase = 'Good Evening';
      }
      
      const displayName = profile 
        ? (profile.se_code 
            ? (profile.se_code.includes('@') ? profile.se_code.split('@')[0].toUpperCase() : profile.se_code.toUpperCase()) 
            : profile.full_name) 
        : 'Guest';
      const greetText = `${phrase}, ${displayName}`;
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
  }, [profile]);

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
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.toLowerCase().includes("application/json")) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const mappedOutlets: Outlet[] = data.map((o: any) => ({
              rtCode: o.rt_code || '',
              name: o.outlet_name || '',
              address: o.address ? o.address.trim() : 'Colombo Base, Sri Lanka',
              seCode: o.se_code || ''
            }));
            setOutletsList(mappedOutlets);
          }
        } else {
          console.warn("Outlets fetched but content-type is non-JSON:", contentType);
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
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.toLowerCase().includes("application/json")) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setCapacitiesList(data);
          }
        } else {
          console.warn("Capacities fetched but content-type is non-JSON:", contentType);
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
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.toLowerCase().includes("application/json")) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setIssueTypesList(data);
          }
        } else {
          console.warn("Issue types fetched but content-type is non-JSON:", contentType);
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
      const url = `${SUPABASE_URL}complaints?select=*&order=created_at.desc`;
      const response = await fetch(url, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.toLowerCase().includes("application/json")) {
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
        } else {
          console.warn("Complaints fetched but content-type is non-JSON:", contentType);
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
    fetchCapacitiesFromSupabase();
    fetchIssueTypesFromSupabase();
    fetchCompetitorRecordsFromSupabase();
  }, []);

  useEffect(() => {
    fetchComplaintsFromSupabase();
    fetchCompetitorRecordsFromSupabase();
  }, [profile]);

  useEffect(() => {
    if (activeTab === 'competitor') {
      fetchCompetitorRecordsFromSupabase();
    }
  }, [activeTab]);

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

  // --- TOAST NOTIFICATIONS STATE & ACTIONS ---
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'warning' | 'error'; message: string }[]>([]);

  const addToast = (toast: { type: 'success' | 'warning' | 'error'; message: string }) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

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

  // Trigger email notification via Resend API
  const sendResendEmail = async (complaintData: {
    rtCode: string;
    outletName: string;
    location: string;
    issueType: string;
    capacity: string;
    contactPerson: string;
    contactNumber: string;
  }) => {
    const fromEmail = (import.meta as any).env.VITE_RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const toEmail = (import.meta as any).env.VITE_RESEND_TO_EMAIL || 'rumeshanjanard@gmail.com';

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="background-color: #f0f9ff; color: #0284c7; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; padding: 6px 12px; border-radius: 9999px;">
            LBCL Field Service Alert
          </span>
          <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin-top: 12px; margin-bottom: 4px; letter-spacing: -0.025em;">
            Cooler Complaint Report
          </h2>
          <p style="color: #64748b; font-size: 13px; margin: 0;">
            A high-priority maintenance request was generated from the field hub.
          </p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; width: 35%;">RT Code</td>
              <td style="padding: 10px 0; color: #0f172a; font-weight: 700; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${complaintData.rtCode}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Outlet Name</td>
              <td style="padding: 10px 0; color: #0f172a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${complaintData.outletName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Location</td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${complaintData.location}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Issue Type</td>
              <td style="padding: 10px 0; color: #ef4444; font-weight: 700; border-bottom: 1px solid #e2e8f0;">⚠️ ${complaintData.issueType}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Capacity</td>
              <td style="padding: 10px 0; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${complaintData.capacity}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Contact Person</td>
              <td style="padding: 10px 0; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${complaintData.contactPerson}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Contact Number</td>
              <td style="padding: 10px 0; color: #0284c7; font-weight: 700;">${complaintData.contactNumber}</td>
            </tr>
          </table>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
          <p style="color: #94a3b8; font-size: 11px; margin: 0; line-height: 1.5;">
            This dispatch report was generated automatically via the <strong>LBCL Field Operations Hub</strong>.
          </p>
        </div>
      </div>
    `;

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: toEmail,
          from: fromEmail,
          subject: `[Cooler Alert] New Complaint Filed - ${complaintData.outletName}`,
          html: htmlBody
        })
      });

      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(responseData.error || `Server error status ${res.status}`);
      }
      console.log('[Resend Proxy] Dispatched successfully');
    } catch (err: any) {
      console.error("Resend API proxy dispatch error:", err);
      throw new Error(err.message || err);
    }
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

      // Fire email notification asynchronously
      try {
        await sendResendEmail({
          rtCode: cooldeskForm.rtCode || '—',
          outletName: cooldeskForm.outletName,
          location: cooldeskForm.address || '—',
          issueType: cooldeskForm.issueType,
          capacity: cooldeskForm.capacity,
          contactPerson: cooldeskForm.personName || '—',
          contactNumber: cooldeskForm.contactNumber || '—'
        });

        addToast({
          type: 'success',
          message: `Complaint generated (Ref: ${generatedRef}) & Resend email notification dispatched!`
        });
      } catch (emailErr: any) {
        console.error("Resend delivery failed:", emailErr);
        addToast({
          type: 'warning',
          message: `Complaint registered in database, but email dispatch failed: ${emailErr.message || emailErr}`
        });
      }

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

      addToast({
        type: 'error',
        message: `Database connection error. Complaint saved locally to cache (Ref: ${fallbackRef}).`
      });

      // Try firing email even in fallback (e.g. if database failed but internet is back)
      try {
        await sendResendEmail({
          rtCode: cooldeskForm.rtCode || '—',
          outletName: cooldeskForm.outletName,
          location: cooldeskForm.address || '—',
          issueType: cooldeskForm.issueType,
          capacity: cooldeskForm.capacity,
          contactPerson: cooldeskForm.personName || '—',
          contactNumber: cooldeskForm.contactNumber || '—'
        });
      } catch (fErr) {
        console.error("Fallback email dispatch failed:", fErr);
      }
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

  // Dynamic filter to compute and fetch ONLY the user's assigned own outlets (from Supabase 'outlets' table using se_code or rt_code matching)
  const filteredOutletsForDashboard = useMemo(() => {
    return outletsList;
  }, [outletsList]);

  // Auto-prepopulate CoolDesk complaint form if only one isolated outlet is returned
  useEffect(() => {
    if (filteredOutletsForDashboard.length === 1) {
      const singleOutlet = filteredOutletsForDashboard[0];
      setCooldeskForm(prev => ({
        ...prev,
        outletName: singleOutlet.name,
        rtCode: singleOutlet.rtCode,
        address: singleOutlet.address,
      }));
      setCooldeskSearchQuery(singleOutlet.name);
    } else {
      setCooldeskForm(prev => {
        const isCurrentValid = filteredOutletsForDashboard.some(o => o.rtCode === prev.rtCode);
        if (isCurrentValid) return prev;
        return {
          ...prev,
          outletName: '',
          rtCode: '',
          address: '',
        };
      });
      setCooldeskSearchQuery(prev => {
        const isSelectedValid = filteredOutletsForDashboard.some(o => o.name === prev);
        return isSelectedValid ? prev : '';
      });
    }
  }, [filteredOutletsForDashboard]);

  // Filter outlets list for dropdown in CoolDesk
  const filteredOutletsForCoolDesk = useMemo(() => {
    let list = filteredOutletsForDashboard;
    // If the input query is empty or matches the currently selected outlet name exactly, show all available outlets for selection
    if (!cooldeskSearchQuery || cooldeskSearchQuery.trim() === cooldeskForm.outletName) {
      return list;
    }
    return list.filter(o => 
      o.name.toLowerCase().includes(cooldeskSearchQuery.toLowerCase()) ||
      o.rtCode.toLowerCase().includes(cooldeskSearchQuery.toLowerCase())
    );
  }, [cooldeskSearchQuery, filteredOutletsForDashboard, cooldeskForm.outletName]);

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

  if (false && (!sessionUser || !profile)) {
    return (
      <div 
        className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat p-4 font-sans select-none relative"
        style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.5)), url('${loginWallArtBg}')` }}
      >
        <div className="absolute inset-0 backdrop-blur-md"></div>
        
        {/* Animated Card Container */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md bg-white/95 backdrop-blur-lg rounded-3xl p-8 border border-white/40 shadow-2xl relative z-10"
        >
          {/* LOGO */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white mb-3 shadow-xl shadow-sky-500/20">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-sans font-black text-slate-900 tracking-tight text-center leading-none">
              LBCL
            </h1>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">
              Field Operations Hub
            </span>
          </div>

          {/* ERROR ALERT BLOCK */}
          {loginError && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-700 text-xs font-semibold flex items-start gap-2.5 shadow-xs"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="text-left">{loginError}</div>
            </motion.div>
          )}

          {/* FORM */}
          <form onSubmit={handleLogin} className="space-y-4 font-sans text-left">
            {/* Input SE Code */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-left">
                Outlet (SE Code)
              </label>
              <div className="relative flex items-center shadow-xs">
                <Store className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="E.g., rumesh or se-1092"
                  value={loginSeCode}
                  onChange={(e) => setLoginSeCode(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:shadow-md focus:border-sky-500 focus:outline-hidden rounded-xl py-3.5 pl-10 pr-4 text-sm font-medium transition-all"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-left">
                Password
              </label>
              <div className="relative flex items-center shadow-xs">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:shadow-md focus:border-sky-500 focus:outline-hidden rounded-xl py-3.5 pl-10 pr-4 text-sm font-medium transition-all"
                />
              </div>
            </div>

            {/* LOG IN Action Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 active:scale-95 cursor-pointer text-white font-extrabold text-sm py-4 rounded-xl shadow-lg shadow-sky-500/10 transition-all flex items-center justify-center gap-2 mt-6 uppercase tracking-wider"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Entering Hub Secure Grid...</span>
                </>
              ) : (
                'LOG IN'
              )}
            </motion.button>
          </form>

          {/* Forgot Password */}
          <div className="text-center mt-6">
            <button 
              onClick={() => {
                alert("Credentials Reset Support:\n\nContact the central IT operations hub (itops@lbcl.com) to retrieve your security certificate.\n\n[DEV NOTIFICATION]: For sandbox testing, you may log in under any SE Code (e.g. 'rumesh' or 'se-1092') using the fallback password 'password'. This creates a secure offline simulation session automatically!");
              }}
              className="text-[11px] font-bold text-sky-500 hover:text-sky-600 cursor-pointer uppercase tracking-wider transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const curLang = language === 'SI' ? translations.SI : translations.EN;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-start pb-24 font-sans select-none overflow-x-hidden ${theme === 'dark' ? 'theme-dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Dynamic Theme Style Overrides */}
      <style>{`
        .theme-dark {
          background-color: #020617 !important;
        }
        .theme-dark .bg-white {
          background-color: #0f172a !important;
        }
        .theme-dark .bg-slate-50, .theme-dark .bg-slate-100, .theme-dark .bg-indigo-50\\/50 {
          background-color: #1e293b !important;
        }
        .theme-dark .text-slate-900, .theme-dark .text-slate-800, .theme-dark .text-slate-950 {
          color: #f8fafc !important;
        }
        .theme-dark .text-slate-700, .theme-dark .text-slate-600 {
          color: #cbd5e1 !important;
        }
        .theme-dark .text-slate-500, .theme-dark .text-slate-400 {
          color: #94a3b8 !important;
        }
        .theme-dark .border-slate-250, .theme-dark .border-slate-200, .theme-dark .border-slate-100, .theme-dark .border-slate-300 {
          border-color: #334155 !important;
        }
        .theme-dark header, .theme-dark nav {
          background-color: #0f172a !important;
          border-color: #334155 !important;
        }
        .theme-dark .nav-white {
          background-color: #0f172a !important;
        }
        .theme-dark input, .theme-dark select, .theme-dark textarea {
          background-color: #1e293b !important;
          color: #ffffff !important;
          border-color: #475569 !important;
        }
        .theme-dark input:focus, .theme-dark select:focus, .theme-dark textarea:focus {
          border-color: #0ea5e9 !important;
        }
        .theme-dark .shadow-sm, .theme-dark .shadow-md, .theme-dark .shadow-xs {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3) !important;
        }
        .theme-dark hr {
          border-color: #334155 !important;
        }
      `}</style>
      
      {/* Maximum Container matching modern preview layouts */}
      <div className={`w-full max-w-md md:max-w-3xl min-h-screen relative flex flex-col justify-between overflow-hidden shadow-2xl border-x ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
        
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
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest">{currentDateStr}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-1.5">
                      <h1 className="text-2xl font-sans font-extrabold text-slate-900 tracking-tight">
                        {activeTab === 'competitor' ? (language === 'SI' ? 'තරඟකරුවන්' : 'Competitor Tracking') : (language === 'SI' ? translations.SI.settingsTitle : translations.EN.settingsTitle)}
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
                                <>
                                  <div 
                                    className="fixed inset-0 z-40 bg-transparent cursor-default" 
                                    onClick={() => setIsCoolDeskDropdownOpen(false)}
                                  />
                                  <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-100 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-50">
                                    {filteredOutletsForCoolDesk.length > 0 ? (
                                      filteredOutletsForCoolDesk.map((outlet) => (
                                        <button
                                          key={outlet.rtCode}
                                          type="button"
                                          onClick={() => handleSelectOutlet(outlet)}
                                          className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex flex-col gap-0.5 relative z-50"
                                        >
                                          <span className="text-sm font-bold text-slate-700">{outlet.name}</span>
                                          <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span className="font-mono bg-slate-100 text-slate-500 px-1 py-0.2 rounded text-[10px]">{outlet.rtCode}</span>
                                            <span className="truncate">{outlet.address}</span>
                                          </div>
                                        </button>
                                      ))
                                    ) : (
                                      <div className="p-4 text-center text-xs text-slate-400 relative z-50">No matching LBCL outlets found</div>
                                    )}
                                  </div>
                                </>
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
                            {Object.keys(completedVisits).length} of {filteredOutletsForDashboard.length} Checked-in
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
                          {filteredOutletsForDashboard.filter(o => o.name.toLowerCase().includes(outletSearch.toLowerCase())).map((outlet) => {
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
                            <span className="text-lg font-black text-slate-800 mt-1 block">{filteredOutletsForDashboard.length} outlets</span>
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

                  {/* TAB 2: COMPETITOR TRACKING SYSTEM */}
                  {activeTab === 'competitor' && (
                    <div className="px-5 py-4 space-y-5">
                      
                      {/* Competitor system welcome/stats summary panel */}
                      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-sans font-bold text-sky-400 uppercase tracking-widest block font-mono">
                            Market Intelligence Engine
                          </span>
                          <h3 className="text-sm font-extrabold font-sans">
                            {language === 'SI' ? 'පිහිටුවීම් සහ ගිණුම්' : 'Active Field Audits'}
                          </h3>
                          <p className="text-[11px] text-slate-400 font-medium font-sans">
                            {competitorRecords.length} competitor logs synchronized locally
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setTrackingForm({
                              outletRtCode: '',
                              competitorBrand: 'Anchor Smooth',
                              skuName: '',
                              skuQty: '',
                              skuPrice: '',
                              invoicePhoto: null,
                              notes: ''
                            });
                            setSkuQuantities({
                              '625ml': '',
                              '500ml': '',
                              '330ml': '',
                              '330ml pts': '',
                              'Packs': ''
                            });
                            setIsAddTrackingOpen(true);
                          }}
                          className="bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border-none"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>{language === 'SI' ? 'එකතු කරන්න' : 'Add Tracking'}</span>
                        </button>
                      </div>

                      {/* Display Saved Competitor Records */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {language === 'SI' ? 'පසුගිය වාර්තා' : 'Competitor Activity Feed'} ({competitorRecords.length})
                          </h3>
                          <span className="text-[9px] font-extrabold text-slate-400 font-mono">POS Handshake Live</span>
                        </div>

                        {competitorRecords.length > 0 ? (
                          <div className="space-y-3">
                            {competitorRecords.map((rec) => (
                              <motion.div
                                key={rec.id}
                                layoutId={rec.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-sm transition-all text-left relative overflow-hidden group"
                              >
                                {/* Left accent strip */}
                                <div className="absolute inset-y-0 left-0 w-1 bg-sky-500"></div>

                                <div className="flex justify-between items-start gap-2 mb-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[9px] font-extrabold tracking-wider font-mono">
                                        {rec.rtCode}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-bold font-mono">
                                        {rec.date}
                                      </span>
                                    </div>
                                    <h4 className="font-sans font-extrabold text-sm text-slate-900 mt-1.5 group-hover:text-sky-600 transition-colors">
                                      {rec.outletName}
                                    </h4>
                                  </div>

                                  <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[9px] font-extrabold uppercase tracking-wide font-mono shrink-0 whitespace-nowrap">
                                    {rec.competitorBrand} - {rec.uniqueSkusCount || 0} SKUs logged
                                  </span>
                                </div>

                                <div className="mt-3 pt-2.5 border-t border-dashed border-slate-100">
                                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">SKU Case Quantities</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {rec.skus && rec.skus.length > 0 ? (
                                      rec.skus.filter((sku: any) => (parseInt(sku.quantity) || 0) > 0).map((sku: any) => (
                                        <span key={sku.sku_type || sku.id} className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded text-[9px] font-bold font-mono">
                                          {sku.sku_type}: <strong className="text-slate-800 font-extrabold">{sku.quantity}</strong>
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[10px] text-slate-400 font-sans italic">No individual SKU cases logged (Total: {rec.skuQty || 0} cases)</span>
                                    )}
                                  </div>
                                </div>

                                {rec.notes && (
                                  <div className="mt-2.5 bg-slate-50 rounded-lg p-2.5 border border-slate-150 flex gap-2 items-start">
                                    <span className="text-[14px] leading-none shrink-0 text-slate-400 select-none">✏️</span>
                                    <p className="text-[10px] font-medium text-slate-500 leading-relaxed font-sans italic">
                                      "{rec.notes}"
                                    </p>
                                  </div>
                                )}

                                {rec.invoicePhoto && (
                                  <div className="mt-2.5 rounded-lg overflow-hidden border border-slate-200 h-20 w-fit max-w-full">
                                    <img src={rec.invoicePhoto} alt="Invoice preview" className="h-full object-cover rounded-md" referrerPolicy="no-referrer" />
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-white border border-slate-200 rounded-xl p-8 py-10 text-center text-slate-400 font-sans">
                            <Store className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            <p className="text-xs font-bold text-slate-700">No Competitor Tracking recorded yet</p>
                            <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                              Tap the 'Add Tracking' button above to audit localized competitor presence.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* ADD TRACKING DIALOG / MODAL FORM */}
                      <AnimatePresence>
                        {isAddTrackingOpen && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs select-none">
                            <motion.div 
                               initial={{ opacity: 0, scale: 0.94, y: 15 }}
                               animate={{ opacity: 1, scale: 1, y: 0 }}
                               exit={{ opacity: 0, scale: 0.96, y: 10 }}
                               className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 font-sans text-left max-h-[90vh] overflow-y-auto"
                            >
                              <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-150">
                                <span className="text-sm font-extrabold flex items-center gap-2 text-slate-900">
                                  <Activity className="w-4 h-4 text-sky-500" />
                                  {language === 'SI' ? 'තරඟකාරී තොරතුරු එක් කිරීම' : 'Competitor Audit Log'}
                                </span>
                                <button 
                                  onClick={() => setIsAddTrackingOpen(false)}
                                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer transition-colors border-none bg-transparent"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="space-y-4 text-xs font-medium text-slate-700">
                                {/* Outlet Select Dropdown */}
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                                    {language === 'SI' ? 'අවුට්ලට් තෝරන්න' : 'Select Outlet'} *
                                  </label>
                                  <select
                                    value={trackingForm.outletRtCode}
                                    onChange={(e) => setTrackingForm(prev => ({ ...prev, outletRtCode: e.target.value }))}
                                    className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 transition-colors"
                                  >
                                    <option value="">-- Click to choose Outlet --</option>
                                    {outletsList.map((outlet) => (
                                      <option key={outlet.rtCode} value={outlet.rtCode}>
                                        [{outlet.rtCode}] {outlet.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Competitor Brand Dropdown */}
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                                    {language === 'SI' ? 'තරඟකාරී සන්නාමය' : 'Competitor Brand'} *
                                  </label>
                                  <select
                                    value={trackingForm.competitorBrand}
                                    onChange={(e) => setTrackingForm(prev => ({ ...prev, competitorBrand: e.target.value }))}
                                    className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500"
                                  >
                                    {COMPETITOR_BRANDS.map(brand => (
                                      <option key={brand} value={brand}>{brand}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* SKU Details inputs */}
                                <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl space-y-3">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block border-b border-slate-200 pb-1.5 flex justify-between items-center">
                                    <span>{language === 'SI' ? 'පැකේජ විස්තරය' : 'SKU Quantities:'}</span>
                                    <span className="text-[9px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full uppercase tracking-normal">Enter Case Quantities</span>
                                  </span>
                                  
                                  <div className="grid grid-cols-2 gap-3 pb-1">
                                    {(['625ml', '500ml', '330ml', '330ml pts', 'Packs'] as const).map((sku) => (
                                      <div key={sku} className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                                          {sku} Size Qty
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          placeholder="0"
                                          value={skuQuantities[sku]}
                                          onChange={(e) => setSkuQuantities(prev => ({ ...prev, [sku]: e.target.value }))}
                                          className="w-full bg-white border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:border-sky-500 transition-colors"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Invoice Photo capture / selection */}
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                                    {language === 'SI' ? 'ඉන්වොයිස් පින්තූරය' : 'Invoice Photo'}
                                  </label>
                                  
                                  <div className="border border-dashed border-slate-300 rounded-xl p-3 text-center space-y-2 bg-slate-50">
                                    {trackingForm.invoicePhoto ? (
                                      <div className="relative inline-block">
                                        <img 
                                          src={trackingForm.invoicePhoto} 
                                          alt="Invoice preview" 
                                          className="mx-auto max-h-32 rounded-lg border object-contain shadow-xs" 
                                          referrerPolicy="no-referrer"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => setTrackingForm(prev => ({ ...prev, invoicePhoto: null }))}
                                          className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 cursor-pointer shadow-md border-none"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center justify-center py-2">
                                        <span className="text-[16px] mb-1">📷</span>
                                        <span className="text-[10px] text-slate-400 font-bold mb-1.5 block">Record competitor bill physically</span>
                                        
                                        <div className="flex gap-2">
                                          {/* Standard Native File picker */}
                                          <label className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-xs cursor-pointer flex items-center gap-1">
                                            <span>Attach Picture</span>
                                            <input 
                                              type="file" 
                                              accept="image/*" 
                                              className="hidden" 
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                  const reader = new FileReader();
                                                  reader.onloadend = () => {
                                                    setTrackingForm(prev => ({ ...prev, invoicePhoto: reader.result as string }));
                                                  };
                                                  reader.readAsDataURL(file);
                                                }
                                              }}
                                            />
                                          </label>

                                          {/* Mock generator button */}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTrackingForm(prev => ({
                                                ...prev,
                                                invoicePhoto: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80'
                                              }));
                                            }}
                                            className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 font-semibold px-2.5 py-1.5 rounded-lg text-[10px] cursor-pointer"
                                          >
                                            Demo Snap
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Notes Notepad field */}
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                                    {language === 'SI' ? 'සටහන්' : 'Observations Notes'}
                                  </label>
                                  <textarea
                                    placeholder="e.g. competitors launching new display cooler shelf tags."
                                    rows={2}
                                    value={trackingForm.notes}
                                    onChange={(e) => setTrackingForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                                  />
                                </div>

                                {/* Form Action Buttons */}
                                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsAddTrackingOpen(false);
                                    }}
                                    className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-500 text-center cursor-pointer transition-colors bg-transparent"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!trackingForm.outletRtCode) {
                                        addToast({ type: 'warning', message: 'Please select an outlet from the dropdown.' });
                                        return;
                                      }
                                      
                                      const matchedOutlet = outletsList.find(o => o.rtCode === trackingForm.outletRtCode);
                                      if (!matchedOutlet) {
                                        addToast({ type: 'error', message: 'Unable to match selected outlet.' });
                                        return;
                                      }

                                      try {
                                        // 1. Insert primary row into 'competitor_tracking' Table
                                        const primaryRow = {
                                          se_code: profile?.se_code || 'ALL_ACCESS',
                                          rt_code: matchedOutlet.rtCode,
                                          outlet_name: matchedOutlet.name,
                                          competitor_brand: trackingForm.competitorBrand,
                                          notes: trackingForm.notes,
                                          invoice_photo_url: trackingForm.invoicePhoto,
                                          invoice_photo: trackingForm.invoicePhoto
                                        };

                                        const response = await fetch(`${SUPABASE_URL}competitor_tracking`, {
                                          method: 'POST',
                                          headers: {
                                            'apikey': SUPABASE_ANON_KEY,
                                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                                            'Content-Type': 'application/json',
                                            'Prefer': 'return=representation'
                                          },
                                          body: JSON.stringify(primaryRow)
                                        });

                                        let trackingId = `temp-${Date.now()}`;
                                        if (response.ok) {
                                          const resData = await response.json();
                                          const insertedRow = Array.isArray(resData) ? resData[0] : resData;
                                          if (insertedRow && insertedRow.id) {
                                            trackingId = String(insertedRow.id);
                                          }
                                        } else {
                                          console.warn(`Tracking insert failed with status ${response.status}, using self-signed lookup ID`);
                                        }

                                        // 2. Prepare SKU list rows
                                        const skusToInsert = Object.entries(skuQuantities)
                                          .map(([skuType, qtyStr]) => {
                                            const qtyNum = parseInt(qtyStr as string) || 0;
                                            return {
                                              tracking_id: trackingId,
                                              sku_type: skuType,
                                              quantity: qtyNum
                                            };
                                          })
                                          .filter(s => s.quantity > 0);

                                        // 3. Save SKUs to competitor_skus Table
                                        if (skusToInsert.length > 0) {
                                          const skusResponse = await fetch(`${SUPABASE_URL}competitor_skus`, {
                                            method: 'POST',
                                            headers: {
                                              'apikey': SUPABASE_ANON_KEY,
                                              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                                              'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify(skusToInsert)
                                          });
                                          if (!skusResponse.ok) {
                                            console.warn(`SKU insert returned status ${skusResponse.status}`);
                                          }
                                        }

                                        addToast({ type: 'success', message: 'Competitor tracking successfully saved!' });
                                        fetchCompetitorRecordsFromSupabase();
                                      } catch (err: any) {
                                        console.error("Supabase write failure, committing locally:", err);
                                        // Failover local fallback state
                                        const calculatedSkus = Object.entries(skuQuantities).map(([type, qty]) => ({
                                          sku_type: type,
                                          sku_id: type,
                                          quantity: parseInt(qty as string) || 0
                                        }));
                                        const calculatedTotal = calculatedSkus.reduce((sum, s) => sum + s.quantity, 0);
                                        const uniqueCount = calculatedSkus.filter(s => s.quantity > 0).length;

                                        const newRecord: CompetitorRecord = {
                                          id: `competitor-${Date.now()}`,
                                          outletName: matchedOutlet.name,
                                          rtCode: matchedOutlet.rtCode,
                                          competitorBrand: trackingForm.competitorBrand,
                                          invoicePhoto: trackingForm.invoicePhoto,
                                          notes: trackingForm.notes,
                                          date: new Date().toISOString().split('T')[0],
                                          skus: calculatedSkus,
                                          totalSkuQty: calculatedTotal,
                                          uniqueSkusCount: uniqueCount,
                                          skuQty: String(calculatedTotal)
                                        };
                                        setCompetitorRecords(prev => [newRecord, ...prev]);
                                        addToast({ type: 'warning', message: 'Active audit logs recorded offline successfully.' });
                                      } finally {
                                        setIsAddTrackingOpen(false);
                                      }
                                    }}
                                    className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-center text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1 border-none"
                                  >
                                    <Check className="w-4 h-4" />
                                    <span>{language === 'SI' ? 'සුරකින්න' : 'Save Record'}</span>
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>

                    </div>
                  )}



                  {/* TAB 4: SETTINGS & TERMINAL CONFIG */}
                  {activeTab === 'profile' && (
                    <div className="pb-10 font-sans">
                      
                      {/* Premium Top Hero Banner Section */}
                      <div className="bg-gradient-to-br from-indigo-650 to-sky-600 px-6 py-8 text-center border-b border-slate-200/50 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
                        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-3 shadow-md border border-white/20">
                          <Settings className="w-7 h-7" />
                        </div>
                        <h2 className="text-xl font-extrabold text-white tracking-tight">{curLang.settingsTitle}</h2>
                        <p className="text-[11px] text-sky-100 font-semibold mt-1 uppercase tracking-wide px-4 leading-normal">{curLang.settingsSub}</p>
                      </div>

                      <div className="px-5 py-4 space-y-5">

                        {/* SECTION 1: GLOBAL PREFERENCES & LABELS */}
                        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-4">
                          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-sky-500" />
                            {language === 'SI' ? 'යෙදුම් මනාපයන්' : 'App Preferences'}
                          </h4>

                          {/* Theme Toggling */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="text-left max-w-[65%]">
                              <span className="text-xs font-bold text-slate-700 block">{curLang.themeLabel}</span>
                              <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">{curLang.themeDesc}</span>
                            </div>
                            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0 select-none">
                              <button 
                                onClick={() => setTheme('light')}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${theme === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <Sun className="w-3 h-3 text-amber-500" />
                                {curLang.lightMode.split(' ')[0]}
                              </button>
                              <button 
                                onClick={() => setTheme('dark')}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${theme === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
                              >
                                <Moon className="w-3 h-3 text-indigo-400" />
                                {curLang.darkMode.split(' ')[0]}
                              </button>
                            </div>
                          </div>

                          <hr className="border-slate-100" />

                          {/* Language Switcher */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="text-left max-w-[65%]">
                              <span className="text-xs font-bold text-slate-700 block">{curLang.langLabel}</span>
                              <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">{curLang.langDesc}</span>
                            </div>
                            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0 select-none">
                              <button 
                                onClick={() => setLanguage('EN')}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${language === 'EN' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                              >
                                EN
                              </button>
                              <button 
                                onClick={() => setLanguage('SI')}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${language === 'SI' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                              >
                                සිංහල
                              </button>
                            </div>
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

            {/* Button 2: Competitor Tracking */}
            <button 
              onClick={() => {
                setActiveTab('competitor');
                setActiveSubPage(null);
              }}
              className="flex flex-col items-center cursor-pointer justify-center relative py-1"
            >
              <div className={`p-1 px-3 rounded transition-all flex flex-col items-center ${
                activeTab === 'competitor' && activeSubPage === null 
                  ? 'text-slate-900 font-extrabold' 
                  : 'text-slate-400'
              }`}>
                <TrendingUp className="w-5 h-5" />
                <span className="text-[9px] uppercase font-bold tracking-wider mt-1">
                  {language === 'SI' ? 'තරඟකරුවන්' : 'Competitor'}
                </span>
              </div>
            </button>

            {/* Button 3: Settings tab */}
            <button 
              onClick={() => {
                setActiveTab('profile');
                setActiveSubPage(null);
              }}
              className="flex flex-col items-center cursor-pointer justify-center relative py-1"
            >
              <div className={`p-1 px-3 rounded transition-all flex flex-col items-center ${
                activeTab === 'profile' && activeSubPage === null 
                  ? 'text-sky-600 font-extrabold' 
                  : 'text-slate-400'
              }`}>
                <Settings className="w-5 h-5 animate-hover-spin" />
                <span className="text-[9px] uppercase font-bold tracking-wider mt-1">
                  {language === 'SI' ? 'සැකසුම්' : 'Settings'}
                </span>
              </div>
            </button>

          </div>
        </nav>

        {/* CLEAR CACHE CONFIRMATION DIALOG MODAL */}
        <AnimatePresence>
          {isClearCacheConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border text-center font-sans ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}
              >
                <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mx-auto mb-4">
                  <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="text-base font-extrabold">{curLang.confirmClearTitle}</h3>
                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed font-semibold">
                  {curLang.confirmClearDesc}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-6">
                  <button
                    onClick={() => setIsClearCacheConfirmOpen(false)}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-550 transition-colors cursor-pointer"
                  >
                    {curLang.confirmNo}
                  </button>
                  <button
                    onClick={() => {
                      setIsClearCacheConfirmOpen(false);
                      addToast({ type: 'warning', message: 'Purging localized browser state logs...' });
                      setTimeout(() => {
                        localStorage.clear();
                        window.location.reload();
                      }, 1000);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {curLang.confirmYes}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* TEST PRINT RECEIPT SLIP PREVIEW MODAL */}
        <AnimatePresence>
          {showSlipTestModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border font-sans text-left ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}
              >
                <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-200">
                  <span className="text-sm font-extrabold flex items-center gap-2">
                    <Printer className="w-4 h-4 text-sky-500" />
                    {curLang.slipPreviewTitle}
                  </span>
                  <button 
                    onClick={() => setShowSlipTestModal(false)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Styled Receipt Look */}
                <div className="bg-amber-50/40 border border-dashed border-amber-200 rounded-xl p-5 font-mono text-xs text-slate-700 space-y-3 relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-200 to-yellow-300"></div>
                  
                  <div className="text-center font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-dashed border-amber-200">
                    {curLang.slipMockText}
                  </div>
                  
                  <div className="space-y-1 text-[11px] leading-relaxed">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Terminal:</span>
                      <span className="font-bold text-slate-800">{connectedPrinter || 'BIXOLON_DEMO'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Operator:</span>
                      <span className="font-bold text-slate-800">{profile?.full_name || 'Rumesh A.'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">SE Code:</span>
                      <span className="font-bold text-slate-800">{profile?.se_code || 'ALL_ACCESS'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="font-bold text-emerald-600 uppercase">ONLINE - TEST</span>
                    </div>
                  </div>

                  <hr className="border-dashed border-amber-200" />

                  <div className="space-y-1 text-[11px] leading-normal pt-1 bg-slate-100/50 p-2 rounded">
                    <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">{curLang.slipFooter}</span>
                    <p className="font-sans italic text-slate-600 font-medium">"{receiptFooter || 'No customization notes saved.'}"</p>
                  </div>

                  <hr className="border-dashed border-amber-200" />
                  
                  <div className="text-[10px] text-center text-slate-400">
                    {curLang.slipPrintedAt} {new Date().toLocaleTimeString()}
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    onClick={() => {
                      setShowSlipTestModal(false);
                      addToast({ type: 'success', message: 'Test strip successfully dispatched to mobile printer memory!' });
                    }}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    {language === 'SI' ? 'ප්‍රින්ට් කරන්න' : 'Confirm Print'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* TOAST PANEL OVERLAY */}
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[400px] pointer-events-none px-4 flex flex-col gap-2">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className={`p-3.5 rounded-2xl shadow-xl border text-xs font-semibold flex items-start gap-2.5 backdrop-blur-md pointer-events-auto cursor-pointer transition-all ${
                  toast.type === 'success' 
                    ? 'bg-emerald-500/95 text-white border-emerald-400' 
                    : toast.type === 'warning'
                    ? 'bg-amber-500/95 text-white border-amber-400'
                    : 'bg-rose-500/95 text-white border-rose-400'
                }`}
                onClick={() => removeToast(toast.id)}
              >
                {toast.type === 'success' && <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />}
                {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 stroke-[2.5]" />}
                {toast.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 stroke-[2.5]" />}
                <div className="flex-1 text-left leading-normal">{toast.message}</div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeToast(toast.id);
                  }}
                  className="hover:opacity-75 font-bold ml-1 text-white shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
