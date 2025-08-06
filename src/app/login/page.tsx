// src/app/login/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, Phone, BatteryCharging, Wrench, Cpu, Speaker, Camera } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    // This is a pre-login check. If a user is already logged in, redirect them.
    if (typeof window !== 'undefined' && localStorage.getItem('user')) {
      // You can redirect to the homepage or a specific page here
      router.push('/');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (email === 'super@admin.com' && password === 'password123') {
        const user = { name: 'Super Admin', email: 'super@admin.com', role: 'super_admin' };
        localStorage.setItem('user', JSON.stringify(user));
        toast.success(t('login.success'));
        router.push('/');
      } else if (email === 'admin@admin.com' && password === 'password123') {
        const user = { name: 'Admin User', email: 'admin@admin.com', role: 'admin' };
        localStorage.setItem('user', JSON.stringify(user));
        toast.success(t('login.success'));
        router.push('/');
      } else if (email === 'staff@staff.com' && password === 'password123') {
        const user = { name: 'Staff Member', email: 'staff@staff.com', role: 'staff' };
        localStorage.setItem('user', JSON.stringify(user));
        toast.success(t('login.success'));
        router.push('/');
      } else {
        toast.error(t('login.invalid_credentials'));
      }
    } catch (error) {
      toast.error(t('login.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const FloatingIcons = () => (
    <>
      {/* Brighter icons for better visibility */}
      <Phone className="absolute top-1/4 left-[10%] text-white floating-icon" size={40} />
      <BatteryCharging className="absolute top-[20%] right-[5%] text-purple-200 floating-icon" size={40} />
      <Wrench className="absolute bottom-1/4 left-[20%] text-indigo-300 floating-icon" size={40} />
      <Cpu className="absolute top-[45%] left-1/2 text-pink-200 floating-icon" size={40} />
      <Speaker className="absolute bottom-[10%] right-[25%] text-teal-200 floating-icon" size={40} />
      <Camera className="absolute top-[5%] left-[30%] text-rose-200 floating-icon" size={40} />
      <Phone className="absolute bottom-[40%] right-[15%] text-white floating-icon" size={40} />
    </>
  );

  return (
    <div className="relative flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden p-4 font-satoshi">
      {/* Enhanced Background Gradient for a more luxurious feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1E2B4B] via-[#8B5CF6] to-[#EC4899] animate-gradient-xy" />
      <FloatingIcons />

      <Card className="w-full max-w-sm mx-auto p-6 md:p-8 shadow-3xl backdrop-blur-md bg-white/70 dark:bg-gray-800/70 z-10 border-indigo-200 dark:border-indigo-700 transition-transform duration-300 hover:scale-[1.01] rounded-2xl">
        <CardHeader className="text-center space-y-4">
          <Link href="/" className="flex items-center justify-center space-x-2">
            <Image
              src="/inventory-logo.png"
              alt="Sai Chetna Logo"
              width={80}
              height={80}
              className="rounded-xl transition-transform duration-300 hover:scale-110"
            />
          </Link>
          
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{t('app.title')}</CardTitle>
          <CardDescription className="text-base text-gray-700 dark:text-gray-300 font-medium">{t('login.subtitle_extended')}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-semibold">{t('login.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="eg. user@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-semibold">{t('login.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('login.logging_in')}
                </>
              ) : (
                t('login.login')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}