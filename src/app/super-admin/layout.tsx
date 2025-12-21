export const metadata = {
    title: 'Super Admin | Universal Booking',
    description: 'Internal tool for generating organization keys.',
};

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="bg-gray-50 min-h-screen">
            {children}
        </div>
    );
}
