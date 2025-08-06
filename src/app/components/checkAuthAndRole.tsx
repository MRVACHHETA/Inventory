'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
// Add this import to fix the error
import { Loader2 } from 'lucide-react';

export type UserRole = 'super_admin' | 'admin' | 'staff';

interface AuthProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function CheckAuthAndRole({ children, allowedRoles }: AuthProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ role: UserRole } | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      toast.error('You must be logged in to view this page.');
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setIsAuthChecking(false);

    if (!allowedRoles.includes(parsedUser.role)) {
      toast.error('You do not have permission to access this page.');
      router.push('/admin/dashboard');
    }
  }, [router, allowedRoles]);

  if (isAuthChecking || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}