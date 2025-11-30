import BackendLayout from '@/Layouts/BackendLayout';
import { Head, router, Link } from '@inertiajs/react';
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, MoreHorizontal, Settings2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'

interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PageProps {
    users: {
        data: User[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        per_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    filters: {
        search?: string;
    };
}

/* columns moved inside Users component to access state for edit/delete actions */

const Users = ({ users, filters }: PageProps) => {
    const [search, setSearch] = useState(filters.search || '')
    const [debouncedSearch] = useDebounce(search, 300)
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})
    const [perPage, setPerPage] = useState(users.per_page || 10)

    const [isEditOpen, setIsEditOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [editName, setEditName] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [saving, setSaving] = useState(false)

    const columns: ColumnDef<User>[] = [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
        },
        {
            accessorKey: 'email',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Email
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
        },
        {
            accessorKey: 'created_at',
            header: 'Joined',
            cell: ({ row }) => new Date(row.getValue('created_at')).toLocaleDateString(),
        },
        {
            id: 'actions',
            enableHiding: false,
            cell: ({ row }) => {
                const user = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => {
                                    setSelectedUser(user)
                                    setEditName(user.name)
                                    setEditEmail(user.email)
                                    setIsEditOpen(true)
                                }}
                            >
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                    if (confirm('Are you sure you want to delete this user?')) {
                                        router.delete(route('users.destroy', user.id), {
                                            preserveState: false,
                                            replace: true,
                                        })
                                    }
                                }}
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    const handleUpdate = () => {
        if (!selectedUser) return
        setSaving(true)
        router.put(
            route('users.update', selectedUser.id),
            { name: editName, email: editEmail },
            {
                preserveState: false,
                replace: true,
                onSuccess: () => {
                    setSaving(false)
                    setIsEditOpen(false)
                    setSelectedUser(null)
                },
                onError: () => {
                    setSaving(false)
                },
            }
        )
    }

    const table = useReactTable({
        data: users.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: { sorting, columnVisibility, rowSelection },
        manualPagination: true,
        pageCount: users.last_page,
    })

    useEffect(() => {
        if (debouncedSearch !== filters.search || perPage !== users.per_page) {
            router.get(
                route('users.index'),
                { search: debouncedSearch, per_page: perPage },
                { preserveState: true, replace: true }
            );
        }
    }, [debouncedSearch, perPage]);

    return (
        <BackendLayout>
            <Head title="Users" />
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Users</h2>
                </div>

                <div className="flex items-center py-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                <Settings2 className="mr-2 h-4 w-4" />
                                View
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && 'selected'}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} of{' '}
                        {table.getFilteredRowModel().rows.length} row(s) selected.
                    </div>
                    <div className="flex items-center space-x-6 lg:space-x-8">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">Rows per page</p>
                            <Select
                                value={`${perPage}`}
                                onValueChange={(value) => {
                                    setPerPage(Number(value));
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={perPage} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 30, 40, 50].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                            Page {users.current_page} of {users.last_page}
                        </div>
                        <div className="flex items-center space-x-2">
                            {users.prev_page_url ? (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={users.prev_page_url} preserveScroll preserveState>
                                        <ChevronLeft className="h-4 w-4 mr-2" />
                                        Previous
                                    </Link>
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" disabled>
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Previous
                                </Button>
                            )}
                            {users.next_page_url ? (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={users.next_page_url} preserveScroll preserveState>
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-2" />
                                    </Link>
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" disabled>
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                <EditUserSheet
                    open={isEditOpen}
                    onOpenChange={(open) => {
                        setIsEditOpen(open)
                        if (!open) setSelectedUser(null)
                    }}
                    name={editName}
                    email={editEmail}
                    setName={setEditName}
                    setEmail={setEditEmail}
                    onSave={handleUpdate}
                    saving={saving}
                />
            </div>
        </BackendLayout>
    )
}

// Edit Modal
function EditUserSheet({
    open,
    onOpenChange,
    name,
    email,
    setName,
    setEmail,
    onSave,
    saving,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    name: string
    email: string
    setName: (v: string) => void
    setEmail: (v: string) => void
    onSave: () => void
    saving: boolean
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Edit User</SheetTitle>
                    <SheetDescription>Update the user's details below.</SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="edit-name">Name</label>
                        <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="edit-email">Email</label>
                        <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                </div>
                <SheetFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
                    <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

export default Users