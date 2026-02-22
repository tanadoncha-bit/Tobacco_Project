import Sidebar from "@/components/owner/sidebar/Sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[linear-gradient(140deg,#2F4156,#567C8D)]">
      <Sidebar />
      <main className="flex-1 bg-gray-100 rounded-l-3xl p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
