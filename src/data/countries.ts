/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CountryItem {
  code: string;
  name: string;
  bnName: string;
  flag: string;
}

export const COUNTRIES: CountryItem[] = [
  { code: 'bd', name: 'Bangladesh', bnName: 'বাংলাদেশ', flag: '🇧🇩' },
  { code: 'in', name: 'India', bnName: 'ভারত', flag: '🇮🇳' },
  { code: 'us', name: 'United States', bnName: 'আমেরিকা', flag: '🇺🇸' },
  { code: 'gb', name: 'United Kingdom', bnName: 'যুক্তরাজ্য', flag: '🇬🇧' },
  { code: 'pk', name: 'Pakistan', bnName: 'পাকিস্তান', flag: '🇵🇰' },
  { code: 'sa', name: 'Saudi Arabia', bnName: 'সৌদি আরব', flag: '🇸🇦' },
  { code: 'ae', name: 'United Arab Emirates', bnName: 'সংযুক্ত আরব আমিরাত', flag: '🇦🇪' },
  { code: 'ca', name: 'Canada', bnName: 'কানাডা', flag: '🇨🇦' },
  { code: 'au', name: 'Australia', bnName: 'অস্ট্রেলিয়া', flag: '🇦🇺' },
  { code: 'de', name: 'Germany', bnName: 'জার্মানি', flag: '🇩🇪' },
  { code: 'fr', name: 'France', bnName: 'ফ্রান্স', flag: '🇫🇷' },
  { code: 'es', name: 'Spain', bnName: 'স্পেন', flag: '🇪🇸' },
  { code: 'it', name: 'Italy', bnName: 'ইতালি', flag: '🇮🇹' },
  { code: 'br', name: 'Brazil', bnName: 'ব্রাজিল', flag: '🇧🇷' },
  { code: 'ar', name: 'Argentina', bnName: 'আর্জেন্টিনা', flag: '🇦🇷' },
  { code: 'tr', name: 'Turkey', bnName: 'তুরস্ক', flag: '🇹🇷' }
];

export interface FeaturedChannel {
  id: string;
  name: string;
  bnName: string;
  logo: string;
  url: string;
  category: string;
  description: string;
}

export const FEATURED_CHANNELS: FeaturedChannel[] = [
  {
    id: 'feat-mux-demo',
    name: 'Sports Demo Video (HLS Tech)',
    bnName: 'স্পোর্টস ডেমো ভিডিও (এইচএলএস টেস্ট)',
    logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    category: 'Sports Demo',
    description: 'এইচএলএস প্লেব্যাক টেস্ট ও স্ট্রিমিং স্পিড পরখ করার ডেমো ভিডিও।'
  },
  {
    id: 'feat-redbull-tv',
    name: 'Red Bull TV Sports (Live)',
    bnName: 'রেড বুল টিভি স্পোর্টস (লাইভ)',
    logo: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=150&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    url: 'https://rbmn-live.secure.footprint.net/13/index.m3u8',
    category: 'X-Sports',
    description: 'অ্যাডভেঞ্চার স্পোর্টস, মাউন্টেন বাইক রানিং এবং এক্সট্রিম স্পোর্টস লাইভ।'
  },
  {
    id: 'feat-nasa-tv',
    name: 'NASA TV Space Live',
    bnName: 'নাসা টিভি মহাকাশ লাইভ',
    logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=150&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    url: 'https://ntv1.nasatv.live/nasatv/nasa_gwypt_all/playlist.m3u8',
    category: 'Science',
    description: 'মহাকাশ গবেষণা স্টেশন থেকে লাইভ ধারাভাষ্য ও ভিডিও টেলিকাস্ট।'
  },
  {
    id: 'feat-aljazeera',
    name: 'Al Jazeera English News',
    bnName: 'আল জাজিরা লাইভ নিউজ',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=150&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    url: 'https://live-amg-01.getaj.video/ALJAZEERA/index.m3u8',
    category: 'News',
    description: 'আন্তর্জাতিক রাজনীতি, সমাজ ও বিশ্ব সংবাদ সম্পর্কিত সার্বক্ষণিক লাইভ খবর।'
  },
  {
    id: 'feat-dw-eng',
    name: 'DW News English',
    bnName: 'ডিডব্লিউ নিউজ ইংলিশ',
    logo: 'https://images.unsplash.com/photo-1495020689067-958852a6565d?w=150&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwamdstream102/index.m3u8',
    category: 'News',
    description: 'জার্মানির বিখ্যাত অনলাইন টেলিভিশন লাইভ এবং ইউরোপীয় প্রতিবেদন।'
  },
  {
    id: 'feat-france24',
    name: 'France 24 Live EN',
    bnName: 'ফ্রান্স ২৪ লাইভ ইংলিশ',
    logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=150&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    url: 'https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8',
    category: 'News',
    description: 'ফ্রান্স ও ইউরোপ থেকে বিশ্বমানের লাইভ ২৪ ঘন্টা ব্রডকাস্টিং নিউজ।'
  }
];
