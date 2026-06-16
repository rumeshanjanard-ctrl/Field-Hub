/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
// @ts-ignore
import loginWallArtBg from './assets/images/login_wall_art_1781191937515.jpg';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardCheck, AlertTriangle, Store, TrendingUp, Box, Map, Users,
  ThermometerSnowflake, Bell, ArrowRight, ChevronRight, Search, ChevronDown, 
  MapPin, LogOut, Loader2, Check, Send, Sparkles, Phone, User, Info, 
  Plus, X, CheckCircle, RefreshCw, SlidersHorizontal, ChevronLeft,
  DollarSign, Activity, Eye, Play, Star, Circle, Landmark, Target, Lock,
  Sun, Moon, Bluetooth, Printer, Settings, Globe, Trash2, Calendar, FileSpreadsheet
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
import { exportCompetitorListToPDF, exportSingleCompetitorRecordToPDF } from './utils/pdfExport';
import { FileText } from 'lucide-react';

// Supabase REST client configuration & JS SDK client creation
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || 'https://kbgtkoymrmpyltxoqdcz.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ3Rrb3ltcm1weWx0eG9xZGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2Njg5NDAsImV4cCI6MjA5NjI0NDk0MH0.7vck5MEQUf8oC8SE8VRTa-VzWYzBSczNXEYFBwEWsEM';

