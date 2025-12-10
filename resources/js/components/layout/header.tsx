import React from "react";
import { Link, usePage } from "@inertiajs/react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/mode-toggle";
import { PageProps } from "@/types/page";

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
    fixed?: boolean;
}

export const Header = ({
    className,
    fixed,
    children,
    ...props
}: HeaderProps) => {
    const [offset, setOffset] = React.useState(0);
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user;

    React.useEffect(() => {
        const onScroll = () => {
            setOffset(
                document.body.scrollTop || document.documentElement.scrollTop
            );
        };

        document.addEventListener("scroll", onScroll, { passive: true });
        return () => document.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            className={`flex items-center gap-3 sm:gap-4 bg-background p-4 h-16 ${
                fixed ? "sticky top-0 z-50" : ""
            } ${offset > 10 && fixed ? "shadow" : "shadow-none"} ${
                className || ""
            }`}
            {...props}
        >
            <SidebarTrigger className="scale-125 sm:scale-100" />
            <Separator orientation="vertical" className="h-6" />

            <div className="flex-1">
                <h2 className="text-lg font-semibold tracking-tight">
                    Dashboard
                </h2>
            </div>

            <ModeToggle />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-lg hover:bg-accent p-1.5 transition-colors">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {user?.name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-left text-sm hidden sm:block">
                            <p className="font-medium leading-none">
                                {user?.name || "User"}
                            </p>
                            <p className="text-muted-foreground text-xs mt-0.5">
                                {user?.email || ""}
                            </p>
                        </div>
                        <svg
                            className="w-4 h-4 text-muted-foreground hidden sm:block"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {user?.name || "User"}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user?.email || ""}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                            <Link href="#" className="cursor-pointer">
                                <svg
                                    className="mr-2 h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                                Profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="#" className="cursor-pointer">
                                <svg
                                    className="mr-2 h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                                Settings
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link
                            href={route("logout")}
                            method="post"
                            as="button"
                            className="w-full cursor-pointer"
                        >
                            <svg
                                className="mr-2 h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                            Log out
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {children}
        </header>
    );
};

Header.displayName = "Header";
