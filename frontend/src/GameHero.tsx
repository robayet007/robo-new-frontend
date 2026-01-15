"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { bannerApi } from "./services/api"
import type { BackendBanner } from "./types"

interface Slide {
  id: string
  title: string
  subtitle: string
  buttonText: string
  image: string
  link?: string
}

export default function GameHero() {
  const navigate = useNavigate()
  const [activeSlide, setActiveSlide] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 640)
      setIsTablet(window.innerWidth < 1024)
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  useEffect(() => {
    const loadBanners = async () => {
      try {
        setLoading(true)
        const response = await bannerApi.getAll()
        if (response.success && response.data) {
          const bannerSlides: Slide[] = response.data.map((banner: BackendBanner) => ({
            id: banner.id,
            title: banner.title || '',
            subtitle: banner.subtitle || '',
            buttonText: banner.buttonText || '',
            image: banner.image,
            link: banner.link
          }))
          // Debug: Log banners with links
          if (import.meta.env.DEV) {
            // console.log('Banners loaded:', bannerSlides.map(s => ({ id: s.id, title: s.title, link: s.link })))
          }
          setSlides(bannerSlides)
        } else {
          // Fallback to empty array if API fails
          setSlides([])
        }
      } catch (error) {
        console.error('Failed to load banners:', error)
        setSlides([])
      } finally {
        setLoading(false)
      }
    }
    loadBanners()
  }, [])

  useEffect(() => {
    if (slides.length <= 1) return
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [slides.length])

  // Ensure activeSlide is within bounds
  useEffect(() => {
    if (slides.length > 0 && activeSlide >= slides.length) {
      setActiveSlide(0)
    }
  }, [slides.length, activeSlide])

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    maxWidth: "1200px",
    // YouTube image aspect ratio (16:9) এর জন্য aspect ratio maintain করা হয়েছে
    aspectRatio: "16 / 9",
    margin: "0 auto",
    overflow: "hidden",
    borderRadius: "8px",
  }

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // আগে অনেক ডার্ক ছিল, এখন লাইট করেছি যাতে ছবি বেশি ব্রাইট দেখা যায়
    background: "linear-gradient(to right, rgba(0,0,0,0.28), rgba(0,0,0,0.06))",
    zIndex: 1,
    pointerEvents: "none", // Allow clicks to pass through overlay
  }

  const contentStyle: React.CSSProperties = {
    position: "relative",
    zIndex: 2,
    color: "white",
    animation: "fadeIn 0.6s ease-in",
  }

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? "24px" : isTablet ? "40px" : "64px",
    fontWeight: "bold",
    margin: "0 0 8px 0",
    textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: isMobile ? "12px" : isTablet ? "16px" : "20px",
    margin: "0 0 20px 0",
    color: "#e0e0e0",
    textShadow: "1px 1px 4px rgba(0,0,0,0.8)",
  }

  const buttonStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #a855f7, #8b5cf6)",
    color: "white",
    border: "none",
    padding: "15px 35px",
    fontSize: "16px",
    fontWeight: "bold",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    width: "fit-content",
    letterSpacing: "1px",
    boxShadow: "0 4px 15px rgba(168, 85, 247, 0.4)",
  }

  const dotsContainerStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "30px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "12px",
    zIndex: 3,
  }

  const dotStyle = (isActive: boolean): React.CSSProperties => ({
    width: isActive ? "30px" : "10px",
    height: "4px",
    backgroundColor: isActive ? "#a855f7" : "#666",
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
    borderRadius: "2px",
  })

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          backgroundColor: '#000'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #8b5cf6',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (slides.length === 0) {
    return null
  }

  // Get current slide safely
  const currentSlide = slides[activeSlide] || slides[0]
  if (!currentSlide) {
    return null
  }

  const slideStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    backgroundImage: `url(${currentSlide.image})`,
    // পুরো ইমেজ দেখানোর জন্য cover ব্যবহার করা হয়েছে যাতে container fill হয়
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
    backgroundColor: "#000",
    // ইমেজকে একটু উজ্জ্বল/সেটুরেটেড করা
    filter: "brightness(1.18) saturate(1.1)",
    transition: "background-image 0.5s ease-in-out",
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div style={containerStyle}>
        <div 
          style={{
            ...slideStyle,
            cursor: currentSlide.link?.trim() ? 'pointer' : 'default'
          }} 
          key={activeSlide}
          onClick={() => {
            const link = currentSlide.link?.trim()
            if (!link) {
              if (import.meta.env.DEV) {
                // console.log('Banner clicked but no link set', { slide: currentSlide })
              }
              return
            }
            
            if (import.meta.env.DEV) {
              // console.log('Banner clicked, redirecting to:', link)
            }
            
            // Handle external URLs
            if (link.startsWith('http://') || link.startsWith('https://')) {
              window.open(link, '_blank', 'noopener,noreferrer');
            } 
            // Handle internal routes
            else if (link.startsWith('/')) {
              navigate(link);
            }
            // Fallback for any other format
            else {
              window.location.href = link;
            }
          }}
        >
          <div style={overlayStyle} />

          <div
            style={{
              ...contentStyle,
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: isMobile ? "16px" : "32px",
              maxWidth: isTablet ? "70%" : "60%",
              pointerEvents: "none", // Allow clicks to pass through, except for button
            }}
          >
            <h1 style={titleStyle}>{currentSlide.title}</h1>
            {currentSlide.subtitle && (
              <p style={subtitleStyle}>{currentSlide.subtitle}</p>
            )}
            {currentSlide.buttonText && (
              <button
                type="button"
                style={{
                  ...buttonStyle,
                  pointerEvents: "auto", // Button should be clickable
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  const link = currentSlide.link?.trim()
                  if (!link) {
                    if (import.meta.env.DEV) {
                      // console.log('Button clicked but no link set')
                    }
                    return
                  }
                  
                  if (import.meta.env.DEV) {
                    // console.log('Button clicked, redirecting to:', link)
                  }
                  
                  // Handle external URLs
                  if (link.startsWith('http://') || link.startsWith('https://')) {
                    window.open(link, '_blank', 'noopener,noreferrer');
                  } 
                  // Handle internal routes
                  else if (link.startsWith('/')) {
                    navigate(link);
                  }
                  // Fallback for any other format
                  else {
                    window.location.href = link;
                  }
                }}
              >
                {currentSlide.buttonText}
              </button>
            )}
          </div>

          {slides.length > 1 && (
            <div style={dotsContainerStyle}>
              {slides.map((_, index) => (
                <button
                  key={index}
                  style={dotStyle(index === activeSlide)}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent banner click when clicking dots
                    setActiveSlide(index)
                  }}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
