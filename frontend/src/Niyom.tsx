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
      backgroundColor: '#f8f9fa',
      padding: isMobile ? '20px 10px' : isTablet ? '40px 15px' : '60px 20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      maxWidth: '1200px',
      margin: '0 auto',
    },
    tutorialSection: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: isMobile ? '20px' : isTablet ? '30px' : '40px',
      marginBottom: isMobile ? '30px' : '60px',
      boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '30px',
    },
    icon: {
      fontSize: isMobile ? '1.5rem' : '2rem',
      marginRight: '15px',
    },
    sectionTitle: {
      fontSize: isMobile ? '1.3rem' : isTablet ? '1.6rem' : '2rem',
      color: '#2c3e50',
      margin: 0,
    },
    videoWrapper: {
      marginBottom: '30px',
    },
    videoContainer: {
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
      marginBottom: '20px',
    },
    videoFrame: {
      border: 'none',
      display: 'block',
      height: isMobile ? '200px' : isTablet ? '300px' : '400px',
    },
    videoInfo: {
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      padding: isMobile ? '15px' : '20px',
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
      fontSize: isMobile ? '1rem' : '1.3rem',
      color: '#2c3e50',
      margin: '0 0 5px 0',
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