import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';

// Define the necessary interfaces.
interface CustomerFormData {
  _id?: string;
  name: string;
  phone: string;
  address?: string;
}

interface EditCustomerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customerToEdit: CustomerFormData | null;
  setCustomerToEdit: React.Dispatch<React.SetStateAction<CustomerFormData | null>>;
  handleUpdateCustomer: () => void;
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  onOpenChange,
  customerToEdit,
  setCustomerToEdit,
  handleUpdateCustomer,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>Update the details for {customerToEdit?.name}.</DialogDescription>
        </DialogHeader>
        {customerToEdit && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={customerToEdit.name}
                onChange={(e) => setCustomerToEdit({ ...customerToEdit, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                value={customerToEdit.phone}
                onChange={(e) => setCustomerToEdit({ ...customerToEdit, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="editAddress">Address</Label>
              <Textarea
                id="editAddress"
                value={customerToEdit.address || ''}
                onChange={(e) => setCustomerToEdit({ ...customerToEdit, address: e.target.value })}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleUpdateCustomer}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCustomerModal;