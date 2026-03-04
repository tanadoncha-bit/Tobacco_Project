import Link from "next/link"
import { MapPin, Phone, Mail } from "lucide-react"
import prisma from "@/utils/db"

export default async function Footer() {
  const settings = await prisma.storeSetting.findUnique({ where: { id: "global" } })

  const storeName = settings?.storeName || "Tobacco"
  const address   = settings?.address   || "123 ถนนสุขุมวิท กรุงเทพมหานคร 10110"
  const phone     = settings?.phone     || "02-123-4567"
  const email     = settings?.email     || "contact@tobacco.com"

  return (
    <footer className="bg-white border-t border-gray-200 pt-10 pb-6 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10">

          {/* ศูนย์ช่วยเหลือ */}
          <div>
            <h3 className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wider">ศูนย์ช่วยเหลือ</h3>
            <ul className="space-y-2 text-xs text-gray-500">
              <li><Link href="#" className="hover:text-[#2E4BB1]">Help Centre</Link></li>
              <li><Link href="#" className="hover:text-[#2E4BB1]">สั่งซื้อสินค้าอย่างไร</Link></li>
              <li><Link href="#" className="hover:text-[#2E4BB1]">ช่องทางการชำระเงิน</Link></li>
              <li><Link href="#" className="hover:text-[#2E4BB1]">การจัดส่งสินค้า</Link></li>
              <li><Link href="#" className="hover:text-[#2E4BB1]">การคืนเงินและคืนสินค้า</Link></li>
              <li><Link href="#" className="hover:text-[#2E4BB1]">ติดต่อ {storeName}</Link></li>
            </ul>
          </div>

          {/* เกี่ยวกับ */}
          <div>
            <h3 className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wider">เกี่ยวกับ {storeName}</h3>
            <ul className="space-y-2 text-xs text-gray-500">
              <li><Link href="/user/about" className="hover:text-[#2E4BB1]">เกี่ยวกับเรา</Link></li>
              <li><Link href="#" className="hover:text-[#2E4BB1]">ร่วมงานกับเรา</Link></li>
              <li><Link href="#" className="hover:text-[#2E4BB1]">นโยบายความเป็นส่วนตัว</Link></li>
              <li><Link href="#" className="hover:text-[#2E4BB1]">นโยบาย</Link></li>
              <li><Link href="#" className="hover:text-[#2E4BB1]">{storeName} Blog</Link></li>
            </ul>
          </div>

          {/* วิธีชำระเงิน + จัดส่ง — ซ่อนบน mobile เล็กสุด แสดงตั้งแต่ md */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wider">วิธีการชำระเงิน</h3>
            <div className="flex flex-wrap gap-2 mb-5">
              {[
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIO4Zr16aiL2HFOy4P0CQ9JVvRFE1XZLcYiQ&s",
                "https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg",
                "https://www.sequelonline.com/wp-content/uploads/2017/02/kbank-logo.jpg",
                "https://www.finnomena.com/wp-content/uploads/2016/10/promt-pay-logo.jpg",
              ].map((src, i) => (
                <div key={i} className="w-12 h-8 bg-gray-100 border rounded overflow-hidden">
                  <img src={src} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
            <h3 className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wider">บริการจัดส่ง</h3>
            <div className="flex flex-wrap gap-2">
              {[
                "https://ke-website-prod.s3.ap-southeast-1.amazonaws.com/wp-content/uploads/2023/03/30112043/logo-2-100.jpg",
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0yWDdNtf3pYkJ8GGq6QDBktQutN7yXh5Zeg&s",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Flash_Express_Logo.svg/1280px-Flash_Express_Logo.svg.png",
              ].map((src, i) => (
                <div key={i} className="w-12 h-8 bg-gray-100 border rounded overflow-hidden">
                  <img src={src} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          </div>

          {/* ติดต่อเรา */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wider">ติดต่อเรา</h3>
            <ul className="space-y-3 text-xs text-gray-500">
              <li className="flex gap-2 items-start">
                <MapPin size={14} className="text-[#2E4BB1] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{address}</span>
              </li>
              <li className="flex gap-2 items-center">
                <Phone size={14} className="text-[#2E4BB1] shrink-0" />
                <span>{phone}</span>
              </li>
              <li className="flex gap-2 items-center">
                <Mail size={14} className="text-[#2E4BB1] shrink-0" />
                <span className="break-all">{email}</span>
              </li>
            </ul>
          </div>

          {/* ดาวน์โหลดแอป */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wider">ดาวน์โหลดแอป</h3>
            <div className="flex gap-3 items-center">
              <div className="w-16 h-16 shrink-0 bg-gray-100 border rounded overflow-hidden">
                <img src="https://res.cloudinary.com/djda6blnw/image/upload/v1771863674/qrcode_313405556_4c31d31ccf57d4addd5eee5bf7634566_pfu7q4.png"
                  className="w-full h-full object-contain" alt="QR Code" />
              </div>
              <div className="flex flex-col gap-1.5">
                {["App Store", "Google Play", "AppGallery"].map(label => (
                  <div key={label} className="px-3 h-7 bg-gray-100 border rounded flex items-center justify-center text-[10px] font-bold text-gray-600">
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="border-t border-gray-200 pt-5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} {storeName}. All Rights Reserved.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <span>Country & Region:</span>
            <Link href="#" className="hover:text-[#2E4BB1] border-r pr-2">ไทย</Link>
            <Link href="#" className="hover:text-[#2E4BB1]">สิงคโปร์</Link>
          </div>
        </div>

      </div>
    </footer>
  )
}