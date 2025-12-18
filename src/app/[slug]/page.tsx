import React, { Suspense } from 'react';
import BookingPageContent from '@/components/booking/BookingPageContent';

export default function OrganizationBookingPage({ params }: { params: Promise<{ slug: string }> }) {
    // React 19 / Next.js 15: params is a Promise. We use React.use() to unwrap it in a server component.
    // Or just await it if async function.
    // However, since this is a Server Component, we can just await it.
    // But `React.use` is flexible. Let's use `await` to be standard async server component.

    // Wait, params is a Promise in Next.js 15.
    // Let's use React.use() which is the modern way, but `use` is only for client components or use cache in server?
    // Actually, in Server Components, you can await params.

    // Simpler: Just make component async.
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading booking experience...</div>}>
            <AsyncPageWrapper params={params} />
        </Suspense>
    );
}

// Wrapper to handle async params inside Suspense if needed, or just do it inline.
// Actually, let's unpack params inside a component that calls the client component.
async function AsyncPageWrapper({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <BookingPageContent slug={slug} />;
}
