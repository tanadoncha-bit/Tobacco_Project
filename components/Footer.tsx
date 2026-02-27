import Link from "next/link"
import { MapPin, Phone, Mail } from "lucide-react"
import prisma from "@/utils/db"

export default async function Footer() {

    const settings = await prisma.storeSetting.findUnique({
        where: { id: "global" }
    })

    // ใช้ค่าจาก DB แต่ถ้ายังไม่มีข้อมูลใน DB ให้ใช้ค่าเริ่มต้น (Fallback)
    const storeName = settings?.storeName || "Tobacco"
    const address = settings?.address || "123 ถนนสุขุมวิท กรุงเทพมหานคร 10110"
    const phone = settings?.phone || "02-123-4567"
    const email = settings?.email || "contact@tobacco.com"

    return (
        <footer className="bg-white border-t border-gray-200 pt-10 pb-6 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">

                    {/* คอลัมน์ 1: ศูนย์ช่วยเหลือ */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">ศูนย์ช่วยเหลือ</h3>
                        <ul className="space-y-2 text-xs text-gray-500">
                            <li><Link href="#" className="hover:text-[#2E4BB1]">Help Centre</Link></li>
                            <li><Link href="#" className="hover:text-[#2E4BB1]">สั่งซื้อสินค้าอย่างไร</Link></li>
                            <li><Link href="#" className="hover:text-[#2E4BB1]">เริ่มขายสินค้าอย่างไร</Link></li>
                            <li><Link href="#" className="hover:text-[#2E4BB1]">ช่องทางการชำระเงินใน Tobacco</Link></li>
                            <li><Link href="#" className="hover:text-[#2E4BB1]">Tobacco Coins</Link></li>
                            <li><Link href="#" className="hover:text-[#2E4BB1]">การจัดส่งสินค้า</Link></li>
                            <li><Link href="#" className="hover:text-[#2E4BB1]">การคืนเงินและคืนสินค้า</Link></li>
                            <li><Link href="#" className="hover:text-[#2E4BB1]">การันตีโดย Tobacco คืออะไร?</Link></li>
                            <li><Link href="#" className="hover:text-[#2E4BB1]">ติดต่อ Tobacco</Link></li>
                        </ul>
                    </div>

                    {/* คอลัมน์ 2: เกี่ยวกับ TOBACCO */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">เกี่ยวกับ {storeName}</h3>
                        <ul className="space-y-2 text-xs text-gray-500">
                            <li><Link href="#" className="hover:text-[#2E4BB1]">เกี่ยวกับเรา</Link></li>
                            <li><Link href="#" className="hover:text-[#2E4BB1]">โปรแกรม Affiliate</Link></li>
                            <li><Link href="#" className="hover:text-[#2E4BB1]">ร่วมงานกับเรา</Link></li>
                            <li><Link href="#" className="hover:text-[#2E4BB1]">นโยบาย</Link></li>
                            <li><Link href="#" className="hover:text-[#2E4BB1]">นโยบายความเป็นส่วนตัว</Link></li>
                            <li><Link href="#" className="hover:text-[#2E4BB1]">Tobacco Blog</Link></li>
                            <li><Link href="#" className="hover:text-[#2E4BB1]">Tobacco Mall</Link></li>
                        </ul>
                    </div>

                    {/* คอลัมน์ 3: วิธีการชำระเงิน & จัดส่ง */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">วิธีการชำระเงิน</h3>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {/* ตรงนี้แนะนำให้เอารูปโลโก้จริงๆ มาใส่ในโฟลเดอร์ public นะครับ อันนี้ผมทำกล่องจำลองไว้ให้ก่อน */}
                            <div className="w-12 h-8 bg-gray-100 border rounded flex items-center justify-center text-[10px] font-bold text-gray-400">
                                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIO4Zr16aiL2HFOy4P0CQ9JVvRFE1XZLcYiQ&s" className="w-12 h-8 object-contain" />
                            </div>
                            <div className="w-12 h-8 bg-gray-100 border rounded flex items-center justify-center text-[10px] font-bold text-gray-400">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg" className="w-12 h-8 object-contain" />
                            </div>
                            <div className="w-12 h-8 bg-gray-100 border rounded flex items-center justify-center text-[10px] font-bold text-gray-400">
                                <img src="https://www.sequelonline.com/wp-content/uploads/2017/02/kbank-logo.jpg" className="w-12 h-8 object-contain" />
                            </div>
                            <div className="w-12 h-8 bg-gray-100 border rounded flex items-center justify-center text-[10px] font-bold text-gray-400">
                                <img src="https://www.finnomena.com/wp-content/uploads/2016/10/promt-pay-logo.jpg" className="w-12 h-8 object-contain" />
                            </div>
                        </div>

                        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">บริการจัดส่ง</h3>
                        <div className="flex flex-wrap gap-2">
                            <div className="w-12 h-8 bg-gray-100 border rounded flex items-center justify-center text-[10px] font-bold text-gray-400">
                                <img src="https://ke-website-prod.s3.ap-southeast-1.amazonaws.com/wp-content/uploads/2023/03/30112043/logo-2-100.jpg" className="w-full h-full object-contain" />
                            </div>
                            <div className="w-12 h-8 bg-gray-100 border rounded flex items-center justify-center text-[10px] font-bold text-gray-400">
                                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0yWDdNtf3pYkJ8GGq6QDBktQutN7yXh5Zeg&s" className="w-full h-full object-contain" />
                            </div>
                            <div className="w-12 h-8 bg-gray-100 border rounded flex items-center justify-center text-[10px] font-bold text-gray-400">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Flash_Express_Logo.svg/1280px-Flash_Express_Logo.svg.png" className="w-full h-full object-contain" />
                            </div>
                        </div>
                    </div>

                    {/* คอลัมน์ 4: ติดตามเรา */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">ติดต่อเรา</h3>
                        <ul className="space-y-4 text-xs text-gray-500">
                            <li className="flex gap-3 items-start">
                                <MapPin size={16} className="text-[#2E4BB1] shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{address}</span>
                            </li>
                            <li className="flex gap-3 items-center">
                                <Phone size={16} className="text-[#2E4BB1] shrink-0" />
                                <span>{phone}</span>
                            </li>
                            <li className="flex gap-3 items-center">
                                <Mail size={16} className="text-[#2E4BB1] shrink-0" />
                                <span>{email}</span>
                            </li>
                        </ul>
                    </div>

                    {/* คอลัมน์ 5: ดาวน์โหลดแอป */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase">ดาวน์โหลดแอปพลิเคชั่น</h3>
                        <div className="flex gap-3 items-center">
                            {/* QR Code จำลอง */}
                            <div className="w-20 h-20 bg-gray-100 border border-gray-300 rounded shadow-sm flex items-center justify-center text-xs text-gray-400 text-center p-1">
                                <img src="https://res.cloudinary.com/djda6blnw/image/upload/v1771863674/qrcode_313405556_4c31d31ccf57d4addd5eee5bf7634566_pfu7q4.png" className="w-full h-full object-contain" alt="QR Code" />
                            </div>
                            {/* ปุ่ม App Store จำลอง */}
                            <div className="flex flex-col gap-2">
                                <div className="w-24 h-7 bg-gray-100 border rounded flex items-center justify-center text-[10px] font-bold text-gray-600">App Store</div>
                                <div className="w-24 h-7 bg-gray-100 border rounded flex items-center justify-center text-[10px] font-bold text-gray-600">Google Play</div>
                                <div className="w-24 h-7 bg-gray-100 border rounded flex items-center justify-center text-[10px] font-bold text-gray-600">AppGallery</div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ลิขสิทธิ์และประเทศ: เปลี่ยนชื่อร้านให้เป็น Dynamic ด้วย */}
                <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
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