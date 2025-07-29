// src/app/layout.tsx
"use client";

import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    try {
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserName(parsedUser.name || parsedUser.email || null);
      } else {
        setUserName(localStorage.getItem("userName"));
      }
    } catch {
      setUserName(localStorage.getItem("userName"));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userName");
    localStorage.removeItem("userGender");
    window.location.href = "/";
  };

  return (
    <html lang="en">
      <head>
        {/* Manually added title and description to resolve "use client" metadata error */}
        <title>Inventory System</title>
        <meta name="description" content="Manage your inventory seamlessly" />

        {/* Using Satoshi font as in your previous project */}
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" rel="stylesheet" />
        {/* Assuming you might want PWA features later, keeping manifest/icons */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="antialiased bg-white text-gray-900 font-satoshi">
        <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3"> {/* Adjusted px */}
            <Link href="/" className="flex items-center gap-3">
              <Image src="/inventory-logo.png" alt="Inventory Logo" width={60} height={60} className="rounded-xl" />
              <span className="text-xl sm:text-2xl font-bold text-blue-700 tracking-tight whitespace-nowrap">Inventory System</span> {/* Adjusted font size */}
            </Link>

            <nav className="hidden sm:flex items-center gap-4 text-sm font-medium text-gray-700">
              <Link href="/" className="hover:text-blue-600">Home</Link>

              {!loading && (
                userName ? (
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full shadow text-blue-700 font-semibold">
                    <Link href="/admin/dashboard" className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs">👤</div>
                      <span className="max-w-[120px] truncate">{userName}</span>
                    </Link>
                    <Link href="/admin/dashboard" className="text-xs ml-2 px-2 py-1 rounded-full hover:bg-blue-100 text-blue-600">Dashboard</Link>
                    <button onClick={handleLogout} className="text-xs px-2 py-1 ml-2 rounded-full text-red-500 hover:bg-red-50">Logout</button>
                  </div>
                ) : (
                  null
                )
              )}
            </nav>

            <div className="sm:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 focus:ring-2 focus:ring-blue-500">
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64 bg-white text-gray-900 border-l shadow-xl">
                  <div className="mt-14 flex flex-col gap-4 px-4"> {/* Adjusted px */}
                    <Link href="/" className="py-2 border-b hover:text-blue-600">Home</Link>

                    {!loading && (
                      userName ? (
                        <div className="flex flex-col gap-2 mt-4 bg-gray-100 p-3 rounded-lg">
                          <Link href="/admin/dashboard" className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-800 flex items-center justify-center text-xs">👤</div>
                            <span>{userName}</span>
                          </Link>
                          <Link href="/admin/dashboard" className="text-sm text-blue-600 hover:underline">Dashboard</Link>
                          <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">Logout</button>
                        </div>
                      ) : (
                        null
                      )
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <main className="min-h-screen pt-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}