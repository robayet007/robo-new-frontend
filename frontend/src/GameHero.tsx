"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface Slide {
  id: number
  title: string
  subtitle: string
  buttonText: string
  image: string
}

export default function GameHero() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 640)
      setIsTablet(window.innerWidth < 1024)
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  const slides: Slide[] = [
    {
      id: 1,
      title: "Free Fire",
      subtitle: "Survive the ultimate 50-player battle royale",
      buttonText: "",
      image: "https://dl.dir.freefiremobile.com/common/web_event/official2.ff.garena.all/202210/aa959aa3d8790d3a44f7f20f16adfa01.jpg",
    },
    {
      id: 2,
      title: "Free Fire MAX",
      subtitle: "Experience enhanced graphics and immersive gameplay",
      buttonText: "",
     image: "https://dl.dir.freefiremobile.com/common/web_event/official2.ff.garena.all/202210/aa959aa3d8790d3a44f7f20f16adfa01.jpg",
    },
    {
      id: 3,
      title: "New Season",
      subtitle: "Unlock exclusive rewards and premium characters",
      buttonText: "",
            image: "https://dl.dir.freefiremobile.com/common/web_event/official2.ff.garena.all/202210/aa959aa3d8790d3a44f7f20f16adfa01.jpg",

    },
    {
      id: 4,
      title: "Squad Up",
      subtitle: "Team up with friends and dominate the battlefield",
      buttonText: "",
           image: "https://dl.dir.freefiremobile.com/common/web_event/official2.ff.garena.all/202210/aa959aa3d8790d3a44f7f20f16adfa01.jpg",

    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [slides.length])

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    maxWidth: "1200px",
    height: isMobile ? "250px" : isTablet ? "350px" : "500px",
    margin: "0 auto",
    overflow: "hidden",
    borderRadius: "8px",
  }

  const slideStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    backgroundImage: `url(${slides[activeSlide].image})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: isMobile ? "0 20px" : isTablet ? "0 40px" : "0 60px",
    transition: "background-image 0.5s ease-in-out",
  }

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.2))",
    zIndex: 1,
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
    backgroundColor: "#00bcd4",
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
    backgroundColor: isActive ? "#00bcd4" : "#666",
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
    borderRadius: "2px",
  })

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
        <div style={slideStyle} key={activeSlide}>
          <div style={overlayStyle} />
          <div style={contentStyle}>
            <h1 style={titleStyle}>{slides[activeSlide].title}</h1>
            <p style={subtitleStyle}>{slides[activeSlide].subtitle}</p>
            <button
              style={buttonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#0097a7"
                e.currentTarget.style.transform = "scale(1.05)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#00bcd4"
                e.currentTarget.style.transform = "scale(1)"
              }}
            >
              {slides[activeSlide].buttonText}
            </button>
          </div>

          <div style={dotsContainerStyle}>
            {slides.map((_, index) => (
              <button
                key={index}
                style={dotStyle(index === activeSlide)}
                onClick={() => setActiveSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
