// src/app/components/SparePartForm.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/app/components/badge";

import { ImagePlus, Wand2, Loader2, XCircle } from "lucide-react";

const CATEGORIES = [
  "Combos", "Frames", "Back Panels", "LCDs", "Batteries", "Cameras",
  "CC Flex", "On/Off Belts", "Volume Buttons", "LCD Belts", "Main Belts",
  "Ringer Boxes", "OCA Glass", "Speakers", "Mics", "Finger Sensors",
  "Camera Glass", "Mix Screws", "Antenna Cables", "Speaker Jalis",
  "On/Off Switches", "Outer Keys", "Touch Glass", "Full Body"
];

interface SparePartFormData {
  deviceModel: string[];
  brand: string[];
  quantity: number;
  price: number;
  category: string;
  imageUrl?: string;
  description?: string;
  boxNumber?: string;
}

interface SparePartFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: SparePartFormData | null;
  onSubmit: (data: SparePartFormData) => void;
  isEditMode: boolean;
  actionLoading: boolean;
  allBrands: string[];
  onAddBrandToAll: (brand: string) => void;
}

export function SparePartForm({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
  isEditMode,
  actionLoading,
  allBrands,
  onAddBrandToAll,
}: SparePartFormProps) {
  const [formData, setFormData] = useState<SparePartFormData>(
    initialData || {
      deviceModel: [],
      brand: [],
      quantity: 0,
      price: 0,
      imageUrl: "",
      description: "",
      category: CATEGORIES[0] || "", // Default if no initialData is passed at all
      boxNumber: "",
    }
  );
  const [currentDeviceModelInput, setCurrentDeviceModelInput] = useState<string>("");
  const [currentBrandInput, setCurrentBrandInput] = useState<string>("");

  useEffect(() => {
    // Only update if the modal is currently open to prevent issues when it's closed
    if (isOpen) {
      setFormData({
        // Use initialData if provided, otherwise fall back to empty/default values
        deviceModel: initialData?.deviceModel || [],
        brand: initialData?.brand || [],
        quantity: initialData?.quantity || 0,
        price: initialData?.price || 0,
        imageUrl: initialData?.imageUrl || "",
        description: initialData?.description || "",
        // THIS IS THE KEY CHANGE: Prioritize initialData.category, otherwise use CATEGORIES[0]
        category: initialData?.category || CATEGORIES[0] || "",
        boxNumber: initialData?.boxNumber || "",
      });
      setCurrentDeviceModelInput("");
      setCurrentBrandInput("");
    }
  }, [initialData, isOpen]); // Depend on initialData and isOpen

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement | HTMLTextAreaElement;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleDeviceModelInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDeviceModelInput(e.target.value);
  };

  const addDeviceModel = (model: string) => {
    const trimmedModel = model.trim();
    if (trimmedModel && !formData.deviceModel.some(m => m.toLowerCase() === trimmedModel.toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        deviceModel: [...prev.deviceModel, trimmedModel],
      }));
      setCurrentDeviceModelInput("");
    }
  };

  const removeDeviceModel = (modelToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      deviceModel: prev.deviceModel.filter((m) => m !== modelToRemove),
    }));
  };

  const handleBrandInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentBrandInput(e.target.value);
  };

  const addBrand = (brandToAdd: string) => {
    const trimmedBrand = brandToAdd.trim();
    if (trimmedBrand && !formData.brand.some(b => b.toLowerCase() === trimmedBrand.toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        brand: [...prev.brand, trimmedBrand],
      }));
      onAddBrandToAll(trimmedBrand);
      setCurrentBrandInput("");
    }
  };

  const removeBrand = (brandToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      brand: prev.brand.filter((b) => b !== brandToRemove),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95%] w-full sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] p-6 rounded-lg shadow-xl mx-auto my-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-blue-700">
            {isEditMode ? "Edit Spare Part" : "Add New Spare Part"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="boxNumber" className="text-sm font-medium text-gray-700">Box Number</Label>
            <Input
              id="boxNumber"
              name="boxNumber"
              onChange={handleInputChange}
              value={formData.boxNumber || ""}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label htmlFor="brand" className="text-sm font-medium text-gray-700">Brand(s)</Label>
            <div className="flex flex-wrap gap-2 mt-1 mb-2">
              {formData.brand.map((b, index) => (
                <Badge key={index} className="bg-purple-500 text-white px-2 py-1 rounded-md flex items-center gap-1">
                  {b}
                  <XCircle
                    size={14}
                    className="cursor-pointer hover:text-red-200 transition-colors"
                    onClick={() => removeBrand(b)}
                  />
                </Badge>
              ))}
            </div>
            <Select onValueChange={(value) => addBrand(value)} value="">
              <SelectTrigger id="brand" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select existing brand or add new" />
              </SelectTrigger>
              <SelectContent>
                {allBrands.map((b) => (
                  <SelectItem key={b} value={b} disabled={formData.brand.includes(b)}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2">
              <Input
                id="brandInput"
                placeholder="Or type new brand to add"
                value={currentBrandInput}
                onChange={handleBrandInputChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addBrand(currentBrandInput);
                  }
                }}
                className="flex-grow border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <Button type="button" size="sm" onClick={() => addBrand(currentBrandInput)} className="bg-gray-200 text-gray-700 hover:bg-gray-300 w-full sm:w-auto">
                Add Brand
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="deviceModel" className="text-sm font-medium text-gray-700">Model(s)</Label>
            <div className="flex flex-wrap gap-2 mt-1 mb-2">
              {formData.deviceModel.map((model, index) => (
                <Badge key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center gap-1">
                  {model}
                  <XCircle
                    size={14}
                    className="cursor-pointer hover:text-red-200 transition-colors"
                    onClick={() => removeDeviceModel(model)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1">
              <Input
                id="deviceModelInput"
                placeholder="Type model (e.g., Y20, A31, Narzo 30) and press Enter or click Add"
                value={currentDeviceModelInput}
                onChange={handleDeviceModelInputChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addDeviceModel(currentDeviceModelInput);
                  }
                }}
                className="flex-grow block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <Button type="button" size="sm" onClick={() => addDeviceModel(currentDeviceModelInput)} className="bg-gray-200 text-gray-700 hover:bg-gray-300 w-full sm:w-auto">
                Add Model
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))} value={formData.category}>
              <SelectTrigger id="category" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" required onChange={handleInputChange} value={formData.quantity === 0 ? "" : formData.quantity} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <Label htmlFor="price" className="text-sm font-medium text-gray-700">Price (₹)</Label>
              <Input id="price" name="price" type="number" required onChange={handleInputChange} value={formData.price === 0 ? "" : formData.price} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <Label htmlFor="imageUrl" className="text-sm font-medium text-gray-700">Image URL</Label>
            <Input id="imageUrl" name="imageUrl" onChange={handleInputChange} value={formData.imageUrl || ""} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
            <Textarea id="description" name="description" rows={3} onChange={handleInputChange} value={formData.description || ""} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-end mt-6">
            <Button type="button" variant="outline" disabled className="flex items-center gap-1 w-full sm:w-auto">
              <ImagePlus size={16} /> Upload
            </Button>
            <Button type="button" variant="outline" disabled className="flex items-center gap-1 w-full sm:w-auto">
              <Wand2 size={16} /> Generate Image
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 shadow-sm transition-all duration-200 transform active:scale-95 flex items-center gap-1 w-full sm:w-auto"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isEditMode ? (
                "Update Part"
              ) : (
                "Save Part"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}