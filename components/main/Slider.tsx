"use client"

import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination, Autoplay } from "swiper/modules"

import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"

export default function HeroSlider({ banners }: any) {
  return (
    <div className="w-full max-w-6xl mx-auto mt-10">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000 }}
        loop
        className="rounded-xl"
      >
        {banners.map((banner: any) => (
          <SwiperSlide key={banner.id}>
            <img
              src={banner.imageUrl}
              className="h-64 w-full object-cover rounded-xl"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
