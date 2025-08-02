// src/app/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation"; // New import
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Smartphone, HardDrive, BatteryCharging, Camera, Usb, CircuitBoard,
  Volume2, Mic, Fingerprint, Lightbulb, Wrench, Antenna,
  DoorOpen, KeyRound, Touchpad, Factory, Package
} from "lucide-react";

// New imports for the dropdown component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// Define your specific spare part categories with icons
const sparePartCategories = [
  { name: "Combos", icon: <Smartphone />, description: "Display + Touch Assembly" },
  { name: "Frames", icon: <HardDrive />, description: "Mid Frames, Back Panels" },
  { name: "Back Panels", icon: <Factory />, description: "Rear Housings" },
  { name: "LCDs", icon: <Lightbulb />, description: "Liquid Crystal Displays" },
  { name: "Batteries", icon: <BatteryCharging />, description: "All Mobile Batteries" },
  { name: "Cameras", icon: <Camera />, description: "Front & Rear Cameras" },
  { name: "CC Flex", icon: <Usb />, description: "Charging Port Flex" },
  { name: "On/Off Belts", icon: <CircuitBoard />, description: "Power Button Flex" },
  { name: "Volume Buttons", icon: <Volume2 />, description: "Volume Key Flex" },
  { name: "LCD Belts", icon: <CircuitBoard />, description: "LCD Connector Flex" },
  { name: "Main Belts", icon: <CircuitBoard />, description: "Main Flex Cables" },
  { name: "Ringer Boxes", icon: <Volume2 />, description: "Loudspeaker Modules" },
  { name: "OCA Glass", icon: <Touchpad />, description: "Outer Glass for LCD" },
  { name: "Speakers", icon: <Volume2 />, description: "Earpiece & Loudspeakers" },
  { name: "Mics", icon: <Mic />, description: "Microphone Components" },
  { name: "Finger Sensors", icon: <Fingerprint />, description: "Fingerprint Scanners" },
  { name: "Camera Glass", icon: <Camera />, description: "Camera Lens Cover" },
  { name: "Mix Screws", icon: <Wrench />, description: "Assorted Screws" },
  { name: "Antenna Cables", icon: <Antenna />, description: "Network Antenna" },
  { name: "Speaker Jalis", icon: <Volume2 />, description: "Speaker Grilles" },
  { name: "On/Off Switches", icon: <DoorOpen />, description: "Power Switches" },
  { name: "Outer Keys", icon: <KeyRound />, description: "Physical Buttons" },
  { name: "Touch Glass", icon: <Touchpad />, description: "Digitizer Glass" },
  { name: "Full Body", icon: <Package />, description: "Full Body Housings" },
];


export default function HomePage() {
  const router = useRouter(); // Initialize router
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

  // Handler for the new dropdown box
  const handleCategorySelect = (value: string) => {
    const selectedCategory = sparePartCategories.find(cat => cat.name === value);
    if (selectedCategory) {
      router.push(`/public-inventory?category=${encodeURIComponent(selectedCategory.name)}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 bg-gradient-to-br from-white to-blue-50 py-10 min-h-screen">
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

      {/* Main Action Bar: Search & Dropdown */}
      {/* NEW: Use flexbox to position the search bar and dropdown side-by-side on larger screens */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-xl mb-10 px-2 sm:px-0">
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-2/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search categories..."
            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full shadow-md text-base"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
          />
        </div>
        
        {/* Dropdown Box for all Categories */}
        <div className="w-full sm:w-1/3">
          <Select onValueChange={handleCategorySelect}>
            <SelectTrigger className="w-full shadow-md text-base">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {sparePartCategories.map(category => (
                <SelectItem key={category.name} value={category.name}>
                  <div className="flex items-center gap-2">
                    {React.cloneElement(category.icon, { size: 16 })}
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="text-center text-gray-500 p-10 border rounded-lg bg-white shadow-sm w-full max-w-5xl mx-4 sm:mx-0">
          <p className="text-lg mb-2">No categories found matching &quot;{categorySearch}&quot;.</p>
          <p className="text-sm">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full max-w-7xl px-2 sm:px-4">
          {filteredCategories.map((category) => (
            <Link
              href={`/public-inventory?category=${encodeURIComponent(category.name)}`}
              key={category.name}
              className="group block"
            >
              <Card className="hover:scale-[1.02] hover:shadow-xl transition duration-300 ease-in-out bg-white border border-blue-100 rounded-xl cursor-pointer h-full flex flex-col justify-between p-4 sm:p-0">
                <CardContent className="flex flex-row items-center p-0 text-left sm:flex-col sm:items-center sm:text-center sm:p-6">
                  <div className="mb-0 mr-4 p-3 rounded-full bg-blue-100 group-hover:bg-blue-600 transition-colors duration-300 flex-shrink-0 sm:mb-4 sm:mr-0 sm:p-4">
                    {React.cloneElement(category.icon, {
                      className: `text-blue-700 group-hover:text-white transition-colors duration-300 w-8 h-8 sm:w-10 sm:h-10`,
                    })}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold mb-1 text-blue-900 sm:text-xl sm:mb-2">
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-600 sm:text-sm">
                      {category.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}