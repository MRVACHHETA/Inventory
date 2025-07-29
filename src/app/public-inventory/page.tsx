// src/app/public-inventory/page.tsx
// This file is a Server Component by default (no 'use client' directive here)

import { Suspense } from 'react'; // Import Suspense from React
import PublicInventoryClient from './PublicInventoryClient'; // Import your new Client Component (without .tsx extension)
import { Loader2 } from 'lucide-react'; // <-- ADD THIS LINE

export default function PublicInventoryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen text-blue-600">
        <Loader2 className="h-10 w-10 animate-spin mr-2" />
        Loading inventory...
      </div>
    }>
      <PublicInventoryClient />
    </Suspense>
  );
}