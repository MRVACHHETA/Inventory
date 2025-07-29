// src/app/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Smartphone, HardDrive, BatteryCharging, Camera, Usb, CircuitBoard,
  Volume2, Mic, Fingerprint, Lightbulb, Box, Wrench, Antenna,
  DoorOpen, KeyRound, Touchpad, Replace, Factory, Package
} from "lucide-react";

// Define your specific spare part categories with icons
const sparePartCategories = [
  { name: "Combos", icon: <Smartphone className="w-8 h-8" />, description: "Display + Touch Assembly" },
  { name: "Frames", icon: <HardDrive className="w-8 h-8" />, description: "Mid Frames, Back Panels" },
  { name: "Back Panels", icon: <Factory className="w-8 h-8" />, description: "Rear Housings" },
  { name: "LCDs", icon: <Lightbulb className="w-8 h-8" />, description: "Liquid Crystal Displays" },
  { name: "Batteries", icon: <BatteryCharging className="w-8 h-8" />, description: "All Mobile Batteries" },
  { name: "Cameras", icon: <Camera className="w-8 h-8" />, description: "Front & Rear Cameras" },
  { name: "CC Flex", icon: <Usb className="w-8 h-8" />, description: "Charging Port Flex" },
  { name: "On/Off Belts", icon: <CircuitBoard className="w-8 h-8" />, description: "Power Button Flex" },
  { name: "Volume Buttons", icon: <Volume2 className="w-8 h-8" />, description: "Volume Key Flex" },
  { name: "LCD Belts", icon: <CircuitBoard className="w-8 h-8" />, description: "LCD Connector Flex" },
  { name: "Main Belts", icon: <CircuitBoard className="w-8 h-8" />, description: "Main Flex Cables" },
  { name: "Ringer Boxes", icon: <Volume2 className="w-8 h-8" />, description: "Loudspeaker Modules" },
  { name: "OCA Glass", icon: <Touchpad className="w-8 h-8" />, description: "Outer Glass for LCD" },
  { name: "Speakers", icon: <Volume2 className="w-8 h-8" />, description: "Earpiece & Loudspeakers" },
  { name: "Mics", icon: <Mic className="w-8 h-8" />, description: "Microphone Components" },
  { name: "Finger Sensors", icon: <Fingerprint className="w-8 h-8" />, description: "Fingerprint Scanners" },
  { name: "Camera Glass", icon: <Camera className="w-8 h-8" />, description: "Camera Lens Cover" },
  { name: "Mix Screws", icon: <Wrench className="w-8 h-8" />, description: "Assorted Screws" },
  { name: "Antenna Cables", icon: <Antenna className="w-8 h-8" />, description: "Network Antenna" },
  { name: "Speaker Jalis", icon: <Volume2 className="w-8 h-8" />, description: "Speaker Grilles" },
  { name: "On/Off Switches", icon: <DoorOpen className="w-8 h-8" />, description: "Power Switches" },
  { name: "Outer Keys", icon: <KeyRound className="w-8 h-8" />, description: "Physical Buttons" },
  { name: "Touch Glass", icon: <Touchpad className="w-8 h-8" />, description: "Digitizer Glass" },
  { name: "Full Body", icon: <Package className="w-8 h-8" />, description: "Full Body Housings" },
  // Add more categories as needed
];


export default function HomePage() {
  const [categorySearch, setCategorySearch] = useState("");

  const filteredCategories = useMemo(() => {
    if (!categorySearch) {
      return sparePartCategories;
    }
    const lowerCaseSearch = categorySearch.toLowerCase();
    return sparePartCategories.filter(category =>
      category.name.toLowerCase().includes(lowerCaseSearch) ||
      category.description.toLowerCase().includes(lowerCaseSearch)
    );
  }, [categorySearch]);

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 bg-gradient-to-br from-white to-blue-50 py-10">
      <Image
        src="/inventory-logo.png"
        alt="Inventory Logo"
        width={160}
        height={160}
        className="rounded-full mb-6 shadow-lg border-4 border-blue-200"
      />
      <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800 mb-4 tracking-tight">
        Inventory Hub
      </h1>
      <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mb-8">
        Browse categories or search for specific spare parts.
      </p>

      {/* Category Search Bar */}
      <div className="relative w-full max-w-xl mb-10">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <Input
          placeholder="Search categories (e.g., 'Combo', 'Battery')..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 w-full shadow-md text-lg"
          value={categorySearch}
          onChange={(e) => setCategorySearch(e.target.value)}
        />
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="text-center text-gray-500 p-10 border rounded-lg bg-white shadow-sm w-full max-w-5xl">
          <p className="text-lg mb-2">No categories found matching "{categorySearch}".</p>
          <p className="text-sm">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl px-4">
          {filteredCategories.map((category) => (
            <Link
              href={`/public-inventory?category=${encodeURIComponent(category.name)}`}
              key={category.name}
              className="group block"
            >
              <Card className="hover:scale-[1.02] hover:shadow-2xl transition duration-300 ease-in-out bg-white border border-blue-100 rounded-xl cursor-pointer h-full flex flex-col justify-between">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="mb-4 p-4 rounded-full bg-blue-100 group-hover:bg-blue-600 transition-colors duration-300">
                    {React.cloneElement(category.icon, {
                      className: `text-blue-700 group-hover:text-white transition-colors duration-300 w-10 h-10`,
                    })}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-blue-900">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {category.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}