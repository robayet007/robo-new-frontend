"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"
import { bannerApi } from "./services/api"
import type { BackendBanner } from "./types"
import { getImageUrl } from "./utils/imageUrl"

interface Slide {
  id: string
  title: string
  subtitle: string
  buttonText: string
  image: string
  link?: string
}

type Direction = "next" | "prev"

export default function GameHero() {
  const navigate = useNavigate()
  const [activeSlide, setActiveSlide] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<Direction>("next")
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 640)
      setIsTablet(window.innerWidth < 1024)
    }
    checkSize()
    window.addEventListener("resize", checkSize)
    return () => window.removeEventListener("resize", checkSize)
  }, [])

  // কন্টেইনারের width ট্র্যাক করার জন্য
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    const loadBanners = async () => {
      try {
        setLoading(true)
        const response = await bannerApi.getAll()
        if (response.success && response.data) {
          const bannerSlides: Slide[] = response.data.map((banner: BackendBanner) => ({
            id: banner.id,
            title: banner.title || "",
            subtitle: banner.subtitle || "",
            buttonText: banner.buttonText || "",
            image: banner.image,
            link: banner.link,
          }))
          setSlides(bannerSlides)
        } else {
          setSlides([])
        }
      } catch (error) {
        console.error("Failed to load banners:", error)
        setSlides([])
      } finally {
        setLoading(false)
      }
    }
    loadBanners()
  }, [])

  const goTo = useCallback(
    (index: number, dir: Direction) => {
      if (animating || slides.length <= 1) return
      setDirection(dir)
      setAnimating(true)
      setActiveSlide(index)
      setTimeout(() => setAnimating(false), 500)
    },
    [animating, slides.length]
  )

  const goNext = useCallback(() => {
    const next = (activeSlide + 1) % slides.length
    goTo(next, "next")
  }, [activeSlide, slides.length, goTo])

  const goPrev = useCallback(() => {
    const prev = (activeSlide - 1 + slides.length) % slides.length
    goTo(prev, "prev")
  }, [activeSlide, slides.length, goTo])

  useEffect(() => {
    if (slides.length <= 1) return
    const interval = setInterval(goNext, 5000)
    return () => clearInterval(interval)
  }, [slides.length, goNext])

  useEffect(() => {
    if (slides.length > 0 && activeSlide >= slides.length) {
      setActiveSlide(0)
    }
  }, [slides.length, activeSlide])

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    maxWidth: "1380px",
    margin: "0 auto",
    overflow: "hidden",
    borderRadius: "8px",
    minHeight: isMobile ? "150px" : "200px",
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
    background: "linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))",
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

  if (loading) {
    return (
      <div style={containerStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "280px",
            backgroundColor: "#000",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid var(--theme-primary)",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          ></div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (slides.length === 0) return null

  const currentSlide = slides[activeSlide] || slides[0]
  if (!currentSlide) return null

  const handleBannerClick = (slide: Slide) => {
    const link = slide.link?.trim()
    if (!link) return
    if (link.startsWith("http://") || link.startsWith("https://")) {
      window.open(link, "_blank", "noopener,noreferrer")
    } else if (link.startsWith("/")) {
      navigate(link)
    } else {
      window.location.href = link
    }
  }

  const animClass =
    direction === "next"
      ? animating
        ? "slide-enter-next"
        : "slide-active"
      : animating
      ? "slide-enter-prev"
      : "slide-active"

  // ইমেজের জন্য CSS স্টাইল - এটাই মূল সমাধান
  const imageStyle: React.CSSProperties = {
    width: "100%",
    height: isMobile ? "auto" : "100%",
    display: "block",
    objectFit: "contain", // ইমেজ পুরো দেখা যাবে, crop হবে না
    objectPosition: "center", // সেন্টার পজিশন
    filter: "brightness(1.18) saturate(1.1)",
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        @keyframes slideInFromRight {
          from { transform: translateX(6%); opacity: 0; }
          to   { transform: translateX(0);  opacity: 1; }
        }
        @keyframes slideInFromLeft {
          from { transform: translateX(-6%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }

        .slide-enter-next {
          animation: slideInFromRight 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .slide-enter-prev {
          animation: slideInFromLeft 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .slide-active { opacity: 1; }

        .carousel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.25);
          color: white;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
          backdrop-filter: blur(4px);
        }
        .carousel-arrow:hover {
          background: rgba(0,0,0,0.65);
          transform: translateY(-50%) scale(1.08);
        }
        .carousel-arrow-left  { left: 12px; }
        .carousel-arrow-right { right: 12px; }

        .carousel-dot {
          border: none;
          cursor: pointer;
          border-radius: 2px;
          transition: all 0.3s ease;
        }
      `}</style>

      <div ref={containerRef} style={containerStyle}>
        <div
          key={activeSlide}
          className={animClass}
          style={{
            position: "relative",
            width: "100%",
            // Use fixed aspect ratios per breakpoint to avoid extra blank area on mobile.
            aspectRatio: isMobile ? undefined : isTablet ? "16 / 7.2" : "16 / 6.4",
            height: containerWidth && !isMobile ? `${containerWidth * 0.4}px` : "auto",
            minHeight: isMobile ? "0" : "260px",
            maxHeight: isMobile ? "none" : "600px",
            backgroundColor: "#000",
            cursor: currentSlide.link?.trim() ? "pointer" : "default",
          }}
          onClick={() => handleBannerClick(currentSlide)}
        >
          {/* ইমেজ */}
          <img
            src={getImageUrl(currentSlide.image)}
            alt=""
            style={imageStyle}
            onError={(e) => {
              // ইমেজ লোড হতে সমস্যা হলে ফallback
              e.currentTarget.src = "/placeholder-image.jpg" // আপনার placeholder ইমেজের path দিন
            }}
          />
          
          {/* Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to right, rgba(0,0,0,0.28), rgba(0,0,0,0.06))",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />

          {/* Content */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: isMobile ? "16px" : "32px",
              maxWidth: isTablet ? "70%" : "60%",
              pointerEvents: "none",
              color: "white",
              zIndex: 2,
            }}
          >
            <h1 style={titleStyle}>{currentSlide.title}</h1>
            {currentSlide.subtitle && <p style={subtitleStyle}>{currentSlide.subtitle}</p>}
            {currentSlide.buttonText && (
              <button
                type="button"
                style={{ ...buttonStyle, pointerEvents: "auto" }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleBannerClick(currentSlide)
                }}
              >
                {currentSlide.buttonText}
              </button>
            )}
          </div>
        </div>

        {/* Left arrow */}
        {slides.length > 1 && (
          <button
            type="button"
            className="carousel-arrow carousel-arrow-left"
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
            aria-label="Previous banner"
          >
            <FaChevronLeft size={13} />
          </button>
        )}

        {/* Right arrow */}
        {slides.length > 1 && (
          <button
            type="button"
            className="carousel-arrow carousel-arrow-right"
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
            aria-label="Next banner"
          >
            <FaChevronRight size={13} />
          </button>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: "14px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "10px",
              zIndex: 4,
            }}
          >
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                className="carousel-dot"
                style={{
                  width: index === activeSlide ? "28px" : "8px",
                  height: "4px",
                  backgroundColor: index === activeSlide ? "var(--theme-primary)" : "rgba(255,255,255,0.5)",
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  goTo(index, index > activeSlide ? "next" : "prev")
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}