'use client';
import { createClient } from '@/lib/supabase';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ArrowRight, Calendar, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);

  // Smart Entry Point: Redirect to Admin Dashboard if logged in
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Fetch role to determine redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        const role = profile?.role?.toLowerCase();
        if (role === 'owner' || role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/staff');
        }
      } else {
        setIsLoading(false);
      }
    };
    checkSession();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/icon-180.png" alt="Reelin Bookings" className="w-20 h-20 animate-pulse" />
          <h2 className="text-xl font-bold text-gray-900">Reelin Bookings</h2>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white isolate animate-in fade-in duration-500">
      {/* Background Decor */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-200 to-primary-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5 flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900 tracking-tight">
                Reelin <span className="text-primary-600">Bookings</span>
              </span>
            </a>
          </div>
          <div className="flex flex-1 justify-end gap-x-6">
            {/* Header actions removed per request */}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <div className="relative isolate px-6 pt-10 lg:px-8">
        <div className="mx-auto max-w-4xl py-24 sm:py-32 lg:py-40">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-7xl">
              Effortless bookings.<br />Happy clients.
            </h1>
            <p className="mt-8 text-xl leading-8 text-gray-600">
              A complete appointment scheduling platform compatible with any service business.
              Modern, reliable, and built to help you grow.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/signup">
                <Button size="lg" className="rounded-full px-8 bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/30 hover:shadow-xl transition-all">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="rounded-full px-8 border-gray-200 text-gray-900 hover:bg-gray-50 bg-white/50 backdrop-blur-sm">
                  Log In <span aria-hidden="true" className="ml-2">&rarr;</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Gradient Decor */}
        <div
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-primary-200 to-primary-600 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
      </div>

      {/* Feature Grid */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24 mt-4 sm:mt-12 lg:mt-20">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Core Capabilities</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Everything you need to run your shop</p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Streamline your view of the day, manage your team, and give your clients a booking experience they'll actually enjoy.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col relative group">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary-600 font-bold shadow-lg shadow-primary-600/20 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                Zero-Friction Booking
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">Clients book in seconds without creating confusing accounts. A smooth, app-like mobile experience that increases conversion and delight.</p>
              </dd>
            </div>
            <div className="flex flex-col relative group">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary-600 font-bold shadow-lg shadow-primary-600/20 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                Team & Roster Control
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">Easily manage multiple staff members, assign specific services, and control individual working hours from one central command center.</p>
              </dd>
            </div>
            <div className="flex flex-col relative group">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary-600 font-bold shadow-lg shadow-primary-600/20 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                Operational Clarity
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">A visual dashboard that gives you instant insight into your day. Manage walk-ins, complex rescheduling, and cancellations with zero headaches.</p>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
