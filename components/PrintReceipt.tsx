"use client"

import { useRef } from "react"

type OrderItem = {
    id: string
    quantity: number
    price: number
    variant: {
        product: { Pname: string }
        values?: { optionValue: { value: string } }[]
    }
}

type Order = {
    id: string
    createdAt: string
    totalAmount: number
    status: string
    trackingNumber?: string
    items: OrderItem[]
}

type StoreSettings = {
    storeName?: string
    address?: string
    phone?: string
    email?: string
    bankName?: string
    accountNumber?: string
    accountName?: string
}

export default function PrintReceipt({
    order,
    storeSettings,
}: {
    order: Order
    storeSettings?: StoreSettings
}) {
    const printRef = useRef<HTMLDivElement>(null)

    const handlePrint = () => {
        const printContent = printRef.current?.innerHTML
        if (!printContent) return

        const win = window.open("", "_blank", "width=794,height=1123")
        if (!win) return

        win.document.write(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8" />
        <title>ใบเสร็จรับเงิน - ORD-${order.id.substring(0, 8).toUpperCase()}</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }

          body {
            font-family: 'Sarabun', sans-serif;
            background: #fff;
            color: #111;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .receipt {
            width: 794px;
            min-height: 1123px;
            padding: 48px 56px;
            background: #fff;
            position: relative;
          }

          /* Header */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 28px;
            border-bottom: 3px solid #111;
            margin-bottom: 28px;
          }

          .logo-block { display: flex; align-items: center; gap: 16px; }

          .logo-icon {
            width: 56px; height: 56px;
            background: #111;
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            color: #fff;
            font-size: 24px;
            font-weight: 800;
            flex-shrink: 0;
          }

          .store-name {
            font-size: 22px;
            font-weight: 800;
            color: #111;
            letter-spacing: -0.02em;
            line-height: 1.2;
          }

          .store-sub {
            font-size: 12px;
            color: #888;
            font-weight: 500;
            margin-top: 3px;
          }

          .receipt-title-block { text-align: right; }

          .receipt-title {
            font-size: 28px;
            font-weight: 800;
            color: #111;
            letter-spacing: -0.03em;
          }

          .receipt-number {
            font-size: 13px;
            color: #888;
            font-weight: 500;
            margin-top: 4px;
          }

          /* Info grid */
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 28px;
          }

          .info-block {}
          .info-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #aaa;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 14px;
            font-weight: 600;
            color: #111;
            line-height: 1.5;
          }

          /* Status badge */
          .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            background: #f0fdf4;
            color: #16a34a;
            border: 1px solid #bbf7d0;
          }

          /* Table */
          .table-wrap { margin-bottom: 0; }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          thead tr {
            background: #111;
            color: #fff;
          }

          thead th {
            padding: 10px 14px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            text-align: left;
          }

          thead th:last-child, thead th:nth-child(3), thead th:nth-child(2) {
            text-align: right;
          }

          tbody tr {
            border-bottom: 1px solid #f0f0f0;
          }

          tbody tr:last-child { border-bottom: none; }

          tbody td {
            padding: 12px 14px;
            font-size: 13px;
            color: #222;
            vertical-align: top;
          }

          tbody td:nth-child(2), tbody td:nth-child(3), tbody td:last-child {
            text-align: right;
          }

          .product-name { font-weight: 700; color: #111; }
          .product-variant { font-size: 11px; color: #999; margin-top: 2px; font-weight: 500; }

          /* Summary */
          .summary {
            margin-top: 0;
            border-top: 2px solid #111;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 14px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 13px;
          }

          .summary-row:last-child { border-bottom: none; }

          .summary-label { color: #666; font-weight: 500; }
          .summary-value { font-weight: 700; color: #111; }

          .total-row {
            background: #111;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 14px;
          }

          .total-label { color: #fff; font-size: 14px; font-weight: 700; }
          .total-value { color: #fff; font-size: 20px; font-weight: 800; }

          /* Divider */
          .divider {
            border: none;
            border-top: 1px dashed #ddd;
            margin: 24px 0;
          }

          /* Footer */
          .footer {
            margin-top: 32px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }

          .footer-note {
            font-size: 11px;
            color: #bbb;
            line-height: 1.7;
          }

          .footer-thanks {
            font-size: 15px;
            font-weight: 800;
            color: #111;
            text-align: right;
          }

          .footer-sub {
            font-size: 11px;
            color: #bbb;
            text-align: right;
            margin-top: 2px;
          }

          /* Watermark corner */
          .corner-mark {
            position: absolute;
            top: 48px;
            right: 56px;
            width: 80px;
            height: 80px;
            border: 3px solid #f0f0f0;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(-20deg);
          }

          .corner-mark-text {
            font-size: 9px;
            font-weight: 800;
            color: #ddd;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-align: center;
            line-height: 1.3;
          }

          @page {
            size: A4;
            margin: 0;
          }

          @media print {
            body { margin: 0; }
            .receipt { width: 100%; }
          }
        </style>
      </head>
      <body>
        ${printContent}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          }
        </script>
      </body>
      </html>
    `)
        win.document.close()
    }

    const storeName = storeSettings?.storeName || "Tobacco Store"
    const orderId = order.id.substring(0, 8).toUpperCase()
    const orderDate = new Date(order.createdAt).toLocaleDateString("th-TH", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit"
    })

    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const STATUS_LABEL: Record<string, string> = {
        PENDING: "รอชำระเงิน", VERIFYING: "รอตรวจสอบ", PAID: "ชำระเงินแล้ว",
        SHIPPED: "จัดส่งแล้ว", COMPLETED: "สำเร็จ", CANCELLED: "ยกเลิก",
    }

    return (
        <>
            {/* Print button */}
            <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 font-bold py-3 px-4 rounded-2xl hover:border-purple-300 hover:text-purple-600 transition-all cursor-pointer w-full"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                พิมพ์ใบเสร็จ
            </button>

            {/* Hidden print template */}
            <div ref={printRef} style={{ display: "none" }}>
                <div className="receipt">

                    {/* Header */}
                    <div className="header">
                        <div className="logo-block">
                            <div className="logo-icon">TC</div>
                            <div>
                                <div className="store-name">{storeName}</div>
                                <div className="store-sub">{storeSettings?.address || ""}</div>
                                <div className="store-sub">{storeSettings?.phone || ""} {storeSettings?.email ? `· ${storeSettings.email}` : ""}</div>
                            </div>
                        </div>
                        <div className="receipt-title-block">
                            <div className="receipt-title">ใบเสร็จรับเงิน</div>
                            <div className="receipt-number">เลขที่ ORD-{orderId}</div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="info-grid">
                        <div>
                            <div className="info-label">วันที่ออกใบเสร็จ</div>
                            <div className="info-value">{orderDate}</div>
                        </div>
                        <div>
                            <div className="info-label">สถานะ</div>
                            <div className="info-value">
                                <span className="status-badge">{STATUS_LABEL[order.status] || order.status}</span>
                            </div>
                        </div>
                        {order.trackingNumber && (
                            <div>
                                <div className="info-label">หมายเลขพัสดุ</div>
                                <div className="info-value">{order.trackingNumber}</div>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: "40%" }}>รายการสินค้า</th>
                                    <th style={{ width: "20%" }}>ราคา/ชิ้น</th>
                                    <th style={{ width: "15%" }}>จำนวน</th>
                                    <th style={{ width: "25%" }}>รวม</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item) => {
                                    const variantText = item.variant.values?.length
                                        ? item.variant.values.map(v => v.optionValue.value).join(" · ")
                                        : null
                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="product-name">{item.variant.product.Pname}</div>
                                                {variantText && <div className="product-variant">{variantText}</div>}
                                            </td>
                                            <td>฿{item.price.toLocaleString()}</td>
                                            <td>{item.quantity}</td>
                                            <td>฿{(item.price * item.quantity).toLocaleString()}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    <div className="summary">
                        <div className="summary-row">
                            <span className="summary-label">ราคารวม</span>
                            <span className="summary-value">฿{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">ค่าจัดส่ง</span>
                            <span className="summary-value">฿0</span>
                        </div>
                        <div className="total-row">
                            <span className="total-label">ยอดชำระทั้งหมด</span>
                            <span className="total-value">฿{order.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="footer">
                        <div className="footer-note">
                            เอกสารนี้ออกโดยระบบอัตโนมัติ<br />
                            กรุณาเก็บเอกสารนี้ไว้เป็นหลักฐาน<br />
                            หากมีข้อสงสัยกรุณาติดต่อร้านค้า
                        </div>
                        <div>
                            <div className="footer-thanks">ขอบคุณที่ใช้บริการ</div>
                            <div className="footer-sub">{storeName}</div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}