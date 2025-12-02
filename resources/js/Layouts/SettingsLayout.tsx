import { PropsWithChildren } from 'react';
import { Head, Link } from '@inertiajs/react';
import BackendLayout from './BackendLayout';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SettingsLayoutProps extends PropsWithChildren {
    title: string;
}

const settingsNav = [
    { name: 'Profile', href: 'settings.profile' },
    { name: 'Account', href: 'settings.account' },
    { name: 'Appearance', href: 'settings.appearance' },
    { name: 'Notifications', href: 'settings.notifications' },
    { name: 'Display', href: 'settings.display' },
];

export default function SettingsLayout({ title, children }: SettingsLayoutProps) {
    return (
        <BackendLayout>
            <Head title={title} />
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your account settings and set e-mail preferences.
                    </p>
                </div>
                <Separator />
                <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                    <aside className="lg:w-1/5">
                        <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                            {settingsNav.map((item) => (
                                <Link
                                    key={item.href}
                                    href={route(item.href)}
                                    className={cn(
                                        'inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 px-4 py-2 hover:bg-transparent hover:underline justify-start',
                                        route().current(item.href)
                                            ? 'bg-muted hover:bg-muted'
                                            : 'hover:bg-transparent hover:underline'
                                    )}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </aside>
                    <div className="flex-1 lg:max-w-2xl">{children}</div>
                </div>
            </div>
        </BackendLayout>
    );
}
