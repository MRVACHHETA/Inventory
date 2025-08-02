// File: src/app/billing/_components/BillItemsSection.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BillItemFormData, SparePart } from '@/app/billing/_components/types';

interface BillItemsSectionProps {
  billItems: BillItemFormData[];
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  // FIX: Added 'partSearchTerm' back to the interface to fix the type error
  partSearchTerm: string;
  handlePartSearch: (term: string) => void;
  searchResultsParts: SparePart[];
  selectedPartToAdd: SparePart | null;
  handleSelectPartToAdd: (partId: string) => void;
  handleAddItem: () => void;
  handleItemQuantityChange: (index: number, newQuantity: number) => void;
  handleItemPriceChange: (index: number, newPrice: number) => void;
  handleRemoveItem: (index: number) => void;
  openPartSearch: boolean;
  setOpenPartSearch: (open: boolean) => void;
}

const BillItemsSection: React.FC<BillItemsSectionProps> = ({
  billItems,
  categories,
  selectedCategory,
  setSelectedCategory,
  // FIX: Added 'partSearchTerm' back to the destructuring
  partSearchTerm,
  handlePartSearch,
  searchResultsParts,
  selectedPartToAdd,
  handleSelectPartToAdd,
  handleAddItem,
  handleItemQuantityChange,
  handleItemPriceChange,
  handleRemoveItem,
  openPartSearch,
  setOpenPartSearch,
}) => {
  return (
    <Card>
      <CardHeader className="p-2 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl">Bill Items</CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
          <div className='space-y-1'>
            <Label className="text-sm">Select Category</Label>
            <Select value={selectedCategory} onValueChange={(value) => {
                setSelectedCategory(value);
            }}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1 col-span-1 md:col-span-2'>
            <Label className="text-sm">Search Part</Label>
            <Popover open={openPartSearch} onOpenChange={setOpenPartSearch}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openPartSearch}
                  className="w-full justify-between h-8 text-sm"
                >
                  {selectedPartToAdd ? (
                    <span className="truncate">
                      {selectedPartToAdd.category} ({selectedPartToAdd.deviceModel.join(', ')})
                    </span>
                  ) : (
                    "Select a part..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[calc(100vw-1rem)] md:w-[500px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search parts..."
                    onValueChange={(value) => handlePartSearch(value)}
                  />
                  <CommandEmpty>No parts found.</CommandEmpty>
                  <CommandGroup heading="Spare Parts" className="max-h-60 overflow-y-auto">
                    {searchResultsParts.map((p) => (
                      <CommandItem
                        key={p._id}
                        onSelect={() => handleSelectPartToAdd(p._id)}
                        value={`${p.category} ${p.deviceModel.join(' ')} ${p.brand.join(' ')} ${p.boxNumber || ''}`}
                        className="text-sm"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedPartToAdd?._id === p._id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1 truncate">
                          {p.category} ({p.deviceModel.join(', ')})
                          {p.boxNumber && <span className="ml-2 font-bold text-red-500">Box: {p.boxNumber}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground ml-2">
                           Stock: {p.quantity} - Price: ₹{p.price}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedPartToAdd && (
              <div className="mt-1 p-2 border rounded-md bg-green-50 dark:bg-green-900/20 text-xs">
                Selected: {selectedPartToAdd.category} ({selectedPartToAdd.deviceModel.join(', ')}) - Stock: {selectedPartToAdd.quantity} - Price: ₹{selectedPartToAdd.price} {selectedPartToAdd.boxNumber && `(Box: ${selectedPartToAdd.boxNumber})`}
                {selectedPartToAdd.quantity <= 5 && selectedPartToAdd.quantity > 0 && <span className="text-orange-600 font-semibold ml-2"> (Low Stock!)</span>}
                {selectedPartToAdd.quantity === 0 && <span className="text-red-600 font-semibold ml-2"> (OUT OF STOCK!)</span>}
              </div>
            )}
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleAddItem}
              disabled={!selectedPartToAdd || selectedPartToAdd.quantity <= 0}
              className="w-full h-8"
            >
              Add to Bill
            </Button>
          </div>
        </div>
        
        <Separator className="my-3" />

        {billItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">Add items to the bill to see them here.</p>
        ) : (
          <>
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="w-[80px]">Qty</TableHead>
                      <TableHead className="w-[120px]">Unit Price (₹)</TableHead>
                      <TableHead>Subtotal (₹)</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.name}
                          {item.boxNumber && (
                            <span className="ml-2 font-bold text-red-500">Box: {item.boxNumber}</span>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {item.brand.join(', ')} ({item.deviceModel.join(', ')})
                          </p>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemQuantityChange(index, parseInt(e.target.value) || 0)}
                            min="1"
                            className="w-[60px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemPriceChange(index, parseFloat(e.target.value) || 0)}
                            className="w-[100px]"
                          />
                        </TableCell>
                        <TableCell>₹{item.subtotal.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="destructive" size="sm" onClick={() => handleRemoveItem(index)}>
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="block md:hidden space-y-2">
              {billItems.map((item, index) => (
                <div key={index} className="border rounded-md p-2">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {item.name}
                        {item.boxNumber && (
                          <span className="ml-2 font-bold text-red-500">Box: {item.boxNumber}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.brand.join(', ')} ({item.deviceModel.join(', ')})
                      </p>
                    </div>
                    <Button variant="destructive" size="icon" onClick={() => handleRemoveItem(index)} className="w-7 h-7 flex-shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-end space-x-1 text-xs">
                    <div className="flex-1 flex flex-col space-y-1">
                      <Label className="text-muted-foreground text-[10px]">Qty</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemQuantityChange(index, parseInt(e.target.value) || 0)}
                        min="1"
                        className="w-full h-8 text-xs p-1"
                      />
                    </div>
                    <div className="flex-1 flex flex-col space-y-1">
                      <Label className="text-muted-foreground text-[10px]">Unit Price (₹)</Label>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemPriceChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full h-8 text-xs p-1"
                      />
                    </div>
                    <div className="flex-1 flex flex-col space-y-1">
                      <Label className="text-muted-foreground text-[10px]">Subtotal</Label>
                      <div className="font-semibold text-foreground mt-1 text-sm pt-2">
                          ₹{item.subtotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BillItemsSection;