import { getAdminBanners } from "@/utils/actions"
import SettingsClient from "./SettingsClient"
import prisma from "@/utils/db" 

export const revalidate = 60

export default async function AdminSettingsPage() {
  const [dbBanners, dbSettings] = await Promise.all([
    getAdminBanners(),
    prisma.storeSetting.findFirst()
  ])

  const initialSettings = {
    storeName: dbSettings?.storeName || "",
    email: dbSettings?.email || "",
    phone: dbSettings?.phone || "",
    address: dbSettings?.address || "",
    maintenanceMode: dbSettings?.maintenanceMode || false,
    bankName: dbSettings?.bankName || "",
    accountNumber: dbSettings?.accountNumber || "",
    accountName: dbSettings?.accountName || ""
  }

  return (
    <SettingsClient 
      initialSettings={initialSettings} 
      initialBanners={dbBanners} 
    />
  )
}