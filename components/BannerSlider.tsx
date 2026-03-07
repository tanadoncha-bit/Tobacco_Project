"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Banner = {
  id: string
  imageUrl: string
}

export default function BannerSlider({ banners }: { banners: Banner[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1))
    }, 5000)
    return () => clearInterval(timer)
  }, [banners.length])

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1))
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1))
  }

  if (banners.length === 0) {
    return (
      <div className="bg-gradient-to-r from-[#2E4BB1] to-[#8E63CE] text-white py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">ยินดีต้อนรับสู่ร้านของเรา</h1>
        <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
          ค้นหาสินค้าคุณภาพดี ราคาโดนใจ พร้อมจัดส่งถึงหน้าบ้านคุณ
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden group aspect-[16/6] md:aspect-[16/5] lg:aspect-[16/4]">
      <div 
        className="flex transition-transform duration-700 ease-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner) => (
          <div key={banner.id} className="min-w-full h-full relative">
            <img
              src={banner.imageUrl}
              alt="Banner"
              className="w-full h-full object-contain md:object-cover"
            />
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute top-1/2 left-4 -translate-y-1/2 p-2 rounded-full bg-white/30 text-white hover:bg-white/50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute top-1/2 right-4 -translate-y-1/2 p-2 rounded-full bg-white/30 text-white hover:bg-white/50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                  currentIndex === index ? "bg-white w-6" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}