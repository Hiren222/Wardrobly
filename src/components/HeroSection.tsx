import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSiteContent } from '../context/SiteContentContext';
import defaultHeroVideo from '../assets/hero-wardrobe.mp4';
import defaultPoster from '../assets/after-1.jpeg';

gsap.registerPlugin(ScrollTrigger);

interface HeroSectionProps {
  onSeeWorkClick?: () => void;
  onBookClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSeeWorkClick, onBookClick }) => {
  const { data } = useSiteContent();
  const { hero } = data;
  const [videoError, setVideoError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  const videoSource = !videoError && hero?.videoUrl ? hero.videoUrl : defaultHeroVideo;
  const posterSource = hero?.posterUrl || defaultPoster;

  // Reset video error state when source changes
  useEffect(() => {
    setVideoError(false);
  }, [hero?.videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    const textContent = textContentRef.current;
    const scrollIndicator = scrollIndicatorRef.current;
    if (!container) return;

    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.pause();
    }

    let tl: gsap.core.Timeline | null = null;

    const initScrubAnimation = () => {
      if (tl) tl.kill();

      const duration = video && video.duration && !isNaN(video.duration) && video.duration > 0
        ? video.duration
        : 4;

      const videoScrubObj = { time: 0 };

      // We trigger on the outer runway container using native CSS sticky (no intrusive GSAP pin-spacers)
      tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      // 1. Scrub the video smoothly across the full scroll runway
      tl.to(
        videoScrubObj,
        {
          time: Math.max(0.1, duration - 0.05),
          ease: 'none',
          duration: 1.0,
          onUpdate: () => {
            if (video && !isNaN(video.duration) && video.duration > 0) {
              const diff = Math.abs(video.currentTime - videoScrubObj.time);
              if (diff > 0.015) {
                video.currentTime = videoScrubObj.time;
              }
            }
          },
        },
        0
      );

      // 2. Hero text content fades out when animation is scrolled more than 7%
      if (textContent) {
        tl.fromTo(
          textContent,
          { opacity: 1, y: 0, scale: 1 },
          {
            opacity: 0,
            y: -30,
            scale: 0.98,
            duration: 0.12,
            ease: 'power2.out',
          },
          0.07
        );
      }

      // 3. Scroll indicator fades out quickly on initial scroll
      if (scrollIndicator) {
        tl.fromTo(
          scrollIndicator,
          { opacity: 1, y: 0 },
          {
            opacity: 0,
            y: 15,
            duration: 0.06,
            ease: 'power1.out',
          },
          0
        );
      }

      ScrollTrigger.refresh();
    };

    // Initialize animation
    initScrubAnimation();

    const handleLoadedMetadata = () => {
      initScrubAnimation();
    };

    if (video) {
      if (video.readyState >= 1) {
        initScrubAnimation();
      } else {
        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      }
    }

    return () => {
      if (video) {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
      if (tl) tl.kill();
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.vars.trigger === container) {
          trigger.kill();
        }
      });
    };
  }, [videoSource]);

  return (
    <div
      id="hero"
      ref={containerRef}
      aria-label="Hero Introduction"
      className="relative w-full h-[300vh] bg-[#231E1B]"
    >
      {/* Sticky Viewport Stage - Always stays fixed at 100vh while scrolling through container runway */}
      <div 
        ref={stickyRef}
        className="sticky top-0 w-full h-screen min-h-[500px] flex items-center justify-center overflow-hidden bg-[#231E1B]"
      >
        {/* Background Poster Image (Foundation) */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${posterSource})` }}
        />

        {/* Background Video Layer - GSAP Scrub Controlled */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none w-full h-full">
          <video
            key={videoSource}
            ref={videoRef}
            src={videoSource}
            poster={posterSource}
            playsInline
            muted
            preload="auto"
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover object-center"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Hero Content Container */}
        <div 
          ref={textContentRef}
          className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 w-full pt-16 pb-20 flex flex-col justify-center items-center text-center will-change-[opacity,transform]"
        >
          <div className="space-y-6 md:space-y-7">
            
            {/* Eyebrow */}
            <p className="text-[#E5A93C] text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              {hero?.eyebrow || 'Bespoke Wardrobes · Est. 1987'}
            </p>

            {/* Large Headline */}
            <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-[96px] font-normal tracking-tight text-white leading-[1.04] sm:leading-[0.98] drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] whitespace-pre-line">
              {hero?.headline || 'Scroll to fit\nthe wardrobe'}
            </h1>

            {/* Subtitle */}
            <p className="text-white text-base sm:text-lg md:text-xl font-light leading-relaxed max-w-xl mx-auto pt-1 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] whitespace-pre-line">
              {hero?.subheadline || 'Hand-built cabinetry, book-matched veneer and brass that will outlive the house — fitted in five days.'}
            </p>

            {/* Action CTAs */}
            {(onSeeWorkClick || onBookClick) && (
              <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                {onSeeWorkClick && (
                  <button
                    onClick={onSeeWorkClick}
                    className="px-7 py-3 rounded-full bg-[#C4913A] hover:bg-[#d69f44] text-white font-medium text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-lg cursor-pointer"
                  >
                    Explore Collection
                  </button>
                )}
                {onBookClick && (
                  <button
                    onClick={onBookClick}
                    className="px-7 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/40 font-medium text-xs tracking-[0.2em] uppercase transition-all duration-300 backdrop-blur-md cursor-pointer"
                  >
                    Book Design Consultation
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Bottom SCROLL Indicator */}
        <div 
          ref={scrollIndicatorRef}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none will-change-[opacity,transform] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
        >
          <span className="text-[11px] uppercase tracking-[0.35em] text-white/70 font-light">
            Scroll
          </span>
          <div className="w-[1px] h-7 bg-[#C4913A]/90 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

