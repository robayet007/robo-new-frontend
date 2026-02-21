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
      fontFamily: "var(--theme-font-family), sans-serif",
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
    termsSection: {
      backgroundColor: 'white',
      borderRadius: '18px',
      padding: isMobile ? '18px' : '26px',
      marginTop: isMobile ? '16px' : '24px',
      boxShadow: '0 12px 30px rgba(15,23,42,0.08)',
      border: '1px solid rgba(148,163,184,0.25)',
    },
    termsTitle: {
      fontSize: isMobile ? '1.25rem' : isTablet ? '1.5rem' : '1.75rem',
      color: '#0f172a',
      margin: '0 0 10px 0',
      fontWeight: 800,
    },
    termsSubtitle: {
      fontSize: isMobile ? '0.9rem' : '1rem',
      color: '#64748b',
      margin: '0 0 16px 0',
    },
    termsList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: isMobile ? '8px' : '10px',
    },
    termItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      fontSize: isMobile ? '0.9rem' : '1rem',
      color: '#1f2933',
    },
    termBullet: {
      marginTop: '3px',
    },
    termText: {
      lineHeight: 1.5,
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
              src="https://www.youtube.com/embed/Tv1KYfGJP9s"
              title="পানির দামে FIRE FIRE top up"
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
                <h3 style={styles.videoTitle}>পানির দামে FIRE FIRE top up</h3>
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
            href="https://www.youtube.com/watch?v=Tv1KYfGJP9s" 
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

      {/* Terms & Conditions Section */}
      <div style={styles.termsSection}>
        <h2 style={styles.termsTitle}>টার্মস & নিয়মাবলী</h2>
        <p style={styles.termsSubtitle}>
          আমাদের সার্ভিস ব্যবহার করার আগে নিচের নিয়মগুলো ভালোভাবে পড়ে নিন।
        </p>
        <ul style={styles.termsList}>
          <li style={styles.termItem}>
            <span style={styles.termBullet}>✅</span>
            <span style={styles.termText}>
              <strong>১৮ বছরের নিচে কেউ টপ আপ করবে না:</strong> ১৮ বছরের কম বয়সী ব্যবহারকারীরা অভিভাবকের অনুমতি ছাড়া কোনো ধরনের
              পেমেন্ট বা টপ আপ করতে পারবে না।
            </span>
          </li>
          <li style={styles.termItem}>
            <span style={styles.termBullet}>✅</span>
            <span style={styles.termText}>
              <strong>UID / প্লেয়ার আইডি ভুল দিলে দায় আমাদের নয়:</strong> আপনি যদি ভুল Free Fire UID / প্লেয়ার আইডি দেন এবং
              ডায়মন্ড অন্য কারও আইডিতে চলে যায়, সে ক্ষেত্রে <strong>কোনো রিফান্ড বা পরিবর্তন</strong> দেওয়া সম্ভব হবে না।
            </span>
          </li>
        </ul>
      </div>

    </section>
  );
};

export default Niyom;