import { Link } from '@inertiajs/react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { NavUser } from '@/components/layout/nav-user';
import { Bell, Eye, Home, Palette, Settings, User, UserPlus, Wrench, BadgeQuestionMark, Server, Key } from 'lucide-react';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const navItems = [
        {
            title: 'Dashboard',
            href: route('dashboard'),
            icon: <Home />,
            isActive: route().current('dashboard'),
        },
    ];

    const settingsMenuItems = [
        { title: 'Profile', href: route('settings.profile'), icon: <User /> },
        { title: 'Account', href: route('settings.account'), icon: <Wrench /> },
        { title: 'Appearance', href: route('settings.appearance'), icon: <Palette /> },
        { title: 'Notifications', href: route('settings.notifications'), icon: <Bell /> },
        { title: 'Display', href: route('settings.display'), icon: <Eye /> },
    ];

    const sshMenuItems = [
        { title: 'Servers', href: route('ssh.servers'), icon: <Server /> },
        { title: 'SSH Keys', href: route('ssh.ssh-keys'), icon: <Key /> },
    ];

    return (
        <Sidebar collapsible="icon" variant="floating" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={route('dashboard')}>
                                <div className="flex items-center gap-2">
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                        <span className="font-bold text-sm">AP</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 leading-none">
                                        <span className="font-semibold">Admin Panel</span>
                                        <span className="text-xs text-muted-foreground">Dashboard</span>
                                    </div>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {/* Dashboard */}
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={item.isActive}>
                                        <Link href={item.href}>
                                            {item.icon}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}

                            {/* Users */}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={route().current('users.*')}>
                                    <Link href={route('users.index')}>
                                        <UserPlus />
                                        <span>Users</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
             <SidebarGroup>
                    <SidebarGroupLabel>Servers</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <Collapsible defaultOpen={false} className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton>
                                            <Server />
                                            <span>Servers</span>
                                            <svg
                                                className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90 w-4 h-4"
                                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {sshMenuItems.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton asChild>
                                                        <Link href={subItem.href}>
                                                            {subItem.icon}
                                                            <span>{subItem.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>Settings</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <Collapsible defaultOpen={false} className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton>
                                            <Settings />
                                            <span>Settings</span>
                                            <svg
                                                className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90 w-4 h-4"
                                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {settingsMenuItems.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton asChild>
                                                        <Link href={subItem.href}>
                                                            {subItem.icon}
                                                            <span>{subItem.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href="#">
                                        <BadgeQuestionMark />
                                        <span>Help Center</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
