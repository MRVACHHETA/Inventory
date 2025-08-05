'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
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

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useTranslation } from "react-i18next";

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

  const { t, i18n } = useTranslation();

  const [parts, setParts] = useState<SparePart[]>([]);
  const [search, setSearch] = useState("");
  const [boxNumberSearch, setBoxNumberSearch] = useState("");
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
    } catch (error: unknown) {
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
    if (!confirm(t('common.confirmDelete'))) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/spare-parts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setParts((prev) => prev.filter((p) => p._id !== id));
      } else {
        const error = await res.text();
        alert(t('common.deleteFailed') + error);
      }
    } catch (error: unknown) {
      console.error("Error deleting part:", error);
      const errorMessage = error instanceof Error ? error.message : t('common.unknownError');
      alert(t('common.deleteError') + errorMessage);
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
        alert(t('common.updateStatusFailed') + error);
      }
    } catch (error: unknown) {
      console.error("Error toggling stock:", error);
      const errorMessage = error instanceof Error ? error.message : t('common.unknownError');
      alert(t('common.toggleStockError') + errorMessage);
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
        return alert(t('common.addFailed') + error);
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
    } catch (error: unknown) {
      console.error("Error adding part:", error);
      const errorMessage = error instanceof Error ? error.message : t('common.unknownError');
      alert(t('common.addError') + errorMessage);
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
        return alert(t('common.updateFailed') + error);
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
    } catch (error: unknown) {
      console.error("Error updating part:", error);
      const errorMessage = error instanceof Error ? error.message : t('common.unknownError');
      alert(t('common.updateError') + errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredParts = useMemo(() => {
    let currentParts = parts.filter(
      (part) => {
        const lowerCaseSearch = search.toLowerCase();
        const lowerCaseBoxNumberSearch = boxNumberSearch.toLowerCase();

        const matchesSearch =
          (part?.description?.toLowerCase().includes(lowerCaseSearch) ||
          part.category.toLowerCase().includes(lowerCaseSearch) ||
          part.deviceModel.some(model => model.toLowerCase().includes(lowerCaseSearch)) ||
          part.brand.some(brandName => brandName.toLowerCase().includes(lowerCaseSearch)));

        const matchesBoxNumber =
          !boxNumberSearch || (part?.boxNumber?.toLowerCase().includes(lowerCaseBoxNumberSearch));

        const matchesCategory =
          selectedCategoryFilter === "All" || part.category === selectedCategoryFilter;

        const matchesStatus =
          selectedStatusFilter === "All" || part.status === selectedStatusFilter;

        return matchesSearch && matchesBoxNumber && matchesCategory && matchesStatus;
      }
    );

    if (showLowStockOnly) {
      currentParts = currentParts.filter(part => part.isLowStock);
    }

    return currentParts;
  }, [parts, search, boxNumberSearch, selectedCategoryFilter, selectedStatusFilter, showLowStockOnly]);

  const MobileSparePartListItem: React.FC<{ part: SparePart }> = ({ part }) => (
    <div className="flex items-start p-4 border-b border-gray-100 last:border-b-0 bg-white shadow-md rounded-lg mb-4">
        <div className="flex-shrink-0 mr-4">
            {part.imageUrl ? (
                <Image
                    src={part.imageUrl}
                    alt={part.category}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded-md shadow-sm border border-gray-200"
                />
            ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-sm text-center p-1 leading-tight">{t('spareParts.table.noImage')}</div>
            )}
        </div>

        <div className="flex-grow min-w-0 flex flex-col">
            <div className="flex items-center justify-between w-full mb-1">
                <h3 className="font-extrabold text-lg text-blue-800 break-words pr-2 leading-tight">
                    {t(`spareParts.categories.${part.category}`)}
                </h3>
                <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${
                        part.status === "in-stock"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                    }`}
                >
                    {part.status === "in-stock" ? t('spareParts.inStock') : t('spareParts.outOfStock')}
                </span>
            </div>

            {part.boxNumber && (
                <p className="text-sm font-semibold text-gray-700 mt-0.5 mb-2">
                    {t('spareParts.boxNoPlaceholder')}: <span className="inline-block px-2 py-1 bg-yellow-400 text-yellow-950 rounded-md text-base font-bold tracking-wide shadow-sm">{part.boxNumber}</span>
                </p>
            )}

            {(part.brand.length > 0 || part.deviceModel.length > 0) && (
                <div className="flex flex-col gap-1 mb-2">
                    {part.brand.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                            <span className="text-sm font-medium text-gray-700">{t('spareParts.table.brands')}:</span>
                            {part.brand.map((b, index) => (
                                <Badge key={index} className="bg-purple-100 text-purple-800 text-xs py-0.5 px-1.5 font-medium">
                                    {b}
                                </Badge>
                            ))}
                        </div>
                    )}
                    {part.deviceModel.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                            <span className="text-sm font-medium text-gray-700">{t('spareParts.table.models')}:</span>
                            {part.deviceModel.map((model, index) => (
                                <Badge key={index} className="bg-blue-100 text-blue-800 text-xs py-0.5 px-1.5 font-medium">
                                    {model}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-200">
                <div className="flex items-center gap-4">
                    <p className="text-lg font-extrabold text-green-700">₹{part.price.toFixed(2)}</p>
                    <p className={`text-base font-semibold ${part.isLowStock ? 'text-red-700' : 'text-gray-700'}`}>
                        {t('spareParts.table.qty')}: {part.quantity}
                    </p>
                    {part.isLowStock && (
                        <span className="text-red-500 text-xs font-bold animate-pulse">!{t('spareParts.table.low')}</span>
                    )}
                </div>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full text-gray-500 hover:text-blue-700 hover:bg-gray-100">
                            <MoreVertical size={20} />
                            <span className="sr-only">{t('spareParts.table.actions')}</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="w-full h-auto p-4 rounded-t-lg">
                        <SheetHeader className="mb-4">
                            <SheetTitle>{t('spareParts.actions.partActions')}</SheetTitle>
                            <SheetDescription>
                                Actions for: {t(`spareParts.categories.${part.category}`)} ({part.deviceModel.join(', ')})
                            </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-2">
                            <Button
                                onClick={() => {
                                    setSelectedPart(part);
                                    setEditModalOpen(true);
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white w-full justify-start gap-2"
                                disabled={actionLoading === part._id}
                            >
                                {actionLoading === part._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil size={18} />}
                                {t('spareParts.actions.edit')}
                            </Button>
                            <Button
                                onClick={() => toggleStock(part._id, part.status)}
                                className={`${
                                    part.status === "in-stock"
                                        ? "bg-yellow-500 hover:bg-yellow-600"
                                        : "bg-green-500 hover:bg-green-600"
                                } text-white w-full justify-start gap-2`}
                                disabled={actionLoading === part._id}
                            >
                                {actionLoading === part._id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                    part.status === "in-stock" ? <Tag size={18} /> : <Layers size={18} />
                                )}
                                {part.status === "in-stock" ? t('spareParts.actions.markOutOfStock') : t('spareParts.actions.markInStock')}
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => deletePart(part._id)}
                                className="bg-red-500 hover:bg-red-600 text-white w-full justify-start gap-2"
                                disabled={actionLoading === part._id}
                            >
                                {actionLoading === part._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={18} />}
                                {t('spareParts.actions.delete')}
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    </div>
  );


  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-white to-blue-50 min-h-[calc(100vh-80px)]">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-6 text-center sm:text-left drop-shadow-sm">
          {t('spareParts.title')}
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center mb-6 flex-wrap">
          <div className="relative w-full sm:w-auto flex-grow-[2]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder={t('spareParts.searchPlaceholder')}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 w-full shadow-md"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-[150px]">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder={t('spareParts.boxNoPlaceholder')}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 w-full shadow-md"
              value={boxNumberSearch}
              onChange={(e) => setBoxNumberSearch(e.target.value)}
            />
          </div>

          <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-auto py-2 shadow-md">
              <SelectValue placeholder={t('spareParts.categoryFilter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t('spareParts.allCategories')}</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {t(`spareParts.categories.${cat}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedStatusFilter}
            onValueChange={(value) => setSelectedStatusFilter(value as "All" | "in-stock" | "out-of-stock")}
          >
            <SelectTrigger className="w-full sm:w-[150px] h-auto py-2 shadow-md">
              <SelectValue placeholder={t('spareParts.statusFilter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t('spareParts.allStatuses')}</SelectItem>
              <SelectItem value="in-stock">{t('spareParts.inStock')}</SelectItem>
              <SelectItem value="out-of-stock">{t('spareParts.outOfStock')}</SelectItem>
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
              {t('spareParts.lowStockOnly')}
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
            {t('spareParts.addPart')}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-blue-600">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            {t('spareParts.loading')}
          </div>
        ) : filteredParts.length === 0 ? (
          <div className="text-center text-gray-500 p-10 border rounded-lg bg-white shadow-sm">
            <p className="text-lg mb-2">{t('spareParts.noPartsFound')}</p>
            {(search || boxNumberSearch || selectedCategoryFilter !== "All" || selectedStatusFilter !== "All" || showLowStockOnly) && (
              <p className="text-sm">{t('spareParts.adjustSearch')}</p>
            )}
            <Button onClick={() => setAddModalOpen(true)} className="mt-4 bg-blue-500 hover:bg-blue-600">
              {t('spareParts.addFirstPart')}
            </Button>
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto rounded-lg shadow-lg border border-gray-100 bg-white">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('spareParts.table.image')}</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[80px]">{t('spareParts.table.boxNo')}</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('spareParts.table.brands')}</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('spareParts.table.models')}</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('spareParts.table.category')}</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('spareParts.table.qty')}</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('spareParts.table.price')}</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('spareParts.table.status')}</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('spareParts.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredParts.map((part) => (
                    <tr key={part._id} className="border-t hover:bg-blue-50 transition-colors duration-150 ease-in-out">
                      <td className="p-3 whitespace-nowrap">
                        {part.imageUrl ? (
                          <Image
                            src={part.imageUrl}
                            alt={part.category}
                            width={56}
                            height={56}
                            className="w-14 h-14 object-cover rounded-md shadow-sm border border-gray-200"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-[0.6rem] text-center p-1">{t('spareParts.table.noImage')}</div>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap text-gray-800 text-sm font-semibold">
                          <span className="inline-block px-2 py-1 bg-yellow-400 text-yellow-950 rounded-md text-base font-bold tracking-wide shadow-sm">{part.boxNumber || '-'}</span>
                      </td>
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
                      <td className="p-3 whitespace-nowrap text-blue-800 text-lg font-bold">
                        {t(`spareParts.categories.${part.category}`)}
                      </td>
                      <td className="p-3 whitespace-nowrap text-gray-700 text-base">
                        <span className={`${part.isLowStock ? 'font-bold text-red-600' : ''}`}>
                          {part.quantity}
                        </span>
                        {part.isLowStock && (
                          <span className="ml-2 text-red-500 text-sm font-semibold">
                            {t('spareParts.table.low')}
                          </span>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap text-gray-700 text-base font-semibold">₹{part.price.toFixed(2)}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            part.status === "in-stock"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {part.status === "in-stock" ? t('spareParts.inStock') : t('spareParts.outOfStock')}
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
                            <span className="sr-only">{t('spareParts.actions.edit')}</span>
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
                            <span className="sr-only">{part.status === "in-stock" ? t('spareParts.actions.markOutOfStock') : t('spareParts.actions.markInStock')}</span>
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
                            <span className="sr-only">{t('spareParts.actions.delete')}</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden flex flex-col gap-4">
              {filteredParts.map((part) => (
                <MobileSparePartListItem key={part._id} part={part} />
              ))}
            </div>
          </>
        )}
      </div>

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