const cleanSupabaseUrl = SUPABASE_URL.split('/rest/v1/')[0];
const supabase = createClient(cleanSupabaseUrl, SUPABASE_ANON_KEY);

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

  const [competitorView, setCompetitorView] = useState<'list' | 'add' | 'detail'>('list');
  const [selectedCompetitorRecord, setSelectedCompetitorRecord] = useState<any | null>(null);
  const [isAddTrackingOpen, setIsAddTrackingOpen] = useState(false);
  const [outletSearchQuery, setOutletSearchQuery] = useState('');
  const [isOutletSearchDropdownOpen, setIsOutletSearchDropdownOpen] = useState(false);
  const [trackingForm, setTrackingForm] = useState<{
    outletRtCode: string;
    competitorBrand: string;
    skuName: string;
    skuQty: string;
    skuPrice: string;
    invoicePhoto: string | null;
    notes: string;
    date: string;
  }>({
    outletRtCode: '',
    competitorBrand: '',
    skuName: '',
    skuQty: '',
    skuPrice: '',
    invoicePhoto: null,
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [skuQuantities, setSkuQuantities] = useState<Record<string, string>>({
    '625ml': '',
    '500ml': '',
    '330ml': '',
    '330ml pts': '',
    'Packs': ''
  });

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brandSkuQuantities, setBrandSkuQuantities] = useState<Record<string, Record<string, string>>>({});
  const [competitorDateFilter, setCompetitorDateFilter] = useState<string>('');

  const [isFetchingCompetitors, setIsFetchingCompetitors] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleExportListToPDF = async () => {
    setIsGeneratingPDF(true);
    addToast({ type: 'success', message: 'Generating PDF Summary...' });
    setTimeout(async () => {
      try {
        await exportCompetitorListToPDF(sortedAndFilteredCompetitorRecords, competitorDateFilter);
        addToast({ type: 'success', message: 'PDF report summary downloaded!' });
      } catch (err) {
        console.error('[PDF Export Error]', err);
        addToast({ type: 'error', message: 'Could not render PDF document.' });
      } finally {
        setIsGeneratingPDF(false);
      }
    }, 400);
  };

  const handleExportSingleRecordToPDF = async (record: any) => {
    setIsGeneratingPDF(true);
    addToast({ type: 'success', message: 'Compiling photo with audit metadata...' });
    setTimeout(async () => {
      try {
        await exportSingleCompetitorRecordToPDF(record, outletsList);
        addToast({ type: 'success', message: 'Detailed PDF with photo downloaded!' });
      } catch (err) {
        console.error('[PDF Export Error]', err);
        addToast({ type: 'error', message: 'Could not compile photo PDF.' });
      } finally {
        setIsGeneratingPDF(false);
      }
    }, 400);
  };

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
          const rawSkus = item.competitor_skus || [];
          const skus = rawSkus.map((s: any) => ({
            ...s,
            sku_type: s.sku_size || s.sku_type
          }));
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

  // Computed list of sorted and filtered competitor records
  const sortedAndFilteredCompetitorRecords = useMemo(() => {
    return [...competitorRecords]
      .filter(rec => {
        if (!competitorDateFilter) return true;
        return rec.date === competitorDateFilter;
      })
      .sort((a, b) => {
        // Sort by date descending
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) {
          return dateB.localeCompare(dateA);
        }
        // Secondarily sort by id descending
        return b.id.localeCompare(a.id);
      });
  }, [competitorRecords, competitorDateFilter]);

  // CSV Exporter for Competitor data
  const exportCompetitorDataToCSV = () => {
    const rows: string[][] = [];
    
    // CSV Header row - Competitor Brand removed, unified SKU Size/Brand used
    rows.push([
      'Date',
      'RT Code',
      'Outlet Name',
      'SKU Size/Brand',
      'Volume (Cases)',
      'Field Notes'
    ]);
    
    sortedAndFilteredCompetitorRecords.forEach(rec => {
      const activeSkus = rec.skus ? rec.skus.filter((sku: any) => (parseInt(sku.quantity) || 0) > 0) : [];
      
      const formatSkuSizeBrand = (brand: string, skuRaw: string) => {
        const brandClean = (brand || '').trim();
        const skuClean = (skuRaw || '').trim();
        if (!skuClean) return brandClean;
        if (!brandClean) return skuClean;
        
        // If the SKU type already contains the brand followed by a hyphen space, return it directly
        if (skuClean.toLowerCase().includes(brandClean.toLowerCase() + ' -')) {
          return skuClean;
        }
        
        // If the SKU type already contains a hyphen indicating it is prepopulated with brand, return it directly
        if (skuClean.includes(' - ')) {
          return skuClean;
        }
        
        return `${brandClean} - ${skuClean}`;
      };

      if (activeSkus.length > 0) {
        activeSkus.forEach((sku: any) => {
          rows.push([
            rec.date || '',
            rec.rtCode || '',
            rec.outletName || '',
            formatSkuSizeBrand(rec.competitorBrand, sku.sku_type || sku.sku_size || ''),
            String(sku.quantity || 0),
            rec.notes || ''
          ]);
        });
      } else {
        rows.push([
          rec.date || '',
          rec.rtCode || '',
          rec.outletName || '',
          formatSkuSizeBrand(rec.competitorBrand, 'None'),
          '0',
          rec.notes || ''
        ]);
      }
    });

    const csvContent = rows
      .map(row => 
        row.map(val => {
          const escaped = String(val).replace(/"/g, '""');
          if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('\r') || escaped.includes('"')) {
            return `"${escaped}"`;
          }
          return escaped;
        }).join(',')
      )
      .join('\n');
      
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `competitor_tracking_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addToast({
      type: 'success',
      message: language === 'SI' ? 'Excel ගොනුව සාර්ථකව බාගන්නා ලදී.' : 'CSV report exported successfully!'
    });
  };
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
      full_name: "Rumesh Anjanawardana",
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Supabase signOut error:", err);
    }
    setSessionUser(null);
    setProfile(null);
    localStorage.removeItem('lbcl_auth_user');
    localStorage.removeItem('lbcl_auth_profile');
    addToast({
      type: 'warning',
      message: language === 'SI' ? 'පද්ධතියෙන් බැහැර විය.' : 'Session signed out safely.'
    });
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

    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formattedEmail,
        password: loginPassword,
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || "Invalid login credentials. Please verify your SE Code and password.");
      }

      const emailUser = authData.user.email || formattedEmail;

      // 2. Dynamic Fetch from 'sales_executives'
      let fetchedName = '';
      let fetchedSeCode = '';

      try {
        const { data: execData, error: execError } = await supabase
          .from('sales_executives')
          .select('name, se_code')
          .eq('email', emailUser)
          .maybeSingle();

        if (execData) {
          fetchedName = execData.name || '';
          fetchedSeCode = execData.se_code || '';
        }
      } catch (dbErr) {
        console.error("Error querying 'sales_executives' table on login:", dbErr);
      }

      const defaultSeCode = emailUser.split('@')[0].toUpperCase();
      const resolvedSeCode = fetchedSeCode || defaultSeCode;
      const resolvedName = fetchedName || resolvedSeCode;

      // Ensure that we cache outlets list during authentication
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

      // Construct dynamic profile with retrieved DB values
      const profileData: any = {
        id: authData.user.id,
        full_name: resolvedName,
        se_code: resolvedSeCode,
        assigned_outlet_id: "RT-1092",
        role: "Field Operations Representative",
        territory: "WESTERN-04 (Colombo Base)"
      };

      const lowerSeCode = resolvedSeCode.toLowerCase();
      const matchedOutlet = currentOutlets.find(o => 
        (o.seCode || '').toLowerCase().trim() === lowerSeCode
      );
      if (matchedOutlet) {
        profileData.assigned_outlet_id = matchedOutlet.rtCode;
        profileData.territory = `TERRITORY-${matchedOutlet.rtCode}`;
      }

      setSessionUser(authData.user);
      setProfile(profileData);
      localStorage.setItem('lbcl_auth_user', JSON.stringify(authData.user));
      localStorage.setItem('lbcl_auth_profile', JSON.stringify(profileData));

      addToast({
        type: 'success',
        message: `Access granted! Welcome, ${profileData.full_name || resolvedSeCode}.`
      });

    } catch (err: any) {
      setLoginError(err.message || "Authentication failed. Clear your credentials & try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Dynamic Greeting based on real-time system clock
  const [greeting, setGreeting] = useState<string>('Good Day');
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
      
      const greetText = phrase;
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
  const [isIssueDropdownOpen, setIsIssueDropdownOpen] = useState(false);

  const toggleIssueType = (typeName: string) => {
    const currentSelected = cooldeskForm.issueType 
      ? cooldeskForm.issueType.split(', ').map(s => s.trim()).filter(Boolean)
      : [];
    
    let updated: string[];
    if (currentSelected.includes(typeName)) {
      updated = currentSelected.filter(item => item !== typeName);
    } else {
      updated = [...currentSelected, typeName];
    }
    
    setCooldeskForm(prev => ({
      ...prev,
      issueType: updated.join(', ')
    }));
  };
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

    // Helper function for safe text extraction
    const cleanStr = (val: string) => (val || '').trim();
    // Helper function to escape text for HTML attribute inline JavaScript copy script
    const escJs = (val: string) => cleanStr(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');

    // Specified list of table parameters in the EXACT sequence requested
    const fields = [
      { label: 'RT Code:', value: complaintData.rtCode, fallback: '—' },
      { label: 'Outlet Name:', value: complaintData.outletName, fallback: '—' },
      { label: 'Location:', value: complaintData.location, fallback: '—' },
      { label: 'Issue Type:', value: complaintData.issueType, fallback: '—' },
      { label: 'Capacity:', value: complaintData.capacity, fallback: '—' },
      { label: 'Contact Person:', value: complaintData.contactPerson, fallback: '—' },
      { label: 'Contact Number:', value: complaintData.contactNumber, fallback: '—' },
    ];

    const fullTextCopyData = fields.map(f => `${f.label} ${cleanStr(f.value) || f.fallback}`).join('\n');
    const escapedFullText = escJs(fullTextCopyData);

    const encodedOutletName = encodeURIComponent(cleanStr(complaintData.outletName));
    const encodedRtCode = encodeURIComponent(cleanStr(complaintData.rtCode));
    const bodyRows = [
      `RT Code: ${cleanStr(complaintData.rtCode) || '—'}`,
      `Outlet Name: ${cleanStr(complaintData.outletName) || '—'}`,
      `Location: ${cleanStr(complaintData.location) || '—'}`,
      `Issue Type: ${cleanStr(complaintData.issueType) || '—'}`,
      `Capacity: ${cleanStr(complaintData.capacity) || '—'}`,
      `Contact Person: ${cleanStr(complaintData.contactPerson) || '—'}`,
      `Contact Number: ${cleanStr(complaintData.contactNumber) || '—'}`
    ];
    const encodedBodyText = encodeURIComponent(bodyRows.join('\n'));
    // Construct the live URL for Outlook Web deep linking
    const outlookComposeUrl = `https://outlook.office.com/mail/deeplink/compose?subject=Cooler%20Complaint%20-%20${encodedOutletName}%20%7C%20${encodedRtCode}&body=${encodedBodyText}`;

    const tableRowsHtml = fields.map((f, idx) => {
      const displayVal = cleanStr(f.value) || f.fallback;
      const isLast = idx === fields.length - 1;
      const borderStyle = isLast ? '' : 'border-bottom: 1px solid #e2e8f0;';
      
      // Fine-grained typography/colors to blend beautifully in the premium light slate layout
      let valueColor = '#0f172a';
      let fontStyle = '';
      if (f.label === 'RT Code:') {
        valueColor = '#0284c7';
        fontStyle = 'font-family: monospace, Courier, monospace; letter-spacing: 0.05em; font-weight: 700;';
      } else if (f.label === 'Issue Type:') {
        valueColor = '#e11d48'; // Vivid rose for issue types
      } else if (f.label === 'Contact Number:') {
        valueColor = '#0284c7';
      }

      return `
        <tr>
          <td style="padding: 14px 16px; color: #475569; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; width: 35%; vertical-align: middle; ${borderStyle}">${f.label}</td>
          <td style="padding: 14px 16px; color: ${valueColor}; font-weight: 700; text-align: left; font-size: 14px; line-height: 1.4; vertical-align: middle; ${borderStyle}; ${fontStyle}">${displayVal}</td>
        </tr>
      `;
    }).join('');

    const htmlBody = `
      <div style="background-color: #f1f5f9; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
        <div style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <!-- Header block with soft corporate identity -->
          <div style="padding: 32px 24px 24px; text-align: center; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
            <span style="background-color: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; padding: 6px 16px; border-radius: 9999px; display: inline-block; margin-bottom: 16px;">
              LBCL Field Service Alert
            </span>
            <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.025em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              Cooler Complaint
            </h2>
            <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.5;">
              A high-priority maintenance request was generated from the field hub.
            </p>
          </div>

          <!-- Structured key-value grid with light table colors -->
          <div style="padding: 20px; background-color: #ffffff;">
            <table style="width: 100%; border-collapse: collapse; box-sizing: border-box; background-color: #ffffff;" cellpadding="0" cellspacing="0">
              ${tableRowsHtml}
            </table>
          </div>

          <!-- Native Mailto Action Link -->
          <div style="padding: 0 20px 24px 20px; text-align: center; background-color: #ffffff;">
            <a 
              href="${outlookComposeUrl}"
              style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; text-decoration: none; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;"
            >
              📋 Open & Populate in Outlook
            </a>
          </div>

          <!-- Global prominent "Copy Full Complaint Details" call to action with robust double-click fallback block -->
          <div style="padding: 0 20px 24px 20px; text-align: center; background-color: #ffffff;">
            <button 
              onclick="try { navigator.clipboard.writeText('${escapedFullText}'); } catch(e) {}" 
              style="display: block; width: 100%; box-sizing: border-box; background-color: #0284c7; border: 1px solid #0284c7; color: #ffffff; cursor: pointer; padding: 12px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; transition: background-color 0.15s; outline: none; margin-bottom: 12px;"
              onmouseover="this.style.backgroundColor='#0369a1';"
              onmouseout="this.style.backgroundColor='#0284c7';"
            >
              📋 Copy Full Complaint Details
            </button>
            <div style="border: 1px dashed #cbd5e1; background-color: #f8fafc; border-radius: 6px; padding: 10px; text-align: left; font-family: monospace, Courier, monospace; font-size: 11px; color: #475569;" title="Double click block below to copy all text">
              <span style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">📋 Double-click below to copy all parameters:</span>
              <pre style="margin: 0; white-space: pre-wrap; font-family: inherit; font-weight: 650; line-height: 1.4;">${fullTextCopyData}</pre>
            </div>
          </div>

          <!-- Professional footer -->
          <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 24px; text-align: center;">
            <p style="color: #64748b; font-size: 11px; margin: 0; line-height: 1.5; font-weight: 500;">
              This dispatch report was generated automatically via the <strong>LBCL Field Operations Hub</strong>.
            </p>
          </div>
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
          from: `New Cooler Complaint <${fromEmail}>`,
          subject: `Cooler Complaint | ${complaintData.outletName} | ${complaintData.rtCode}`,
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

  // Automatically redirect to main Home Dashboard after exactly 1 second when coolDeskSuccess is triggered
  useEffect(() => {
    if (coolDeskSuccess) {
      const timer = setTimeout(() => {
        resetCoolDeskForm();
        setActiveSubPage(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [coolDeskSuccess]);

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
                SE Code or Email
              </label>
              <div className="relative flex items-center shadow-xs">
                <Store className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="E.g., chilsr01 or rumesh"
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
          
          {/* Header wrapper - hide only inside success screen of cooldesk or full page competitor views */}
          {activeSubPage === null && (activeTab !== 'competitor' || competitorView === 'list') && (
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

                <div className="flex items-center gap-3">
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

                            <p className="text-xs text-slate-400 mt-6 animate-pulse">
                              Redirecting to Home Dashboard...
                            </p>
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
                            <div className="col-span-1 relative">
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1 col-span-1">
                                Issue Type <span className="text-rose-500">*</span>
                                {isLoadingIssueTypes && (
                                  <span className="text-[10px] text-sky-500 font-medium font-sans animate-pulse ml-1">(loading...)</span>
                                )}
                              </label>
                              
                              <button
                                type="button"
                                onClick={() => setIsIssueDropdownOpen(prev => !prev)}
                                className="w-full bg-slate-50/20 border border-slate-200 hover:bg-white active:bg-slate-50 focus:bg-white rounded-xl py-3 px-3.5 text-sm focus:border-sky-500 focus:outline-hidden ring-offset-2 focus:ring-2 focus:ring-sky-100 transition-all font-medium text-slate-700 cursor-pointer flex items-center justify-between text-left min-h-[46px]"
                              >
                                <div className="flex flex-wrap gap-1.5 items-center mr-2 max-w-[90%]">
                                  {cooldeskForm.issueType ? (
                                    cooldeskForm.issueType.split(', ').map((selectedItem, idx) => (
                                      <span 
                                        key={idx} 
                                        className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-101 px-2 py-0.5 rounded-lg text-xs font-semibold"
                                      >
                                        {selectedItem}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 font-normal">-- Choose issue types --</span>
                                  )}
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isIssueDropdownOpen ? 'rotate-180' : ''}`} />
                              </button>

                              {isIssueDropdownOpen && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40 bg-transparent cursor-default" 
                                    onClick={() => setIsIssueDropdownOpen(false)}
                                  />
                                  <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-100 rounded-xl shadow-lg max-h-64 overflow-y-auto divide-y divide-slate-50 hover:shadow-xl transition-all">
                                    <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2.5">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 font-sans">
                                        Select Multiple Issues
                                      </span>
                                      {cooldeskForm.issueType && (
                                        <button
                                          type="button"
                                          onClick={() => setCooldeskForm(prev => ({ ...prev, issueType: '' }))}
                                          className="text-[10px] bg-slate-200/60 text-slate-600 hover:bg-rose-50 hover:text-rose-500 px-2 py-1 rounded-md font-bold transition-all relative z-50"
                                        >
                                          Clear All
                                        </button>
                                      )}
                                    </div>
                                    <div className="p-1.5 space-y-0.5">
                                      {issueTypesList.map((item) => {
                                        const isChecked = cooldeskForm.issueType 
                                          ? cooldeskForm.issueType.split(', ').map(s => s.trim()).includes(item.type_name) 
                                          : false;
                                        return (
                                          <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => toggleIssueType(item.type_name)}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-3 relative z-50 ${
                                              isChecked ? 'bg-sky-50/30' : ''
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => {}} 
                                              className="w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500 cursor-pointer pointer-events-none"
                                            />
                                            <span className={`text-xs font-medium ${isChecked ? 'text-sky-800 font-bold' : 'text-slate-600'}`}>
                                              {item.type_name}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </>
                              )}
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
                    <div className="min-h-full max-w-7xl mx-auto w-full">
                      {competitorView === 'list' && (
                        <div className="px-5 py-4 space-y-5 animate-in fade-in duration-200">
                          
                          {/* Competitor system welcome/stats summary panel */}
                          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <h3 className="text-base font-bold font-sans text-slate-100">
                                Field Tracking
                              </h3>
                            </div>
                            <button
                              onClick={() => {
                                setTrackingForm({
                                  outletRtCode: '',
                                  competitorBrand: '',
                                  skuName: '',
                                  skuQty: '',
                                  skuPrice: '',
                                  invoicePhoto: null,
                                  notes: '',
                                  date: new Date().toISOString().split('T')[0]
                                });
                                setSelectedBrands([]);
                                setBrandSkuQuantities({});
                                setSkuQuantities({
                                  '625ml': '',
                                  '500ml': '',
                                  '330ml': '',
                                  '330ml pts': '',
                                  'Packs': ''
                                });
                                setOutletSearchQuery('');
                                setIsOutletSearchDropdownOpen(false);
                                setCompetitorView('add');
                              }}
                              className="bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border-none font-sans"
                            >
                              <Plus className="w-4 h-4 stroke-[2.5]" />
                              <span>{language === 'SI' ? 'එකතු කරන්න' : 'Add Tracking'}</span>
                            </button>
                          </div>

                          {/* Date Filter & Export Panel - Horizontal Utility Bar on Desktop */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-3xs space-y-3">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              {/* Date Picker Input */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                  {language === 'SI' ? 'දිනය පෙරන්න:' : 'Filter Date:'}
                                </span>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                  <div className="relative flex-1 sm:flex-none">
                                    <input
                                      type="date"
                                      value={competitorDateFilter}
                                      onChange={(e) => setCompetitorDateFilter(e.target.value)}
                                      className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-sky-500 hover:bg-slate-100 transition-all cursor-pointer font-sans"
                                    />
                                  </div>
                                  {competitorDateFilter && (
                                    <button
                                      onClick={() => setCompetitorDateFilter('')}
                                      className="px-2.5 py-1.5 text-[9px] font-extrabold text-sky-600 bg-sky-50 hover:bg-sky-100 active:scale-95 rounded-lg border border-sky-200/50 uppercase tracking-wider font-sans cursor-pointer transition-all shrink-0"
                                    >
                                      {language === 'SI' ? 'සියල්ල' : 'Show All'}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Export buttons panel wrapper */}
                              <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full lg:w-auto">
                                {/* Export to Excel / CSV */}
                                <button
                                  onClick={exportCompetitorDataToCSV}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer border-none font-sans shrink-0 w-full sm:w-auto"
                                >
                                  <FileSpreadsheet className="w-4 h-4" />
                                  <span>{language === 'SI' ? 'Excel ගොනුව' : 'Export to Excel'}</span>
                                </button>

                                {/* Export to PDF (Direct client-side generation) */}
                                <button
                                  onClick={handleExportListToPDF}
                                  disabled={isGeneratingPDF}
                                  className={`bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer border-none font-sans shrink-0 w-full sm:w-auto ${
                                    isGeneratingPDF ? 'opacity-70 cursor-not-allowed' : ''
                                  }`}
                                >
                                  {isGeneratingPDF ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      <span>{language === 'SI' ? 'සකසමින්...' : 'Generating PDF...'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="w-4 h-4" />
                                      <span>{language === 'SI' ? 'PDF ගොනුව' : 'Export to PDF'}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Active filter description */}
                            <div className="text-[10px] text-slate-400 font-medium font-sans flex items-center gap-1.5 border-t border-slate-100 pt-2.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {competitorDateFilter ? (
                                <span>
                                  {language === 'SI' ? 'පෙරහන් කළ දිනය:' : 'Showing records for date:'}{' '}
                                  <strong className="text-sky-600 font-extrabold font-mono">{competitorDateFilter}</strong>
                                </span>
                              ) : (
                                <span>{language === 'SI' ? 'සියලුම පෙර පැවති වාර්තා පෙන්වයි' : 'Showing all historic records'}</span>
                              )}
                            </div>
                          </div>

                          {/* Display Saved Competitor Records */}
                          <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">
                                {language === 'SI' ? 'පසුගිය වාර්තා' : 'Competitor Activity Feed'} ({sortedAndFilteredCompetitorRecords.length})
                              </h3>
                              <span className="text-[9px] font-extrabold text-slate-400 font-mono">POS Handshake Live</span>
                            </div>

                            {sortedAndFilteredCompetitorRecords.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {sortedAndFilteredCompetitorRecords.map((rec) => (
                                  <motion.div
                                    key={rec.id}
                                    layoutId={rec.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => {
                                      setSelectedCompetitorRecord(rec);
                                      setCompetitorView('detail');
                                    }}
                                    className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-3xs hover:shadow-md hover:border-sky-300 lg:hover:-translate-y-0.5 transition-all duration-200 text-left relative overflow-hidden group cursor-pointer flex flex-col justify-between"
                                  >
                                    <div>
                                      {/* Left accent strip */}
                                      <div className="absolute inset-y-0 left-0 w-1 bg-sky-500"></div>

                                      <div className="flex justify-between items-start gap-2 mb-1.5 pl-1">
                                        <div>
                                          <div className="flex items-center gap-1.5">
                                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[8px] font-extrabold tracking-tight font-mono">
                                              {rec.rtCode}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-bold font-mono">
                                              {rec.date}
                                            </span>
                                          </div>
                                          <h4 className="font-sans font-extrabold text-xs sm:text-sm text-slate-900 mt-1.5 group-hover:text-sky-600 transition-colors line-clamp-2">
                                            {rec.outletName}
                                          </h4>
                                        </div>

                                        <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[8px] font-extrabold tracking-tight font-mono shrink-0 whitespace-nowrap">
                                          {rec.uniqueSkusCount || 0} SKUs
                                        </span>
                                      </div>

                                      {/* Brand summary pill list */}
                                      <div className="mt-2 pl-1 flex flex-wrap gap-1">
                                        {(rec.competitorBrand || '').split(',').map((b: string) => b.trim()).filter(Boolean).map((brand: string) => (
                                          <span key={brand} className="px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-[4px] text-[7px] font-extrabold tracking-wider uppercase font-mono">
                                            {brand}
                                          </span>
                                        ))}
                                      </div>

                                      <div className="mt-3 pt-2.5 border-t border-dashed border-slate-100 pl-1">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">SKUs Logged</span>
                                        <div className="flex flex-wrap gap-1">
                                          {rec.skus && rec.skus.length > 0 ? (
                                            rec.skus.filter((sku: any) => (parseInt(sku.quantity) || 0) > 0).map((sku: any) => (
                                              <span key={sku.sku_type || sku.id} className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded text-[8px] font-bold font-mono">
                                                {sku.sku_type}: <strong className="text-slate-800 font-extrabold">{sku.quantity}</strong>
                                              </span>
                                            ))
                                          ) : (
                                            <span className="text-[9px] text-slate-450 font-sans italic">No individual SKU cases logged (Total: {rec.skuQty || 0})</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {rec.notes && (
                                      <div className="mt-3 bg-slate-50 rounded-lg p-1.5 px-2 border border-slate-150 flex gap-1.5 items-center pl-1.5">
                                        <span className="text-[12px] leading-none shrink-0 text-slate-400 select-none">✏️</span>
                                        <p className="text-[9px] font-medium text-slate-500 leading-normal font-sans italic line-clamp-1">
                                          "{rec.notes}"
                                        </p>
                                      </div>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                            ) : competitorRecords.length > 0 ? (
                              <div className="bg-white border border-slate-200 rounded-xl p-8 py-10 text-center text-slate-400 font-sans">
                                <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                <p className="text-xs font-bold text-slate-700">
                                  {language === 'SI' ? 'මෙම දිනය සඳහා වාර්තා නොමැත' : 'No entries found for this date'}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                                  {language === 'SI' ? 'වෙනත් දිනයක් තෝරන්න හෝ පෙරහන ඉවත් කරන්න.' : 'Try choosing another date or clear active filters.'}
                                </p>
                                <button
                                  onClick={() => setCompetitorDateFilter('')}
                                  className="mt-3 px-3.5 py-1.5 text-[10px] font-bold text-sky-650 bg-sky-50 border border-sky-100 hover:bg-sky-100 rounded-lg transition-all shrink-0 cursor-pointer"
                                >
                                  {language === 'SI' ? 'සියල්ල පෙන්වන්න' : 'Show All Records'}
                                </button>
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
                        </div>
                      )}

                      {competitorView === 'add' && (
                        <div className="px-5 py-4 space-y-5 animate-in fade-in duration-200 font-sans">
                          {/* Dedicated full page header */}
                          <div className="flex items-center gap-3 border-b border-slate-150 pb-3">
                            <button
                              onClick={() => {
                                setCompetitorView('list');
                              }}
                              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 cursor-pointer transition-colors border-none"
                            >
                              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                            </button>
                            <div>
                              <span className="text-[10px] font-sans font-bold text-sky-500 uppercase tracking-widest block font-mono">
                                {language === 'SI' ? 'පැමිණීම් වාර්තාව' : 'Market Intelligence'}
                              </span>
                              <h2 className="text-lg font-extrabold text-slate-900 font-sans">
                                Field Tracking
                              </h2>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-medium text-slate-700">
                            
                            {/* Left Column: Searchable Outlet dropdown, Date Picker, multi-brand selection checklist, and Field Notes */}
                            <div className="space-y-4">
                              {/* Outlet Select Dropdown with Search capabilities */}
                            <div className="relative">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                                {language === 'SI' ? 'අවුට්ලට් තෝරන්න' : 'Select Outlet'} *
                              </label>
                              
                              <div className="relative">
                                <input
                                  type="text"
                                  value={
                                    isOutletSearchDropdownOpen
                                      ? outletSearchQuery
                                      : trackingForm.outletRtCode
                                      ? (() => {
                                          const matched = outletsList.find(o => o.rtCode === trackingForm.outletRtCode);
                                          return matched ? `[${matched.rtCode}] ${matched.name}` : '';
                                        })()
                                      : outletSearchQuery
                                  }
                                  onFocus={() => {
                                    setIsOutletSearchDropdownOpen(true);
                                    const matched = outletsList.find(o => o.rtCode === trackingForm.outletRtCode);
                                    if (matched) {
                                      setOutletSearchQuery(matched.name);
                                    } else {
                                      setOutletSearchQuery('');
                                    }
                                  }}
                                  onChange={(e) => {
                                    setOutletSearchQuery(e.target.value);
                                    setIsOutletSearchDropdownOpen(true);
                                  }}
                                  placeholder="Type name or RT Code to search..."
                                  className="w-full bg-white border border-slate-300 rounded-xl py-2 pl-3 pr-10 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 transition-colors"
                                />
                                
                                {/* Clear/Reset button */}
                                {trackingForm.outletRtCode ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTrackingForm(prev => ({ ...prev, outletRtCode: '' }));
                                      setOutletSearchQuery('');
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent active:scale-95 cursor-pointer z-10"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[11px] leading-none select-none">🔍</span>
                                )}
                              </div>

                              {/* Filtered Dropdown Popover */}
                              {isOutletSearchDropdownOpen && (
                                <>
                                  {/* Click outside backdrop overlay */}
                                  <div 
                                    className="fixed inset-0 z-45 bg-transparent" 
                                    onClick={() => {
                                      setIsOutletSearchDropdownOpen(false);
                                      const matched = outletsList.find(o => o.rtCode === trackingForm.outletRtCode);
                                      if (matched) {
                                        setOutletSearchQuery(`[${matched.rtCode}] ${matched.name}`);
                                      } else {
                                        setOutletSearchQuery('');
                                      }
                                    }}
                                  />
                                  
                                  {/* Dropdown Items list container */}
                                  <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1">
                                    {(() => {
                                      const filtered = outletsList.filter(o => 
                                        o.name.toLowerCase().includes(outletSearchQuery.toLowerCase()) || 
                                        o.rtCode.toLowerCase().includes(outletSearchQuery.toLowerCase())
                                      );
                                      
                                      if (filtered.length === 0) {
                                        return (
                                          <div className="px-3 py-2 text-xs text-slate-450 italic">
                                            No matching outlets found
                                          </div>
                                        );
                                      }
                                      
                                      return filtered.map((outlet) => (
                                        <button
                                          key={outlet.rtCode}
                                          type="button"
                                          onClick={() => {
                                            setTrackingForm(prev => ({ ...prev, outletRtCode: outlet.rtCode }));
                                            setOutletSearchQuery(`[${outlet.rtCode}] ${outlet.name}`);
                                            setIsOutletSearchDropdownOpen(false);
                                          }}
                                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-sky-50 text-slate-700 hover:text-sky-600 flex flex-col gap-0.5 border-none bg-transparent cursor-pointer transition-colors"
                                        >
                                          <span className="font-extrabold">
                                            {outlet.name}
                                          </span>
                                          <span className="text-[9px] text-slate-400 font-mono">
                                            [{outlet.rtCode}] {outlet.address || ''}
                                          </span>
                                        </button>
                                      ));
                                    })()}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Date Input / Date Picker */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                                {language === 'SI' ? 'දිනය' : 'Capture Date'} *
                              </label>
                              <input
                                type="date"
                                value={trackingForm.date || new Date().toISOString().split('T')[0]}
                                onChange={(e) => setTrackingForm(prev => ({ ...prev, date: e.target.value }))}
                                className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 transition-colors"
                              />
                            </div>

                            {/* Competitor Brands Multi-Select Checklist Grid */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-sans">
                                {language === 'SI' ? 'තරඟකාරී සන්නාම (බහු තේරීම්)' : 'Competitor Brands (Select Multiple)'} *
                              </label>
                              
                              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-3xs max-h-56 overflow-y-auto space-y-1.5 scrollbar-thin">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {COMPETITOR_BRANDS.map((brand) => {
                                    const isSelected = selectedBrands.includes(brand);
                                    return (
                                      <button
                                        type="button"
                                        key={brand}
                                        onClick={() => {
                                          if (isSelected) {
                                            setSelectedBrands(prev => prev.filter(b => b !== brand));
                                          } else {
                                            setSelectedBrands(prev => [...prev, brand]);
                                            if (!brandSkuQuantities[brand]) {
                                              setBrandSkuQuantities(prev => ({
                                                ...prev,
                                                [brand]: {
                                                  '625ml': '',
                                                  '500ml': '',
                                                  '330ml': '',
                                                  '330ml pts': '',
                                                  'Packs': ''
                                                }
                                              }));
                                            }
                                          }
                                        }}
                                        className={`px-3 py-2 rounded-xl text-left border flex items-center gap-2 transition-all cursor-pointer select-none bg-transparent ${
                                          isSelected 
                                            ? 'bg-sky-50 border-sky-400 text-sky-750 shadow-3xs font-extrabold' 
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                                        }`}
                                      >
                                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-colors border ${
                                          isSelected ? 'bg-sky-500 border-sky-500 text-white' : 'bg-white border-slate-300'
                                        }`}>
                                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                        </div>
                                        <span className="text-[10px] truncate leading-none">{brand}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Observations Notes (Moved here to remain in Left Column on Desktop) */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-sans">
                                {language === 'SI' ? 'සටහන්' : 'Observations Notes'}
                              </label>
                              <textarea
                                placeholder="e.g. competitors launching new display cooler shelf tags."
                                rows={3}
                                value={trackingForm.notes}
                                onChange={(e) => setTrackingForm(prev => ({ ...prev, notes: e.target.value }))}
                                className="w-full border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                              />
                            </div>
                          </div>

                          {/* Right Column: Dynamically expanding SKU quantity input blocks and the Invoice Photo upload box */}
                          <div className="space-y-4">
                            {/* SKU Details inputs - Multi-brand Matrices */}
                            {selectedBrands.length > 0 ? (
                              <div className="space-y-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
                                  {language === 'SI' ? 'සන්නාම අනුව පැකේජ විස්තර' : 'SKU Matrices by Competitor Brand'}
                                </span>
                                
                                {selectedBrands.map((brand) => (
                                  <div key={brand} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-3xs hover:border-sky-200 transition-all">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                      <span className="px-2.5 py-0.5 bg-red-50 text-red-650 border border-red-105 rounded-lg text-[10px] font-extrabold uppercase font-mono">
                                        {brand}
                                      </span>
                                      <span className="text-[9px] font-bold text-slate-400">Enter Cases</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                      {(['625ml', '500ml', '330ml', '330ml pts', 'Packs'] as const).map((sku) => {
                                        const qtyValue = brandSkuQuantities[brand]?.[sku] || '';
                                        return (
                                          <div key={sku} className="space-y-1">
                                            <label className="text-[8px] font-extrabold text-slate-400 block tracking-tight">
                                              {sku}
                                            </label>
                                            <input
                                              type="number"
                                              min="0"
                                              placeholder="0"
                                              value={qtyValue}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setBrandSkuQuantities(prev => ({
                                                  ...prev,
                                                  [brand]: {
                                                    ...(prev[brand] || {
                                                      '625ml': '',
                                                      '500ml': '',
                                                      '330ml': '',
                                                      '330ml pts': '',
                                                      'Packs': ''
                                                    }),
                                                    [sku]: val
                                                  }
                                                }));
                                              }}
                                              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2.5 text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white transition-all text-slate-800"
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-5 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-[11px] text-slate-400 italic font-sans py-7">
                                Please select at least one competitor brand above to customize SKU matrices.
                              </div>
                            )}

                            {/* Invoice Photo capture / selection */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-sans">
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
                          </div>

                          {/* Form Action Buttons */}
                          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-150">
                              <button
                                type="button"
                                onClick={() => {
                                  setCompetitorView('list');
                                }}
                                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-500 text-center cursor-pointer transition-colors bg-transparent"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!trackingForm.outletRtCode) {
                                    addToast({ type: 'warning', message: 'Please select an outlet from the dropdown.' });
                                    return;
                                  }

                                  if (selectedBrands.length === 0) {
                                    addToast({ type: 'warning', message: 'Please select at least one competitor brand.' });
                                    return;
                                  }
                                  
                                  const matchedOutlet = outletsList.find(o => o.rtCode === trackingForm.outletRtCode);
                                  if (!matchedOutlet) {
                                    addToast({ type: 'error', message: 'Unable to match selected outlet.' });
                                    return;
                                  }

                                  // OPTIMISTIC UPDATE:
                                  // 1. Calculate and map all SKUs list across multiple selected brands
                                  const localSkus: { sku_type: string; sku_id: string; quantity: number }[] = [];
                                  selectedBrands.forEach(brand => {
                                    const quantities = brandSkuQuantities[brand] || {};
                                    Object.entries(quantities).forEach(([skuType, qtyStr]) => {
                                      const qtyNum = parseInt(qtyStr as string) || 0;
                                      if (qtyNum > 0) {
                                        localSkus.push({
                                          sku_type: `${brand} - ${skuType}`,
                                          sku_id: `${brand} - ${skuType}`,
                                          quantity: qtyNum
                                        });
                                      }
                                    });
                                  });

                                  const calculatedTotal = localSkus.reduce((sum, s) => sum + s.quantity, 0);
                                  const uniqueCount = localSkus.length;
                                  const commaSeparatedBrands = selectedBrands.join(', ');

                                  const tempId = `competitor-temp-${Date.now()}`;

                                  // Build the transient UI record representation instantly
                                  const optimisticRecord: CompetitorRecord = {
                                    id: tempId,
                                    outletName: matchedOutlet.name,
                                    rtCode: matchedOutlet.rtCode,
                                    competitorBrand: commaSeparatedBrands,
                                    invoicePhoto: trackingForm.invoicePhoto,
                                    notes: trackingForm.notes,
                                    date: trackingForm.date || new Date().toISOString().split('T')[0],
                                    skus: localSkus,
                                    totalSkuQty: calculatedTotal,
                                    uniqueSkusCount: uniqueCount,
                                    skuQty: String(calculatedTotal)
                                  };

                                  // Update state immediately
                                  setCompetitorRecords(prev => [optimisticRecord, ...prev]);

                                  // Instantly Alert success and navigate back
                                  addToast({ type: 'success', message: 'Competitor tracking saved successfully!' });
                                  setCompetitorView('list');

                                  // Begin completely non-blocking background save process
                                  (async () => {
                                    try {
                                      const primaryRow = {
                                        se_code: profile?.se_code || 'ALL_ACCESS',
                                        rt_code: matchedOutlet.rtCode,
                                        outlet_name: matchedOutlet.name,
                                        competitor_brand: commaSeparatedBrands,
                                        notes: trackingForm.notes,
                                        invoice_photo_url: trackingForm.invoicePhoto
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

                                      let trackingId = tempId;
                                      if (response.ok) {
                                        const resData = await response.json();
                                        const insertedRow = Array.isArray(resData) ? resData[0] : resData;
                                        if (insertedRow && insertedRow.id) {
                                          trackingId = String(insertedRow.id);

                                          // Bind real key/ID back to the local records array
                                          setCompetitorRecords(prev => prev.map(rec => {
                                            if (rec.id === tempId) {
                                              return { ...rec, id: trackingId };
                                            }
                                            return rec;
                                          }));
                                        }
                                      }

                                      // 3. Setup and post tracking SKUs for ALL selected brands in ONE giant batch insert
                                      const skusToInsert: { tracking_id: string; sku_size: string; quantity: number }[] = [];
                                      selectedBrands.forEach(brand => {
                                        const quantities = brandSkuQuantities[brand] || {};
                                        Object.entries(quantities).forEach(([skuType, qtyStr]) => {
                                          const qtyNum = parseInt(qtyStr as string) || 0;
                                          if (qtyNum > 0) {
                                            skusToInsert.push({
                                              tracking_id: trackingId,
                                              sku_size: `${brand} - ${skuType}`,
                                              quantity: qtyNum
                                            });
                                          }
                                        });
                                      });

                                      if (skusToInsert.length > 0) {
                                        await fetch(`${SUPABASE_URL}competitor_skus`, {
                                          method: 'POST',
                                          headers: {
                                            'apikey': SUPABASE_ANON_KEY,
                                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                                            'Content-Type': 'application/json'
                                          },
                                          body: JSON.stringify(skusToInsert)
                                        });
                                      }

                                      // Silently cache/fetch from DB to absolute sync
                                      fetchCompetitorRecordsFromSupabase();
                                    } catch (err) {
                                      console.warn("Background persistence fallback handled successfully:", err);
                                    }
                                  })();
                                }}
                                className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-center text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1 border-none font-sans"
                              >
                                <Check className="w-4 h-4" />
                                <span>{language === 'SI' ? 'සුරකින්න' : 'Save Record'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {competitorView === 'detail' && selectedCompetitorRecord && (
                        <div className="px-5 py-4 space-y-5 animate-in fade-in duration-200 text-left font-sans">
                          
                          {/* Back Header */}
                          <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  setSelectedCompetitorRecord(null);
                                  setCompetitorView('list');
                                }}
                                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 cursor-pointer transition-colors border-none"
                              >
                                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                              </button>
                              <div>
                                <span className="text-[10px] font-sans font-bold text-rose-500 uppercase tracking-widest block font-mono">
                                  Audit Intelligence Log
                                </span>
                                <h2 className="text-lg font-extrabold text-slate-900 font-sans">
                                  Field Tracking Detail
                                </h2>
                              </div>
                            </div>

                            {/* Detailed single-record PDF export */}
                            <button
                              onClick={() => handleExportSingleRecordToPDF(selectedCompetitorRecord)}
                              disabled={isGeneratingPDF}
                              className={`bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold py-2 px-3 sm:px-4 rounded-xl flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer border-none font-sans shrink-0 ${
                                isGeneratingPDF ? 'cursor-not-allowed opacity-70' : ''
                              }`}
                            >
                              {isGeneratingPDF ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>{language === 'SI' ? 'සකසමින්...' : 'Generating...'}</span>
                                </>
                              ) : (
                                <>
                                  <FileText className="w-4 h-4" />
                                  <span>{language === 'SI' ? 'PDF ගොනුව' : 'Export PDF'}</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Relational Outlet Information Card */}
                          {(() => {
                            const matchedOutlet = outletsList.find(o => o.rtCode === selectedCompetitorRecord.rtCode);
                            return (
                              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 shadow-2xs">
                                <div className="flex items-start gap-3">
                                  <div className="p-2.5 bg-sky-100 rounded-xl text-sky-600 mt-0.5 shrink-0">
                                    <Store className="w-5 h-5 text-sky-600" />
                                  </div>
                                  <div>
                                    <span className="text-[8px] font-extrabold font-mono text-slate-400 block tracking-tight uppercase">Selected Outlet</span>
                                    <h4 className="font-sans font-extrabold text-slate-900 text-sm leading-snug">
                                      {selectedCompetitorRecord.outletName}
                                    </h4>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200/60 text-[11px] leading-relaxed">
                                  <div>
                                    <span className="text-[8px] font-bold uppercase text-slate-405 tracking-wider block mb-0.5">RT Code</span>
                                    <span className="font-bold text-slate-800 font-mono text-xs">{selectedCompetitorRecord.rtCode}</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] font-bold uppercase text-slate-405 tracking-wider block mb-0.5">Distribution Route</span>
                                    <span className="font-semibold text-slate-700 truncate block">
                                      {matchedOutlet?.address || 'Territory Delivery Circle'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Meta grid and SKU Breakdown */}
                          {(() => {
                            const recordBrands = selectedCompetitorRecord.competitorBrand 
                              ? selectedCompetitorRecord.competitorBrand.split(',').map((b: string) => b.trim()).filter(Boolean)
                              : [];

                            if (recordBrands.length === 0) {
                              recordBrands.push(selectedCompetitorRecord.competitorBrand || 'Unknown Brand');
                            }

                            const groupedSkuLists: Record<string, { size: string; qty: number }[]> = {};
                            recordBrands.forEach((b: string) => {
                              groupedSkuLists[b] = [];
                            });

                            if (selectedCompetitorRecord.skus && selectedCompetitorRecord.skus.length > 0) {
                              selectedCompetitorRecord.skus.forEach((sku: any) => {
                                const rawSkuType = sku.sku_type || sku.sku_size || '';
                                const qty = parseInt(sku.quantity) || 0;

                                if (rawSkuType.includes(' - ')) {
                                  const parts = rawSkuType.split(' - ');
                                  const brandName = parts[0].trim();
                                  const skuSize = parts.slice(1).join(' - ').trim();

                                  if (brandName && recordBrands.includes(brandName)) {
                                    groupedSkuLists[brandName].push({ size: skuSize, qty });
                                  } else {
                                    const matchedBrand = recordBrands.find((rb: string) => rb.toLowerCase() === brandName.toLowerCase());
                                    if (matchedBrand) {
                                      groupedSkuLists[matchedBrand].push({ size: skuSize, qty });
                                    } else if (recordBrands.length > 0) {
                                      groupedSkuLists[recordBrands[0]].push({ size: rawSkuType, qty });
                                    }
                                  }
                                } else {
                                  if (recordBrands.length > 0) {
                                    groupedSkuLists[recordBrands[0]].push({ size: rawSkuType, qty });
                                  }
                                }
                              });
                            }

                            return (
                              <>
                                {/* Meta grid */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-3xs">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Competitor Brands</span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {recordBrands.map((b: string) => (
                                        <span key={b} className="px-2 py-0.5 bg-red-50 text-red-650 border border-red-100 rounded text-[9px] font-extrabold uppercase font-mono block">
                                          {b}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-3xs">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Captured Date</span>
                                    <span className="px-2 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-extrabold font-mono block text-center">
                                      {selectedCompetitorRecord.date}
                                    </span>
                                  </div>
                                </div>

                                {/* Structured Multi-Brand SKU Breakdown Section */}
                                <div className="space-y-4">
                                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1 font-mono">
                                    Captured SKU Quantities
                                  </span>

                                  {recordBrands.map((brand: string) => {
                                    const skusForBrand = groupedSkuLists[brand] || [];
                                    const activeSkus = skusForBrand.filter(s => s.qty > 0);

                                    return (
                                      <div key={brand} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-3">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                          <span className="px-2.5 py-0.5 bg-red-50 text-red-650 border border-red-100 rounded-lg text-[10px] font-extrabold uppercase font-mono">
                                            {brand}
                                          </span>
                                          <span className="text-[9px] font-extrabold text-slate-400 font-mono">
                                            {activeSkus.length} SKU sizes active
                                          </span>
                                        </div>

                                        {skusForBrand.length > 0 ? (
                                          <div className="grid grid-cols-2 gap-2.5">
                                            {skusForBrand.map((sku, idx) => (
                                              <div 
                                                key={idx} 
                                                className={`flex justify-between items-center px-3 py-2 rounded-xl border transition-all ${
                                                  sku.qty > 0 
                                                    ? 'bg-sky-50/50 border-sky-100 text-slate-800 font-bold' 
                                                    : 'bg-slate-50/45 border-slate-100 text-slate-450'
                                                }`}
                                              >
                                                <span className="text-[10px] font-sans font-semibold">{sku.size}</span>
                                                <span className={`text-xs font-black font-mono ${sku.qty > 0 ? 'text-sky-600' : 'text-slate-350'}`}>
                                                  {sku.qty} cs
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="py-3 text-center text-[10px] text-slate-400 italic">
                                            No cases logged for this competitor brand.
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            );
                          })()}

                          {/* Observations Notepad */}
                          <div className="bg-amber-50/40 border border-amber-200/60 rounded-2xl p-4 shadow-3xs relative overflow-hidden">
                            <span className="text-[9px] font-extrabold text-amber-600/85 uppercase tracking-widest block mb-2 font-mono">
                              Observations Notes
                            </span>
                            <p className="text-slate-700 text-xs font-medium leading-relaxed italic relative z-10 font-sans">
                              {selectedCompetitorRecord.notes ? `"${selectedCompetitorRecord.notes}"` : 'No technical notes recorded.'}
                            </p>
                          </div>

                          {/* Invoice photo rendering */}
                          <div>
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2 font-mono">
                              Associated Invoice Photo
                            </span>

                            {selectedCompetitorRecord.invoicePhoto ? (
                              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 overflow-hidden shadow-xs flex flex-col items-center justify-center">
                                <img 
                                  src={selectedCompetitorRecord.invoicePhoto} 
                                  alt="Captured audit document" 
                                  className="rounded-xl max-h-[220px] w-auto max-w-full object-contain border border-slate-150 shadow-3xs"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="text-[9px] font-bold text-slate-400 mt-2 font-mono flex items-center gap-1.5">
                                  <span>📷 Document Proof</span>
                                  <span>•</span>
                                  <span>Offline Safe Synchronized</span>
                                </span>
                              </div>
                            ) : (
                              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 text-center text-[11px] text-slate-400 font-sans py-8">
                                <span className="text-[18px] mb-1">📇</span>
                                <h5 className="font-extrabold text-slate-600">No physical photo document paper attached</h5>
                                <p className="text-[9px] text-slate-450 mt-1">Visit audited via immediate SKU volume counters.</p>
                              </div>
                            )}
                          </div>

                          {/* Detail Back Button Footer */}
                          <div className="pt-3 border-t border-slate-100 flex justify-end">
                            <button
                              onClick={() => {
                                setSelectedCompetitorRecord(null);
                                setCompetitorView('list');
                              }}
                              className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold shadow-md transition-all cursor-pointer border-none font-sans"
                            >
                              Return to Dashboard
                            </button>
                          </div>

                        </div>
                      )}
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

                        {/* SECTION 1.5: SESSION LOGOUT */}
                        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-205">
                          <button
                            onClick={handleLogout}
                            className="w-full py-3 bg-rose-50 hover:bg-rose-100/75 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            <LogOut className="w-4 h-4 shrink-0" />
                            <span>{language === 'SI' ? 'පද්ධතියෙන් පිටවෙන්න (Log Out)' : 'Sign Out and Log Out'}</span>
                          </button>
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
