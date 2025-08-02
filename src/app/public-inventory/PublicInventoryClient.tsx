'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image"; // ADDED this import for image optimization
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/app/components/badge";
import { SparePartForm } from "@/app/components/SparePartForm";

import {
  Search, Loader2, PlusCircle, Pencil, Trash2, Tag, Layers, MoreVertical
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CATEGORIES = [
  "Combos", "Frames", "Back Panels", "LCDs", "Batteries", "Cameras",
  "CC Flex", "On/Off Belts", "Volume Buttons", "LCD Belts", "Main Belts",
  "Ringer Boxes", "OCA Glass", "Speakers", "Mics", "Finger Sensors",
  "Camera Glass", "Mix Screws", "Antenna Cables", "Speaker Jalis",
  "On/Off Switches", "Outer Keys", "Touch Glass", "Full Body"
];

const INITIAL_COMMON_BRANDS = [
  "Vivo", "Oppo", "Samsung", "Realme", "Infinix", "Tecno", "Redmi", "Poco", "OnePlus", "Apple", "Google Pixel"
];

interface SparePart {
  _id: string;
  deviceModel: string[];
  brand: string[];
  quantity: number;
  price: number;
  status: "in-stock" | "out-of-stock";
  category: string;
  imageUrl?: string;
  description?: string;
  isLowStock?: boolean;
  boxNumber?: string;
}

const LOW_STOCK_THRESHOLD = 5;

export default function PublicInventoryClient() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");

  const [parts, setParts] = useState<SparePart[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>(initialCategory || "All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"All" | "in-stock" | "out-of-stock">("All");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);

  const [allBrands, setAllBrands] = useState<string[]>(INITIAL_COMMON_BRANDS);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const [addFormInitialData, setAddFormInitialData] = useState<Omit<SparePart, "_id" | "status" | "isLowStock"> | null>(null);

  const handleAddBrandToAll = useCallback((newBrand: string) => {
    setAllBrands(prev => {
      const updatedBrands = Array.from(new Set([...prev, newBrand]));
      return updatedBrands.sort();
    });
  }, []);

  const fetchParts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/spare-parts");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data: SparePart[] = await res.json();
      const processedData = data.map((part) => ({
        ...part,
        price: parseFloat(part.price as unknown as string) || 0,
        quantity: parseInt(part.quantity as unknown as string) || 0,
        deviceModel: Array.isArray(part.deviceModel) ? part.deviceModel : (part.deviceModel ? [part.deviceModel] : []),
        brand: Array.isArray(part.brand) ? part.brand : (part.brand ? [part.brand] : []),
        status: part.status || (part.quantity > 0 ? "in-stock" : "out-of-stock"),
        isLowStock: part.quantity <= LOW_STOCK_THRESHOLD && part.status === 'in-stock'
      }));
      setParts(processedData);

      const fetchedBrands = new Set<string>();
      processedData.forEach(part => {
        part.brand.forEach(b => fetchedBrands.add(b));
      });
      setAllBrands(prev => Array.from(new Set([...prev, ...Array.from(fetchedBrands)])).sort());
    } catch (error: unknown) { // FIX: Replaced 'any' with 'unknown' and added type guard
      console.error("Failed to fetch spare parts:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      alert("Failed to fetch spare parts: " + errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParts();
    if (initialCategory) {
        setSelectedCategoryFilter(initialCategory);
    }
  }, [fetchParts, initialCategory]);

  const deletePart = async (id: string) => {
    if (!confirm("Are you sure to delete this part?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/spare-parts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setParts((prev) => prev.filter((p) => p._id !== id));
      } else {
        const error = await res.text();
        alert("Failed to delete: " + error);
      }
    } catch (error: unknown) { // FIX: Replaced 'any' with 'unknown' and added type guard
      console.error("Error deleting part:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      alert("Error deleting part: " + errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleStock = async (id: string, currentStatus: string) => {
    setActionLoading(id);
    const newStatus = currentStatus === "in-stock" ? "out-of-stock" : "in-stock";
    try {
      const res = await fetch(`/api/spare-parts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setParts((prev) =>
          prev.map((p) => {
            if (p._id === id) {
              const updatedPart = { ...p, status: newStatus as "in-stock" | "out-of-stock" };
              return {
                ...updatedPart,
                isLowStock: updatedPart.quantity <= LOW_STOCK_THRESHOLD && updatedPart.status === 'in-stock'
              };
            }
            return p;
          })
        );
      } else {
        const error = await res.text();
        alert("Failed to update status: " + error);
      }
    } catch (error: unknown) { // FIX: Replaced 'any' with 'unknown' and added type guard
      console.error("Error toggling stock:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      alert("Error toggling stock: " + errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddSubmit = async (data: Omit<SparePart, "_id" | "status" | "isLowStock">) => {
    setActionLoading("add");
    try {
      const res = await fetch("/api/spare-parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          status: data.quantity > 0 ? "in-stock" : "out-of-stock",
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        return alert("Failed to add: " + error);
      }

      const saved: SparePart = await res.json();
      setParts((prev) => [
        {
          ...saved,
          price: parseFloat(saved.price as unknown as string) || 0,
          quantity: parseInt(saved.quantity as unknown as string) || 0,
          deviceModel: Array.isArray(saved.deviceModel) ? saved.deviceModel : (saved.deviceModel ? [saved.deviceModel] : []),
          brand: Array.isArray(saved.brand) ? saved.brand : (saved.brand ? [saved.brand] : []),
          isLowStock: saved.quantity <= LOW_STOCK_THRESHOLD && saved.status === 'in-stock',
        },
        ...prev,
      ]);
      setAddModalOpen(false);
    } catch (error: unknown) { // FIX: Replaced 'any' with 'unknown' and added type guard
      console.error("Error adding part:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      alert("Error adding part: " + errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditSubmit = async (data: Omit<SparePart, "_id" | "status" | "isLowStock">) => {
    if (!selectedPart) return;

    setActionLoading(selectedPart._id);
    const { _id } = selectedPart;

    try {
      const res = await fetch(`/api/spare-parts/${_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.text();
        return alert("Failed to update: " + error);
      }

      const updated: SparePart = await res.json();
      setParts((prev) =>
        prev.map((p) =>
          p._id === _id
            ? {
                ...updated,
                price: parseFloat(updated.price as unknown as string) || 0,
                quantity: parseInt(updated.quantity as unknown as string) || 0,
                deviceModel: Array.isArray(updated.deviceModel) ? updated.deviceModel : (updated.deviceModel ? [updated.deviceModel] : []),
                brand: Array.isArray(updated.brand) ? updated.brand : (updated.brand ? [updated.brand] : []),
                isLowStock: updated.quantity <= LOW_STOCK_THRESHOLD && updated.status === 'in-stock',
              }
            : p
        )
      );
      setEditModalOpen(false);
      setSelectedPart(null);
    } catch (error: unknown) { // FIX: Replaced 'any' with 'unknown' and added type guard
      console.error("Error updating part:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      alert("Error updating part: " + errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredParts = useMemo(() => {
    let currentParts = parts.filter(
      (part) => {
        const lowerCaseSearch = search.toLowerCase();
        const matchesSearch =
          part?.description?.toLowerCase().includes(lowerCaseSearch) ||
          part?.boxNumber?.toLowerCase().includes(lowerCaseSearch) ||
          part.category.toLowerCase().includes(lowerCaseSearch) ||
          part.deviceModel.some(model => model.toLowerCase().includes(lowerCaseSearch)) ||
          part.brand.some(brandName => brandName.toLowerCase().includes(lowerCaseSearch));

        const matchesCategory =
          selectedCategoryFilter === "All" || part.category === selectedCategoryFilter;

        const matchesStatus =
          selectedStatusFilter === "All" || part.status === selectedStatusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
      }
    );

    if (showLowStockOnly) {
      currentParts = currentParts.filter(part => part.isLowStock);
    }

    return currentParts;
  }, [parts, search, selectedCategoryFilter, selectedStatusFilter, showLowStockOnly]);

  const MobileSparePartListItem: React.FC<{ part: SparePart }> = ({ part }) => (
    <div className="flex items-start p-3 border-b border-gray-100 last:border-b-0 bg-white shadow-md rounded-lg mb-3">
        {/* Image Thumbnail */}
        <div className="flex-shrink-0 mr-3">
            {part.imageUrl ? (
                // FIX: Replaced <img> with <Image>
                <Image
                    src={part.imageUrl}
                    alt={part.category}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-cover rounded-md shadow-sm border border-gray-200"
                />
            ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-[0.65rem] text-center p-1 leading-tight">No Image</div>
            )}
        </div>

        <div className="flex-grow min-w-0 flex flex-col">
            {/* Top Row: Category (Big & Highlighted) and Status */}
            <div className="flex items-center justify-between w-full mb-1">
                <h3 className="font-extrabold text-base text-blue-800 break-words pr-2 leading-tight">
                    {part.category}
                </h3>
                <span
                    className={`px-2 py-0.5 rounded-full text-[0.65rem] font-semibold flex-shrink-0 ml-2 ${
                        part.status === "in-stock"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                    }`}
                >
                    {part.status === "in-stock" ? "In Stock" : "Out"}
                </span>
            </div>

            {/* Box Number */}
            {part.boxNumber && (
                <p className="text-sm font-semibold text-gray-700 mt-0.5 mb-1">
                    Box No: <span className="text-blue-600 font-bold">{part.boxNumber}</span>
                </p>
            )}

            {/* Brand(s) and Model(s) - as grouped badges */}
            {(part.brand.length > 0 || part.deviceModel.length > 0) && (
                <div className="flex flex-col gap-1 mb-2">
                    {part.brand.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                            <span className="text-xs font-medium text-gray-700">Brands:</span>
                            {part.brand.map((b, index) => (
                                <Badge key={index} className="bg-purple-100 text-purple-800 text-[0.6rem] py-0.5 px-1.5 font-medium">
                                    {b}
                                </Badge>
                            ))}
                        </div>
                    )}
                    {part.deviceModel.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                            <span className="text-xs font-medium text-gray-700">Models:</span>
                            {part.deviceModel.map((model, index) => (
                                <Badge key={index} className="bg-blue-100 text-blue-800 text-[0.6rem] py-0.5 px-1.5 font-medium">
                                    {model}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Quantity, Price, and Low Stock + Actions Dropdown */}
            <div className="flex items-center justify-between mt-auto pt-1 border-t border-gray-200">
                <div className="flex items-center gap-3">
                    <p className="text-base font-extrabold text-green-700">₹{part.price.toFixed(2)}</p>
                    <p className={`text-sm font-semibold ${part.isLowStock ? 'text-red-700' : 'text-gray-700'}`}>
                        Qty: {part.quantity}
                    </p>
                    {part.isLowStock && (
                        <span className="text-red-500 text-[0.6rem] font-bold animate-pulse">!LOW</span>
                    )}
                </div>

                {/* Dropdown Menu for Actions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-gray-500 hover:text-blue-700 hover:bg-gray-100">
                            <MoreVertical size={18} />
                            <span className="sr-only">Actions</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 text-sm shadow-lg">
                        <DropdownMenuItem
                            onClick={() => {
                                setSelectedPart(part);
                                setEditModalOpen(true);
                            }}
                            className="cursor-pointer flex items-center gap-2 py-1.5 hover:bg-gray-50 transition-colors"
                            disabled={actionLoading === part._id}
                        >
                            {actionLoading === part._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pencil size={14} />}
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => toggleStock(part._id, part.status)}
                            className="cursor-pointer flex items-center gap-2 py-1.5 hover:bg-gray-50 transition-colors"
                            disabled={actionLoading === part._id}
                        >
                            {actionLoading === part._id ? <Loader2 className="h-3 w-3 animate-spin" /> : (
                                part.status === "in-stock" ? <Tag size={14} /> : <Layers size={14} />
                            )}
                            {part.status === "in-stock" ? "Mark Out" : "Mark In"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => deletePart(part._id)}
                            className="cursor-pointer text-red-600 hover:text-red-700 flex items-center gap-2 py-1.5 hover:bg-red-50 transition-colors"
                            disabled={actionLoading === part._id}
                        >
                            {actionLoading === part._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 size={14} />}
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    </div>
  );


  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-white to-blue-50 min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-6 text-center sm:text-left drop-shadow-sm">
          Spare Parts Inventory
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center mb-6 flex-wrap">
          <div className="relative w-full sm:w-auto flex-grow-[2]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search by category, model(s), brand(s), description, or box number..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 w-full shadow-md" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-auto py-2 shadow-md">
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedStatusFilter}
            onValueChange={(value) => setSelectedStatusFilter(value as "All" | "in-stock" | "out-of-stock")}
          >
            <SelectTrigger className="w-full sm:w-[150px] h-auto py-2 shadow-md">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="lowStockFilter"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="lowStockFilter" className="text-sm font-medium text-gray-700">
              Show Low Stock Only
            </label>
          </div>

          <Button
            onClick={() => {
                setAddFormInitialData({
                    deviceModel: [],
                    brand: [],
                    quantity: 0,
                    price: 0,
                    imageUrl: "",
                    description: "",
                    category: selectedCategoryFilter !== "All" ? selectedCategoryFilter : CATEGORIES[0],
                    boxNumber: "",
                });
                setAddModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 shadow-md transition-all duration-200 flex items-center gap-2 group transform active:scale-95 w-full sm:w-auto"
            disabled={actionLoading === "add"}
          >
            {actionLoading === "add" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlusCircle className="group-hover:scale-110 transition-transform duration-200" size={20} />
            )}
            Add New Spare Part
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-blue-600">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            Loading spare parts...
          </div>
        ) : filteredParts.length === 0 ? (
          <div className="text-center text-gray-500 p-10 border rounded-lg bg-white shadow-sm">
            <p className="text-lg mb-2">No spare parts found.</p>
            {(search || selectedCategoryFilter !== "All" || selectedStatusFilter !== "All" || showLowStockOnly) && (
              <p className="text-sm">Try adjusting your search or filters.</p>
            )}
            <Button onClick={() => setAddModalOpen(true)} className="mt-4 bg-blue-500 hover:bg-blue-600">
              Add the first part
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on extra small screens, shown on sm and up) */}
            <div className="hidden sm:block overflow-x-auto rounded-lg shadow-lg border border-gray-100 bg-white">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Image</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[80px]">Box No.</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Brand(s)</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Model(s)</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredParts.map((part) => (
                    <tr key={part._id} className="border-t hover:bg-blue-50 transition-colors duration-150 ease-in-out">
                      <td className="p-3 whitespace-nowrap">
                        {part.imageUrl ? (
                          // FIX: Replaced <img> with <Image>
                          <Image
                            src={part.imageUrl}
                            alt={part.category}
                            width={56}
                            height={56}
                            className="w-14 h-14 object-cover rounded-md shadow-sm border border-gray-200"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-[0.6rem] text-center p-1">No Image</div>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap text-gray-800 text-sm font-semibold">{part.boxNumber || '-'}</td>
                      <td className="p-3 whitespace-normal text-gray-700 max-w-[150px]">
                        {part.brand && part.brand.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {part.brand.map((b, index) => (
                              <Badge key={index} className="bg-purple-100 text-purple-800 text-xs py-0.5 px-2">
                                {b}
                              </Badge>
                            ))}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="p-3 whitespace-normal text-gray-700 max-w-[180px]">
                        {part.deviceModel && part.deviceModel.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {part.deviceModel.map((model, index) => (
                              <Badge key={index} className="bg-blue-100 text-blue-800 text-xs py-0.5 px-2">
                                {model}
                              </Badge>
                            ))}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="p-3 whitespace-nowrap text-blue-800 text-base font-bold">{part.category}</td>
                      <td className="p-3 whitespace-nowrap text-gray-700 text-sm">
                        <span className={`${part.isLowStock ? 'font-bold text-red-600' : ''}`}>
                          {part.quantity}
                        </span>
                        {part.isLowStock && (
                          <span className="ml-2 text-red-500 text-xs font-semibold">
                            (Low!)
                          </span>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap text-gray-700 text-sm font-semibold">₹{part.price.toFixed(2)}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            part.status === "in-stock"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {part.status === "in-stock" ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            onClick={() => {
                              setSelectedPart(part);
                              setEditModalOpen(true);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white w-8 h-8 rounded-md shadow-sm transition-all duration-200 transform active:scale-95"
                            disabled={actionLoading === part._id}
                          >
                            {actionLoading === part._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Pencil size={14} />
                            )}
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            size="icon"
                            onClick={() => toggleStock(part._id, part.status)}
                            className={`w-8 h-8 rounded-md shadow-sm transition-all duration-200 transform active:scale-95 ${
                              part.status === "in-stock"
                                ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                : "bg-green-500 hover:bg-green-600 text-white"
                            }`}
                            disabled={actionLoading === part._id}
                          >
                            {actionLoading === part._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                part.status === "in-stock" ? <Tag size={14} /> : <Layers size={14} />
                            )}
                            <span className="sr-only">{part.status === "in-stock" ? "Mark Out" : "Mark In"}</span>
                          </Button>
                          <Button
                            size="icon"
                            onClick={() => deletePart(part._id)}
                            className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-md shadow-sm transition-all duration-200 transform active:scale-95"
                            disabled={actionLoading === part._id}
                          >
                            {actionLoading === part._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List View (Shown on extra small screens, hidden on sm and up) */}
            <div className="sm:hidden flex flex-col gap-2">
              {filteredParts.map((part) => (
                <MobileSparePartListItem key={part._id} part={part} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Part Modal using SparePartForm */}
      <SparePartForm
        isOpen={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSubmit={handleAddSubmit}
        isEditMode={false}
        actionLoading={actionLoading === "add"}
        allBrands={allBrands}
        onAddBrandToAll={handleAddBrandToAll}
        initialData={addFormInitialData}
      />

      {/* Edit Part Modal using SparePartForm */}
      {selectedPart && (
        <SparePartForm
          isOpen={editModalOpen}
          onOpenChange={setEditModalOpen}
          initialData={{
             deviceModel: selectedPart.deviceModel,
             brand: selectedPart.brand,
             quantity: selectedPart.quantity,
             price: selectedPart.price,
             category: selectedPart.category,
             imageUrl: selectedPart.imageUrl,
             description: selectedPart.description,
             boxNumber: selectedPart.boxNumber,
          }}
          onSubmit={handleEditSubmit}
          isEditMode={true}
          actionLoading={actionLoading === selectedPart._id}
          allBrands={allBrands}
          onAddBrandToAll={handleAddBrandToAll}
        />
      )}
    </div>
  );
}