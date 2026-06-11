/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  Tv2, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';

interface IPTVPlayerProps {
  url: string;
  channelName: string;
  logo: string | null;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function IPTVPlayer({ url, channelName, logo, onPrev, onNext }: IPTVPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamInfo, setStreamInfo] = useState<{ resolution: string; type: string } | null>(null);
  const [liveDuration, setLiveDuration] = useState<number>(0);

  // Restart loading / reload stream
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset states
    setIsBuffering(true);
    setHasError(false);
    setErrorMessage('');
    setStreamInfo(null);

    // Clean up older HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!url) {
      setIsBuffering(false);
      return;
    }

    // Is it an M3U8 (HLS) stream?
    const isHls = url.toLowerCase().includes('.m3u8') || url.includes('m3u8');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        maxBufferLength: 30,
        maxBufferSize: 30 * 1000 * 1000, // 30MB
        lowLatencyMode: true,
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsBuffering(false);
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false)); // browser blocked autoplay
        }

        // Get video details
        const typeStr = data.levels.length > 0 ? 'HLS (Adaptive)' : 'HLS';
        setStreamInfo({
          type: typeStr,
          resolution: data.levels[0] ? `${data.levels[0].width}x${data.levels[0].height}` : 'Auto'
        });
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level];
        if (level) {
          setStreamInfo(prev => ({
            type: prev?.type || 'HLS',
            resolution: `${level.width}x${level.height}`
          }));
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Fatal network error, trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Fatal media error, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              setHasError(true);
              setErrorMessage('চ্যানেল লিংকটি অফলাইন বা স্ট্রিমিং সাপোর্ট করছে না।');
              setIsBuffering(false);
              hls.destroy();
              break;
          }
        }
      });
    } 
    // Fallback for native HLS (like Safari / iOS) or standard HTML5 video formats
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      setIsBuffering(true);

      const handleLoadedMetadata = () => {
        setIsBuffering(false);
        video.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
        
        setStreamInfo({
          type: 'Native HLS',
          resolution: `${video.videoWidth}x${video.videoHeight}` || 'Standard'
        });
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    } else {
      // General HTML5 video sources
      video.src = url;
      video.load();
      video.play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
          setStreamInfo({
            type: 'HTML5 Media',
            resolution: 'Standard'
          });
        })
        .catch(() => {
          setIsBuffering(false);
          // Wait to see if it triggers an error
        });
    }

    // Video Event Listeners for Buffering and UI states
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
      setHasError(false);
    };
    const onPauseEvent = () => setIsPlaying(false);
    const onErrorEvent = () => {
      // Chrome/Safari native errors
      if (video.error) {
        setHasError(true);
        setErrorMessage('ভিডিও লোড করতে ব্যর্থ হয়েছে। চ্যানেল স্ট্রিমটি সাময়িকভাবে উপলব্ধ না হতে পারে।');
        setIsBuffering(false);
      }
    };
    const onTimeUpdate = () => {
      if (video) {
        setLiveDuration(video.currentTime);
      }
    };

    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPauseEvent);
    video.addEventListener('error', onErrorEvent);
    video.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPauseEvent);
      video.removeEventListener('error', onErrorEvent);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [url, retryCount]);

  // Adjust volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Handle Play/Pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.warn('Playback block:', err);
        });
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Handle Fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error('Fullscreen err:', err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error('Exit fullscreen err:', err));
    }
  };

  // Track fullscreen state change (e.g. if user exits with Esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = Math.floor(secs % 60);

    const pad = (n: number) => n.toString().padStart(2, '0');
    
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  return (
    <div 
      id="main-player-wrapper"
      ref={containerRef}
      className="relative w-full aspect-video rounded-2xl bg-black border border-slate-800/80 shadow-2xl overflow-hidden group select-none"
    >
      {/* Actual Video Element */}
      <video
        id="iptv-video-stream"
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        onClick={togglePlay}
      />

      {/* Buffering Indicator */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs z-10">
          <Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-3" />
          <p className="text-sm font-medium tracking-wide text-slate-300">চ্যানেল কানেক্ট ও বাফারিং হচ্ছে...</p>
        </div>
      )}

      {/* Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 border-2 border-rose-950 px-6 text-center z-10">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/30">
            <AlertTriangle className="w-7 h-7 text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-2">স্ট্রিমিং লোড করা সম্ভব হয়নি</h3>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            {errorMessage || 'ভিডিও কানেকশন টাইমাউট হয়েছে বা সোর্স সার্ভারটি বন্ধ আছে।'}
          </p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-sm font-semibold rounded-xl text-white transition-all shadow-md active:scale-95 duration-100 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            পুনরায় চেষ্টা করুন (Retry)
          </button>
        </div>
      )}

      {/* Top Banner overlay (Shows up on idle/hover inside container) */}
      <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-3">
          {logo ? (
            <img 
              src={logo} 
              alt={channelName} 
              referrerPolicy="no-referrer"
              className="w-9 h-9 object-contain rounded-md bg-slate-900 border border-slate-700 p-0.5" 
            />
          ) : (
            <div className="w-9 h-9 rounded-md bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Tv2 className="w-5 h-5" />
            </div>
          )}
          <div>
            <h4 className="text-sm font-bold text-white drop-shadow-md line-clamp-1">{channelName || 'কোনো চ্যানেল সিলেক্ট করা নেই'}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-[10px] font-semibold text-rose-400 tracking-wider font-mono">লাইভ</span>
            </div>
          </div>
        </div>

        {streamInfo && (
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-semibold text-slate-300 font-mono">
            <span>{streamInfo.type}</span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span className="text-emerald-400">{streamInfo.resolution}</span>
          </div>
        )}
      </div>

      {/* Inner Hover/Idle Big Play Button overlay */}
      {!isBuffering && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <button 
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-rose-600/95 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transform active:scale-95 duration-100 pointer-events-auto cursor-pointer border border-rose-400/20"
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white translate-x-0.5" />}
          </button>
        </div>
      )}

      {/* Bottom Custom Play Controls Overlay */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-12 pb-3 px-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2.5 z-10">
        
        {/* Playback Progress Indicator (Dummy indicator showing streaming time) */}
        <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 px-1 select-none pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="font-bold text-rose-500">LIVE</span>
            <span className="text-slate-500">|</span>
            <span>{formatTime(liveDuration)}</span>
          </div>
          <span>স্ট্রিমিং ব্রডকাস্ট</span>
        </div>

        {/* Action Controls Horizontal Row */}
        <div className="flex items-center justify-between">
          
          {/* Play/Pause & Navs */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
              className="text-white hover:text-rose-400 transition-colors p-1 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white hover:fill-rose-400" /> : <Play className="w-5 h-5 fill-white translate-x-0.5 hover:fill-rose-400" />}
            </button>

            {onPrev && (
              <button 
                onClick={onPrev} 
                className="text-slate-400 hover:text-white transition-all p-1 text-[11px] font-bold tracking-wide active:scale-95 cursor-pointer"
                title="পূর্ববর্তী চ্যানেল"
              >
                ❰❰ পূর্ববর্তী (Prev)
              </button>
            )}

            {onNext && (
              <button 
                onClick={onNext} 
                className="text-slate-400 hover:text-white transition-all p-1 text-[11px] font-bold tracking-wide active:scale-95 cursor-pointer"
                title="পরবর্তী চ্যানেল"
              >
                পরবর্তী (Next) ❱❱
              </button>
            )}
          </div>

          {/* Volume, Info, Fullscreen */}
          <div className="flex items-center gap-4">
            {/* Volume control */}
            <div className="flex items-center gap-2 group/volume">
              <button
                onClick={toggleMute}
                className="text-white hover:text-rose-400 transition-colors p-1 cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-rose-500" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 group-hover/volume:w-20 transition-all duration-200"
              />
            </div>

            {/* Toggle Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-rose-400 transition-colors p-1 cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
