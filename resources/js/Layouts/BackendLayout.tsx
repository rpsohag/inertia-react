import { PropsWithChildren } from 'react';
import { Head } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';

export default function BackendLayout({ children }: PropsWithChildren) {
    return (
        <>
            <Head title="Dashboard" />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <Header fixed />
                    <main className="p-6">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
