/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Tv2, 
  Globe, 
  Heart, 
  Plus, 
  Trash2, 
  Sparkles, 
  SlidersHorizontal, 
  HelpCircle, 
  AlertCircle, 
  Wifi, 
  X, 
  Check, 
  RefreshCw, 
  ArrowRight,
  BookmarkCheck,
  Tv
} from 'lucide-react';
import { COUNTRIES, FEATURED_CHANNELS, FeaturedChannel, CountryItem } from './data/countries';
import { parseM3U, IPTVChannel, filterChannels } from './utils/m3uParser';
import IPTVPlayer from './components/IPTVPlayer';

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'featured' | 'countries' | 'custom' | 'favorites'>('featured');

  // Currently playing channel
  const [activeChannel, setActiveChannel] = useState<{
    id: string;
    name: string;
    logo: string | null;
    url: string;
    category: string;
  }>({
    id: FEATURED_CHANNELS[0].id,
    name: FEATURED_CHANNELS[0].bnName,
    logo: FEATURED_CHANNELS[0].logo,
    url: FEATURED_CHANNELS[0].url,
    category: FEATURED_CHANNELS[0].category
  });

  // Country Playlist States
  const [selectedCountry, setSelectedCountry] = useState<string>('bd');
  const [countryChannels, setCountryChannels] = useState<IPTVChannel[]>([]);
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState('');

  // Custom Channels (Stored in localStorage)
  const [customChannels, setCustomChannels] = useState<IPTVChannel[]>([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [newChannelCategory, setNewChannelCategory] = useState('');
  const [newChannelLogo, setNewChannelLogo] = useState('');
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customAddSuccess, setCustomAddSuccess] = useState(false);

  // Favorites list (Stored in localStorage)
  const [favorites, setFavorites] = useState<IPTVChannel[]>([]);

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Help Modal
  const [showHelp, setShowHelp] = useState(false);

  // Load custom channels and favorites from localStorage on mount
  useEffect(() => {
    const savedCustom = localStorage.getItem('khela_dekhun_custom_streams');
    if (savedCustom) {
      try {
        setCustomChannels(JSON.parse(savedCustom));
      } catch (e) {
        console.error('Error parsing custom playlists', e);
      }
    }

    const savedFavs = localStorage.getItem('khela_dekhun_favorites');
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        console.error('Error parsing favorites', e);
      }
    }
  }, []);

  // Fetch Country Playlists
  const fetchPlaylistByCountry = async (countryCode: string) => {
    setIsPlaylistLoading(true);
    setPlaylistError('');
    setSelectedCategory('All');
    setSearchQuery('');
    
    try {
      // Fetching country m3u playlist from trusted iptv-org repository API wrapper
      const response = await fetch(`https://iptv-org.github.io/iptv/countries/${countryCode}.m3u`);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const text = await response.text();
      const parsed = parseM3U(text);
      setCountryChannels(parsed);

      // Auto play first channel from parsed channels
      if (parsed.length > 0) {
        setActiveChannel({
          id: parsed[0].id,
          name: parsed[0].name,
          logo: parsed[0].logo,
          url: parsed[0].url,
          category: parsed[0].category
        });
      } else {
        setPlaylistError('কোনো সক্রিয় চ্যানেল পাওয়া যায়নি। অন্য দেশ নির্বাচন করুন।');
      }
    } catch (err: any) {
      console.error('Playlist fetch failed:', err);
      setPlaylistError(
        'চ্যানেল লোড করা সম্ভব হয়নি। আইপিটিভি সাইটের CORS প্রটেকশন বা সাময়িক ডাউন টাইমের কারণে এটি হতে পারে। আপনি আপনার পছন্দমতো কাস্টম চ্যানেল বা অন্য ডোমেন থেকে প্লেলিস্ট যোগ করে বিনোদন নিতে পারেন।'
      );
    } finally {
      setIsPlaylistLoading(false);
    }
  };

  // Fetch Bangladesh playlist on initial mount for countries tab fallback
  useEffect(() => {
    fetchPlaylistByCountry('bd');
  }, []);

  // Sync Favorites to localStorage
  const toggleFavorite = (channel: { id: string; name: string; logo: string | null; url: string; category: string }) => {
    const isFav = favorites.some(f => f.url === channel.url);
    let updated: IPTVChannel[] = [];
    if (isFav) {
      updated = favorites.filter(f => f.url !== channel.url);
    } else {
      updated = [
        ...favorites,
        {
          id: channel.id || `fav-${Date.now()}`,
          name: channel.name,
          logo: channel.logo,
          url: channel.url,
          category: channel.category
        }
      ];
    }
    setFavorites(updated);
    localStorage.setItem('khela_dekhun_favorites', JSON.stringify(updated));
  };

  const isChannelFavorite = (url: string) => {
    return favorites.some(f => f.url === url);
  };

  // Add Custom Channel
  const handleAddCustomChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName || !newChannelUrl) return;

    const newChan: IPTVChannel = {
      id: `custom-${Date.now()}`,
      name: newChannelName,
      url: newChannelUrl,
      category: newChannelCategory || 'কাস্টম',
      logo: newChannelLogo || null
    };

    const updated = [...customChannels, newChan];
    setCustomChannels(updated);
    localStorage.setItem('khela_dekhun_custom_streams', JSON.stringify(updated));

    // Reset Form & Play Added Channel
    setNewChannelName('');
    setNewChannelUrl('');
    setNewChannelCategory('');
    setNewChannelLogo('');
    
    setCustomAddSuccess(true);
    setTimeout(() => setCustomAddSuccess(false), 3000);

    setActiveChannel({
      id: newChan.id,
      name: newChan.name,
      logo: newChan.logo,
      url: newChan.url,
      category: newChan.category
    });
  };

  // Delete Custom Channel
  const handleDeleteCustomChannel = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customChannels.filter(c => c.id !== id);
    setCustomChannels(updated);
    localStorage.setItem('khela_dekhun_custom_streams', JSON.stringify(updated));
  };

  // Get active stream channel list based on tab selection
  const currentTabChannels = useMemo(() => {
    switch (activeTab) {
      case 'featured':
        return FEATURED_CHANNELS.map(ch => ({
          id: ch.id,
          name: ch.bnName,
          logo: ch.logo,
          url: ch.url,
          category: ch.category
        }));
      case 'countries':
        return countryChannels;
      case 'custom':
        return customChannels;
      case 'favorites':
        return favorites;
      default:
        return [];
    }
  }, [activeTab, countryChannels, customChannels, favorites]);

  // Dynamic filter lists
  const categories = useMemo(() => {
    const cats = new Set<string>();
    currentTabChannels.forEach(ch => {
      if (ch.category) cats.add(ch.category);
    });
    return ['All', ...Array.from(cats)];
  }, [currentTabChannels]);

  // Filter channels based on search and selected category badge
  const filteredChannels = useMemo(() => {
    return filterChannels(currentTabChannels, searchQuery, selectedCategory);
  }, [currentTabChannels, searchQuery, selectedCategory]);

  // Navigate channels next/prev inside the active list
  const handlePrevChannel = () => {
    if (filteredChannels.length <= 1) return;
    const currentIndex = filteredChannels.findIndex(c => c.url === activeChannel.url);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + filteredChannels.length) % filteredChannels.length;
    const prevChan = filteredChannels[prevIndex];
    setActiveChannel({
      id: prevChan.id,
      name: prevChan.name,
      logo: prevChan.logo,
      url: prevChan.url,
      category: prevChan.category
    });
  };

  const handleNextChannel = () => {
    if (filteredChannels.length <= 1) return;
    const currentIndex = filteredChannels.findIndex(c => c.url === activeChannel.url);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % filteredChannels.length;
    const nextChan = filteredChannels[nextIndex];
    setActiveChannel({
      id: nextChan.id,
      name: nextChan.name,
      logo: nextChan.logo,
      url: nextChan.url,
      category: nextChan.category
    });
  };

  return (
    <div className="min-h-screen text-slate-100 bg-slate-950 pb-16 selection:bg-rose-600 selection:text-white">
      
      {/* Decorative colored glow headers */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>

      {/* Main Header navigation bar */}
      <header className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/30">
            <Tv2 className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-black tracking-tight text-white font-bengali">খেলা দেখুন</h1>
              <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded font-black tracking-widest font-mono uppercase">IPTV PLayer</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">লাইভ স্পোর্টস ও ইন্টারন্যাশনাল টিভি স্ট্রিমিং</p>
          </div>
        </div>

        {/* Action Widgets */}
        <div className="flex items-center gap-2">
          {/* Status badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>প্লেয়ার রেডি</span>
          </div>
          
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg border border-transparent hover:border-slate-800 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <HelpCircle className="w-4.5 h-4.5" />
            <span className="hidden md:inline">ব্যবহার নির্দেশিকা</span>
          </button>
        </div>
      </header>

      {/* Welcome Banner / Announcement */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-5">
        <div className="relative rounded-2xl bg-slate-900/40 p-4 border border-slate-900 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider">স্পেশাল টিপস</p>
              <p className="text-xs text-slate-400 mt-0.5">
                বাংলাদেশি স্পোর্টস বা টিভি চ্যানেল স্ট্রিমিংয়ের জন্য নিচে <strong className="text-slate-200">"দেশ ভিত্তিক চ্যানেল"</strong> ট্যাব সিলেক্ট করে <strong className="text-slate-200">বাংলাদেশ 🇧🇩</strong> ক্লিক করুন। সব চ্যানেল দেখতে সার্চ ফিল্টার ব্যবহার করুন।
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setActiveTab('countries');
                setSelectedCountry('bd');
                fetchPlaylistByCountry('bd');
              }}
              className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              🇧🇩 বাংলাদেশ চ্যানেল লোড করুন
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Wrapper */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Video Screen & Play Details) - 7 cols */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Main Custom Video Stream Player */}
          <IPTVPlayer 
            url={activeChannel.url}
            channelName={activeChannel.name}
            logo={activeChannel.logo}
            onPrev={handlePrevChannel}
            onNext={handleNextChannel}
          />

          {/* Currently playing metadata dashboard information */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5 shadow-lg relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {activeChannel.logo ? (
                  <img 
                    src={activeChannel.logo} 
                    alt={activeChannel.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-contain rounded-xl bg-slate-950 border border-slate-800 p-1 shrink-0"
                    onError={(e) => {
                      // Remove logo if it fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-950 text-rose-500 border border-slate-800 flex items-center justify-center shrink-0 font-black text-lg">
                    {activeChannel.name[0] || 'T'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {activeChannel.category || 'সাধারণ'}
                    </span>
                    <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 line-clamp-1 max-w-[150px]">
                      HLS Stream
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1.5">{activeChannel.name}</h2>
                </div>
              </div>

              {/* Toggle Favorite Action Button */}
              <button
                onClick={() => toggleFavorite(activeChannel)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                  isChannelFavorite(activeChannel.url)
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/25'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Heart className={`w-4 h-4 ${isChannelFavorite(activeChannel.url) ? 'fill-rose-500 text-rose-500 animate-ping' : ''}`} />
                {isChannelFavorite(activeChannel.url) ? 'প্রিয় তালিকাভুক্ত (Saved)' : 'প্রিয় তালিকায় যুক্ত করুন'}
              </button>
            </div>

            {/* Stream link accordion/box */}
            <div className="mt-4 pt-4 border-t border-slate-900/80 flex flex-col gap-2">
              <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">সরাসরি স্ট্রিমিং লিঙ্ক (HLS Source URL):</label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={activeChannel.url} 
                  className="w-full bg-slate-955 text-slate-300 text-xs font-mono px-3.5 py-2 rounded-lg border border-slate-850/60 focus:outline-none select-all"
                />
              </div>
            </div>
          </div>

          {/* Quick Custom Streaming Link Adder (Inline accordion card) */}
          <div className="bg-slate-900/30 border border-slate-900/60 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-pink-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">নিজের কোনো প্রিয় খেলার স্ট্রিমিং লিঙ্ক চালান</h3>
              </div>
              <button
                onClick={() => setShowAddCustomModal(!showAddCustomModal)}
                className="text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors bg-pink-950/10 px-3 py-1 rounded-lg border border-pink-900/30 cursor-pointer"
              >
                {showAddCustomModal ? 'ফর্ম বন্ধ করুন' : 'যোগ করার ফর্ম'}
              </button>
            </div>

            {showAddCustomModal && (
              <form onSubmit={handleAddCustomChannel} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1.5">চ্যানেল বা খেলার নাম *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: বাংলাদেশের খেলা, স্পোর্টস লাইভ"
                      value={newChannelName}
                      onChange={e => setNewChannelName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1.5">M3U8 বা সরাসরি ভিডিও URL *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://example.com/live/stream.m3u8"
                      value={newChannelUrl}
                      onChange={e => setNewChannelUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1.5">ক্যাটাগরি বা গ্রুপ (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      placeholder="যেমন: Sports, News, General"
                      value={newChannelCategory}
                      onChange={e => setNewChannelCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1.5">লোগো ছবি লিংক (ঐচ্ছিক)</label>
                    <input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={newChannelLogo}
                      onChange={e => setNewChannelLogo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition-all font-mono"
                    />
                  </div>
                </div>

                {customAddSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-400 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    কাস্টম চ্যানেলটি সফলভাবে যোগ করা হয়েছে এবং প্লে করা হচ্ছে!
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 duration-100 cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    যোগ করুন এবং চ্যানেলটি চালান
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Right Column (IPTV Channel Browser Hub) - 5 cols */}
        <section className="lg:col-span-5 bg-slate-900/40 border border-slate-900 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
          
          {/* Main Browse tabs selectors */}
          <div className="grid grid-cols-4 border-b border-slate-900 p-1 bg-slate-950/60">
            <button
              onClick={() => {
                setActiveTab('featured');
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className={`py-3 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'featured'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Sparkles className="w-4.5 h-4.5" />
              <span>জনপ্রিয় লাইভ</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('countries');
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className={`py-3 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'countries'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Globe className="w-4.5 h-4.5" />
              <span>দেশ ভিত্তিক</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('custom');
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className={`py-3 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Tv className="w-4.5 h-4.5" />
              <span>কাস্টম ({customChannels.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('favorites');
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className={`py-3 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer ${
                activeTab === 'favorites'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <Heart className="w-4.5 h-4.5" />
              <span>প্রিয় ({favorites.length})</span>
            </button>
          </div>

          {/* Subheader Filters container */}
          <div className="p-4 flex flex-col gap-3.5 border-b border-slate-900 bg-slate-900/20">
            
            {/* Country Selector (Only visible if 'countries' tab is active) */}
            {activeTab === 'countries' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-15">
                  <Globe className="w-3.5 h-3.5 text-rose-500" />
                  দেশ সিলেক্ট করুন:
                </label>
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {COUNTRIES.map(item => (
                    <button
                      key={item.code}
                      onClick={() => {
                        setSelectedCountry(item.code);
                        fetchPlaylistByCountry(item.code);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left transition-all flex items-center justify-between border cursor-pointer ${
                        selectedCountry === item.code
                          ? 'bg-rose-500/10 border-rose-500/50 text-rose-400'
                          : 'bg-slate-950/60 border-slate-900 hover:border-slate-800 hover:bg-slate-900/45 text-slate-300'
                      }`}
                    >
                      <span className="truncate">{item.flag} {item.bnName}</span>
                      {selectedCountry === item.code && <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Keyword Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="h-4 w-4 text-slate-500" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="চ্যানেলের নাম বা গ্রুপ দিয়ে খুঁজুন..."
                className="w-full bg-slate-950 border border-slate-850/60 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 transition-all font-bengali"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Pills Filters Row */}
            {categories.length > 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-950 border border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {cat === 'All' ? 'সব ক্যাটাগরি' : cat}
                  </button>
                ))}
              </div>
            )}

          </div>

          {/* Loader indicator for country fetch */}
          {isPlaylistLoading && (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <RefreshCw className="w-10 h-10 text-rose-500 animate-spin mb-4" />
              <p className="text-sm font-bold text-slate-200">চ্যানেল প্লেলিস্ট ডাউনলোড করা হচ্ছে...</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">এটি সামান্য কয়েক সেকেন্ড সময় নিতে পারে। অনুগ্রহ করে অপেক্ষা করুন।</p>
            </div>
          )}

          {/* Playlist Loader Error Indicator */}
          {!isPlaylistLoading && playlistError && activeTab === 'countries' && (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
                <AlertCircle className="w-6 h-6 text-amber-500" />
              </div>
              <h4 className="text-sm font-bold text-slate-200 mb-1.5">প্লেলিস্ট ফেচ ত্রুটি</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{playlistError}</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => fetchPlaylistByCountry(selectedCountry)}
                  className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 mx-auto"
                >
                  <RefreshCw className="w-3 h-3" />
                  পুনরায় চেষ্টা করুন
                </button>
                <button
                  onClick={() => setActiveTab('featured')}
                  className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  জনপ্রিয় লাইভ চ্যানেল খেলুন 📺
                </button>
              </div>
            </div>
          )}

          {/* Active Channels List View */}
          {!isPlaylistLoading && (!playlistError || activeTab !== 'countries') && (
            <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-950 pr-0.5">
              
              {filteredChannels.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 px-6">
                  <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center mb-3">
                    <Wifi className="w-5 h-5 text-slate-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-300">কোনো চ্যানেল পাওয়া যায়নি</h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                    আপনার সার্চ কুয়েরির সাথে মিলছে এমন কোনো চ্যানেল এই তালিকায় নেই। সার্চ কী-ওয়ার্ড পরিবর্তন করে দেখুন।
                  </p>
                </div>
              ) : (
                filteredChannels.map((channel, index) => {
                  const isActive = activeChannel.url === channel.url;
                  return (
                    <div
                      key={`${channel.id}-${index}`}
                      onClick={() => {
                        setActiveChannel({
                          id: channel.id,
                          name: channel.name,
                          logo: channel.logo,
                          url: channel.url,
                          category: channel.category
                        });
                      }}
                      className={`flex items-center justify-between p-3.5 cursor-pointer text-left transition-all ${
                        isActive
                          ? 'bg-rose-500/10 border-l-4 border-l-rose-500'
                          : 'hover:bg-slate-900/40 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Channel Logo */}
                        {channel.logo ? (
                          <img
                            src={channel.logo}
                            alt={channel.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-contain rounded-lg bg-slate-950 border border-slate-900 p-0.5 shrink-0"
                            onError={(e) => {
                              // Replace broken logos with a letter placeholder
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-900/40 text-slate-400 font-bold text-sm shrink-0 flex items-center justify-center uppercase">
                            {channel.name[0] || 'CH'}
                          </div>
                        )}

                        {/* Title and metadata */}
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold leading-snug line-clamp-1 ${isActive ? 'text-rose-400' : 'text-slate-300 group-hover:text-white'}`}>
                            {channel.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-medium font-mono mt-0.5 inline-block truncate max-w-[150px]">
                            {channel.category || 'General'}
                          </span>
                        </div>
                      </div>

                      {/* Small Actions (Favorites indicators and deletes) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        
                        {/* Favorite button toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite({
                              id: channel.id,
                              name: channel.name,
                              logo: channel.logo,
                              url: channel.url,
                              category: channel.category
                            });
                          }}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            isChannelFavorite(channel.url)
                              ? 'text-rose-500 hover:text-rose-400'
                              : 'text-slate-600 hover:text-slate-400'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isChannelFavorite(channel.url) ? 'fill-rose-500' : ''}`} />
                        </button>

                        {/* Delete button (If custom channel list) */}
                        {activeTab === 'custom' && (
                          <button
                            onClick={(e) => handleDeleteCustomChannel(channel.id, e)}
                            className="p-1.5 text-slate-600 hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Playing Active Indicator */}
                        {isActive && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })
              )}

            </div>
          )}

          {/* Footer of card */}
          <div className="bg-slate-950 p-4 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500 font-semibold font-mono">
            <span>চ্যানেল সংখ্যা: {filteredChannels.length}</span>
            <span>খেলা দেখুন IPTV v2.1</span>
          </div>

        </section>

      </main>

      {/* Help Instructions Sidebar / Modal Backdrop */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2.5xl relative overflow-hidden flex flex-col gap-4">
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-bold text-white font-bengali">ব্যবহার নির্দেশিকা (How-to Guide)</h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1.5 bg-slate-950 hover:bg-slate-800/80 hover:text-white text-slate-400 rounded-lg border border-slate-850 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-4 max-h-[400px] overflow-y-auto pr-1">
              
              <div className="space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-rose-400">
                  <BookmarkCheck className="w-4.5 h-4.5 text-rose-400" />
                  ১. এই অ্যাপটি কী কাজ করে?
                </h4>
                <p className="leading-relaxed pl-6 text-slate-400 text-[11px]">
                  "খেলা দেখুন" একটি ওপেন সোর্স IPTV এবং স্পোর্টস স্ট্রিমিং প্লেয়ার। এটি যেকোনো সোর্স থেকে M3U8 ফরম্যাটের লাইভ স্ট্রিমিং লিংক রিড করে ব্রাউজারে সেকেন্ডের মধ্যে প্লে করতে পারে।
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-rose-400">
                  <BookmarkCheck className="w-4.5 h-4.5 text-rose-400" />
                  ২. দেশ ভিত্তিক চ্যানেল কীভাবে ব্যবহার করবেন?
                </h4>
                <p className="leading-relaxed pl-6 text-slate-400 text-[11px]">
                  <strong>"দেশ ভিত্তিক"</strong> (Country wise) ট্যাব এ ক্লিক করে যেকোনো দেশের ফ্লাগ এ ক্লিক করুন। এই অ্যাপটি ওয়ার্ল্ডওয়াইড IPTV-ORG রিপোজিটরির ডাটাবেজ থেকে স্বয়ংক্রিয়ভাবে সংশ্লিষ্ট দেশের লাইভ চ্যানেল লিস্ট নামিয়ে আনবে।
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-rose-400">
                  <BookmarkCheck className="w-4.5 h-4.5 text-rose-400" />
                  ৩. CORS সংক্রান্ত কোনো সমস্যা হলে কী করব?
                </h4>
                <p className="leading-relaxed pl-6 text-slate-400 text-[11px]">
                  কিছু কিছু দেশের অফিশিয়াল প্লেলিস্ট সিকিউরিটি বা ব্রাউজারের CORS পলিসির কারণে ফেচ হতে বাধা পেতে পারে। এ ক্ষেত্রে আপনি যেকোনো উন্মুক্ত স্ট্রিমিং সোর্স থেকে বা আপনার নিজের সংগ্রহে থাকা ২-৩ লাইনের .m3u8 লিংক কপি করে <strong>"কাস্টম চ্যানেল"</strong> যুক্ত করার ফর্মে পেস্ট করে সহজেই সাথে সাথে উপভোগ করতে পারবেন।
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-rose-400">
                  <BookmarkCheck className="w-4.5 h-4.5 text-rose-400" />
                  ৪. ফ্রি লাইভ .m3u8 বা .m3u লিংক কোথায় পাব?
                </h4>
                <p className="leading-relaxed pl-6 text-slate-400 text-[11px]">
                  ইন্টারনেটে বা গিটহাবে "free iptv playlists" লিখে খুঁজলে অনেক ওপেন সোর্স ও লাইভ স্পোর্টস লিঙ্ক সংগ্রহ করা যায়। সেগুলো আপনি এই অ্যাপের কাস্টম ফর্মে বসিয়ে দিন।
                </p>
              </div>

            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                বুঝতে পেরেছি
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
