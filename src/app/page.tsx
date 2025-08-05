"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Smartphone, HardDrive, BatteryCharging, Camera, Usb, CircuitBoard,
  Volume2, Mic, Fingerprint, Lightbulb, Wrench, Antenna,
  DoorOpen, KeyRound, Touchpad, Factory, Package
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// Define the categories with their icons. The names correspond to the translation keys.
const baseCategories = [
  { name: "Combos", icon: <Smartphone /> },
  { name: "Frames", icon: <HardDrive /> },
  { name: "Back Panels", icon: <Factory /> },
  { name: "LCDs", icon: <Lightbulb /> },
  { name: "Batteries", icon: <BatteryCharging /> },
  { name: "Cameras", icon: <Camera /> },
  { name: "CC Flex", icon: <Usb /> },
  { name: "On/Off Belts", icon: <CircuitBoard /> },
  { name: "Volume Buttons", icon: <Volume2 /> },
  { name: "LCD Belts", icon: <CircuitBoard /> },
  { name: "Main Belts", icon: <CircuitBoard /> },
  { name: "Ringer Boxes", icon: <Volume2 /> },
  { name: "OCA Glass", icon: <Touchpad /> },
  { name: "Speakers", icon: <Volume2 /> },
  { name: "Mics", icon: <Mic /> },
  { name: "Finger Sensors", icon: <Fingerprint /> },
  { name: "Camera Glass", icon: <Camera /> },
  { name: "Mix Screws", icon: <Wrench /> },
  { name: "Antenna Cables", icon: <Antenna /> },
  { name: "Speaker Jalis", icon: <Volume2 /> },
  { name: "On/Off Switches", icon: <DoorOpen /> },
  { name: "Outer Keys", icon: <KeyRound /> },
  { name: "Touch Glass", icon: <Touchpad /> },
  { name: "Full Body", icon: <Package /> },
];


export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [categorySearch, setCategorySearch] = useState("");

  const translatedCategories = useMemo(() => {
    return baseCategories.map(cat => ({
      ...cat,
      translatedName: t(`spareParts.categories.${cat.name}`),
      description: t(`homePage.categoryDescriptions.${cat.name}`),
    }));
  }, [t]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch) {
      return translatedCategories;
    }
    const lowerCaseSearch = categorySearch.toLowerCase();
    return translatedCategories.filter(category =>
      category.translatedName.toLowerCase().includes(lowerCaseSearch) ||
      category.description.toLowerCase().includes(lowerCaseSearch)
    );
  }, [categorySearch, translatedCategories]);

  const handleCategorySelect = (value: string) => {
    router.push(`/public-inventory?category=${encodeURIComponent(value)}`);
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
        {t('app.title')}
      </h1>
      <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mb-8">
        {t('homePage.subtitle')}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-xl mb-10 px-2 sm:px-0">
        <div className="relative w-full sm:w-2/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder={t('homePage.searchCategoriesPlaceholder')}
            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full shadow-md text-base"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
          />
        </div>
        
        <div className="w-full sm:w-1/3">
          <Select onValueChange={handleCategorySelect}>
            <SelectTrigger className="w-full shadow-md text-base">
              <SelectValue placeholder={t('homePage.allCategoriesPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {translatedCategories.map(category => (
                <SelectItem key={category.name} value={category.name}>
                  <div className="flex items-center gap-2">
                    {React.cloneElement(category.icon, { size: 16 })}
                    {category.translatedName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="text-center text-gray-500 p-10 border rounded-lg bg-white shadow-sm w-full max-w-5xl mx-4 sm:mx-0">
          <p className="text-lg mb-2">{t('homePage.noCategoriesFound', { search: categorySearch })}</p>
          <p className="text-sm">{t('homePage.tryDifferentSearch')}</p>
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
                      {category.translatedName}
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