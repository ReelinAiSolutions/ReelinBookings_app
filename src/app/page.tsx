'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowRight, Calendar, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  const router = useRouter();

  // Smart Entry Point: Redirect to Admin Dashboard if logged in
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/admin');
      }
    };
    checkSession();
  }, [router]);

  return (
    <div className="bg-white animate-in fade-in duration-500">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5 flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                Reelin Bookings
              </span>
            </a>
          </div>
          <div className="flex flex-1 justify-end gap-x-6">
            <Link href="/login" className="text-sm font-semibold leading-6 text-gray-900">Log in <span aria-hidden="true">&rarr;</span></Link>
            <Link href="/signup" className="hidden lg:block bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-semibold">Get Started</Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Booking software for modern businesses
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Scalable, beautiful, and intelligent. The last booking platform you'll ever need.
              Host multiple clients, manage staff, and automate your workflow.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/demo-business">
                <Button size="lg" className="rounded-full px-8">View Live Demo <ArrowRight className="ml-2 w-4 h-4" /></Button>
              </Link>
              <a href="#" className="text-sm font-semibold leading-6 text-gray-900">Learn more <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Deploy Faster</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Everything you need to scale</p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                  <Calendar className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                Multi-Tenant Architecture
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">Unique URL for every client. Data isolation guaranteed by Row Level Security.</dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                  <Zap className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                AI Powered Description
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">Integrated Gemini AI helps your clients write compelling service descriptions in seconds.</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
