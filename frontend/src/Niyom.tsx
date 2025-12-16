import React, { useState, useEffect } from 'react';
import { FaYoutube, FaPlayCircle } from 'react-icons/fa';

const Niyom: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth < 1024);
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);
  // Dynamic styles based on screen size
  const styles = {
    section: {
      background: 'radial-gradient(circle at top left, #eef2ff 0, #f9fafb 40%, #ffffff 100%)',
      padding: isMobile ? '20px 10px' : isTablet ? '36px 16px' : '48px 24px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      maxWidth: '1200px',
      margin: '0 auto',
    },
    tutorialSection: {
      backgroundColor: 'white',
      borderRadius: '18px',
      padding: isMobile ? '18px' : isTablet ? '26px' : '32px',
      marginBottom: isMobile ? '28px' : '44px',
      boxShadow: '0 18px 45px rgba(15,23,42,0.12)',
      border: '1px solid rgba(148,163,184,0.25)',
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: isMobile ? '18px' : '24px',
    },
    icon: {
      fontSize: isMobile ? '1.5rem' : '2rem',
      marginRight: '15px',
    },
    sectionTitle: {
      fontSize: isMobile ? '1.35rem' : isTablet ? '1.7rem' : '2rem',
      color: '#0f172a',
      margin: 0,
      fontWeight: 800,
    },
    videoWrapper: {
      marginBottom: isMobile ? '22px' : '28px',
    },
    videoContainer: {
      position: 'relative' as const,
      width: '100%',
      // 16:9 aspect ratio container so video always fits nicely on all screens
      paddingTop: '56.25%',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 16px 40px rgba(15,23,42,0.35)',
      marginBottom: isMobile ? '16px' : '20px',
      backgroundColor: '#000',
    },
    videoFrame: {
      border: 'none',
      display: 'block',
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },
    videoInfo: {
      backgroundColor: '#f9fafb',
      borderRadius: '14px',
      padding: isMobile ? '14px' : '18px',
      border: '1px solid rgba(148,163,184,0.35)',
    },
    videoMeta: {
      display: 'flex',
      alignItems: 'flex-start',
      marginBottom: '15px',
    },
    playIcon: {
      fontSize: '1.5rem',
      color: '#FF0000',
      marginRight: '15px',
      marginTop: '3px',
    },
    videoTitle: {
      fontSize: isMobile ? '1.05rem' : '1.25rem',
      color: '#111827',
      margin: '0 0 5px 0',
      fontWeight: 700,
    },
    videoDescription: {
      color: '#7f8c8d',
      margin: 0,
      lineHeight: '1.5',
      fontSize: isMobile ? '0.85rem' : '1rem',
    },
    videoStats: {
      display: 'flex',
      gap: '20px',
      flexWrap: 'wrap' as const,
    },
    stat: {
      backgroundColor: 'white',
      padding: '5px 12px',
      borderRadius: '20px',
      fontSize: isMobile ? '0.8rem' : '0.9rem',
      color: '#666',
    },
    youtubeActions: {
      display: 'flex',
      gap: '15px',
      flexWrap: 'wrap' as const,
      justifyContent: 'center',
      marginTop: isMobile ? '6px' : '10px',
    },
    youtubeButton: {
      display: 'inline-flex',
      alignItems: 'center',
      backgroundColor: '#FF0000',
      color: 'white',
      padding: isMobile ? '10px 20px' : '12px 25px',
      borderRadius: '50px',
      textDecoration: 'none',
      fontWeight: '600',
      fontSize: isMobile ? '0.9rem' : '1rem',
      transition: 'all 0.3s ease',
    },
    subscribeButton: {
      display: 'inline-flex',
      alignItems: 'center',
      backgroundColor: '#282828',
      color: 'white',
      padding: isMobile ? '10px 20px' : '12px 25px',
      borderRadius: '50px',
      textDecoration: 'none',
      fontWeight: '600',
      fontSize: isMobile ? '0.9rem' : '1rem',
      transition: 'all 0.3s ease',
    },
    buttonIcon: {
      marginRight: '10px',
      fontSize: '1.2rem',
    },
  };

  return (
    <section className="section steps" style={styles.section}>
      {/* YouTube Tutorial Section - FIXED */}
      <div style={styles.tutorialSection}>
        <div style={styles.sectionHeader}>
          <FaYoutube style={{...styles.icon, color: '#FF0000'}} />
          <h2 style={styles.sectionTitle}>ভিডিও টিউটোরিয়াল দেখুন</h2>
        </div>
        
        <div style={styles.videoWrapper}>
          {/* YouTube Video Embed - CORRECTED URL */}
          <div style={styles.videoContainer}>
            <iframe
              width="100%"
              height={isMobile ? '200px' : isTablet ? '300px' : '400px'}
              src="https://www.youtube.com/embed/PKwrT7gIxjk"
              title="কম দামে FREE FIRE DIAMOND TOP UP 🥶🔥🔥🔥"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              style={styles.videoFrame}
              loading="lazy"
            ></iframe>
          </div>
          
          <div style={styles.videoInfo}>
            <div style={styles.videoMeta}>
              <FaPlayCircle style={styles.playIcon} />
              <div>
                <h3 style={styles.videoTitle}>কম দামে FREE FIRE DIAMOND TOP UP</h3>
                <p style={styles.videoDescription}>
                  Free Fire ডায়মন্ড খুব কম দামে টপ আপ করুন। সম্পূর্ণ টিউটোরিয়াল দেখুন।
                </p>
              </div>
            </div>
            
            <div style={styles.videoStats}>
              <span style={styles.stat}>⏱️ টিউটোরিয়াল</span>
              <span style={styles.stat}>👁️ নতুন ভিডিও</span>
              <span style={styles.stat}>🔥 হট ডিল</span>
            </div>
          </div>
        </div>
        
        <div style={styles.youtubeActions}>
          <a 
            href="https://www.youtube.com/watch?v=PKwrT7gIxjk" 
            target="_blank" 
            rel="noopener noreferrer"
            style={styles.youtubeButton}
          >
            <FaYoutube style={styles.buttonIcon} />
            YouTube-এ দেখুন
          </a>
          
          <a 
            href="https://www.youtube.com/@username"
            target="_blank" 
            rel="noopener noreferrer"
            style={styles.subscribeButton}
          >
            <FaYoutube style={styles.buttonIcon} />
            চ্যানেলে সাবস্ক্রাইব করুন
          </a>
        </div>
      </div>

    </section>
  );
};

export default Niyom;