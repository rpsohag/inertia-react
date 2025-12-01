import BackendLayout from '@/Layouts/BackendLayout';
import { Head, router, Link } from '@inertiajs/react';
import {
    ColumnDef,
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
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, MoreHorizontal, Settings2, PlusCircle, X, Check, Trash2, UserPlus, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import TableSkeleton from '@/components/ui/table-skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import { Separator } from "@/components/ui/separator"
import { toast } from 'sonner'

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: string;
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
        status?: string[];
    };
    statusCounts: {
        active: number;
        inactive: number;
    };
}

interface DataTableFacetedFilterProps {
    title: string
    options: {
        label: string
        value: string
        count: number
    }[]
    selectedValues: string[]
    onSelectionChange: (values: string[]) => void
}

function DataTableFacetedFilter({
    title,
    options,
    selectedValues,
    onSelectionChange,
}: DataTableFacetedFilterProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {title}
                    {selectedValues.length > 0 && (
                        <>
                            <Separator orientation="vertical" className="mx-2 h-4" />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal lg:hidden"
                            >
                                {selectedValues.length}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {selectedValues.length > 2 ? (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {selectedValues.length} selected
                                    </Badge>
                                ) : (
                                    options
                                        .filter((option) => selectedValues.includes(option.value))
                                        .map((option) => (
                                            <Badge
                                                variant="secondary"
                                                key={option.value}
                                                className="rounded-sm px-1 font-normal"
                                            >
                                                {option.label}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={title} />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selectedValues.includes(option.value)
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => {
                                            if (isSelected) {
                                                onSelectionChange(selectedValues.filter((value) => value !== option.value))
                                            } else {
                                                onSelectionChange([...selectedValues, option.value])
                                            }
                                        }}
                                    >
                                        <div
                                            className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${isSelected
                                                ? 'bg-primary text-primary-foreground'
                                                : 'opacity-50 [&_svg]:invisible'
                                                }`}
                                        >
                                            <Check className="h-4 w-4" />
                                        </div>
                                        <span>{option.label}</span>
                                        <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                                            {option.count}
                                        </span>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                        {selectedValues.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={() => onSelectionChange([])}
                                        className="justify-center text-center"
                                    >
                                        Clear filters
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

const Users = ({ users, filters, statusCounts }: PageProps) => {
    const [search, setSearch] = useState(filters.search || '')
    const [debouncedSearch] = useDebounce(search, 300)
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(filters.status || [])
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})
    const [perPage, setPerPage] = useState(users.per_page || 10)
    const [isLoading, setIsLoading] = useState(false)

    const [isEditOpen, setIsEditOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [editName, setEditName] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editPhone, setEditPhone] = useState('')
    const [editStatus, setEditStatus] = useState('')
    const [saving, setSaving] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createName, setCreateName] = useState('')
    const [createEmail, setCreateEmail] = useState('')
    const [createPhone, setCreatePhone] = useState('')
    const [createPassword, setCreatePassword] = useState('')
    const [createPasswordConfirmation, setCreatePasswordConfirmation] = useState('')
    const [createStatus, setCreateStatus] = useState('active')
    const [creating, setCreating] = useState(false)
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [importing, setImporting] = useState(false)

    const columns: ColumnDef<User>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
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
            accessorKey: 'phone',
            header: 'Phone',
            cell: ({ row }) => row.getValue('phone'),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => row.getValue('status'),
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
                                    setEditPhone(user.phone)
                                    setEditStatus(user.status)
                                    setIsEditOpen(true)
                                }}
                            >
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                    setUserToDelete(user)
                                    setIsDeleteOpen(true)
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
            { name: editName, email: editEmail, phone: editPhone, status: editStatus },
            {
                preserveState: true,
                replace: true,
                onSuccess: () => {
                    setSaving(false)
                    setIsEditOpen(false)
                    setSelectedUser(null)
                    toast.success('User updated successfully')
                },
                onError: () => {
                    setSaving(false)
                    toast.error('Failed to update user. Please check the form and try again.')
                },
            }
        )
    }

    const handleDelete = () => {
        if (!userToDelete) return

        router.delete(route('users.destroy', userToDelete.id), {
            preserveState: true,
            replace: true,
            onSuccess: () => {
                toast.success("User deleted successfully")
                setIsDeleteOpen(false)
                setUserToDelete(null)
            },
            onError: () => {
                toast.error("Failed to delete user")
            },
        })
    }

    const handleBulkDelete = () => {
        const selectedIds = Object.keys(rowSelection)
        if (selectedIds.length === 0) return

        router.post(
            route('users.bulk-delete'),
            { ids: selectedIds },
            {
                preserveState: true,
                replace: true,
                onSuccess: () => {
                    toast.success(`${selectedIds.length} user(s) deleted successfully`)
                    setIsBulkDeleteOpen(false)
                    setRowSelection({})
                },
                onError: () => {
                    toast.error("Failed to delete users")
                },
            }
        )
    }

    const handleCreate = () => {
        setCreating(true)
        router.post(
            route('users.store'),
            {
                name: createName,
                email: createEmail,
                phone: createPhone,
                password: createPassword,
                password_confirmation: createPasswordConfirmation,
                status: createStatus,
            },
            {
                preserveState: true,
                replace: true,
                onSuccess: () => {
                    setCreating(false)
                    setIsCreateOpen(false)
                    setCreateName('')
                    setCreateEmail('')
                    setCreatePhone('')
                    setCreatePassword('')
                    setCreatePasswordConfirmation('')
                    setCreateStatus('active')
                    toast.success('User created successfully')
                },
                onError: () => {
                    setCreating(false)
                    toast.error('Failed to create user. Please check the form and try again.')
                },
            }
        )
    }

    const handleImport = (file: File) => {
        setImporting(true)
        const formData = new FormData()
        formData.append('file', file)

        router.post(route('users.import'), formData, {
            forceFormData: true,
            preserveState: true,
            replace: true,
            onSuccess: () => {
                setImporting(false)
                setIsImportOpen(false)
                toast.success('Users imported successfully')
            },
            onError: () => {
                setImporting(false)
                toast.error('Failed to import users. Please check the file format.')
            },
        })
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
        getRowId: (row) => row.id.toString(),
        state: { sorting, columnVisibility, rowSelection },
        manualPagination: true,
        pageCount: users.last_page,
    })

    useEffect(() => {
        const currentSearch = filters.search || '';
        const currentStatus = filters.status || [];

        if (debouncedSearch !== currentSearch || perPage !== users.per_page || JSON.stringify(selectedStatuses) !== JSON.stringify(currentStatus)) {
            router.get(
                route('users.index'),
                {
                    search: debouncedSearch,
                    per_page: perPage,
                    status: selectedStatuses.length > 0 ? selectedStatuses : undefined
                },
                {
                    preserveState: true,
                    replace: true,
                }
            );
        }
    }, [debouncedSearch, perPage, selectedStatuses]);

    useEffect(() => {
        const removeStart = router.on('start', () => setIsLoading(true));
        const removeFinish = router.on('finish', () => setIsLoading(false));

        return () => {
            removeStart();
            removeFinish();
        };
    }, []);

    return (
        <BackendLayout>
            <Head title="Users" />
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
                        <p>Manage all the users from here</p>
                    </div>
                    <div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => setIsImportOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            className="ml-auto"
                            onClick={() => setIsCreateOpen(true)}
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Create
                        </Button>
                    </div>
                </div>

                <div className="flex items-center py-4 gap-2">

                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <DataTableFacetedFilter
                        title="Status"
                        options={[
                            { label: 'Active', value: 'active', count: statusCounts.active },
                            { label: 'Inactive', value: 'inactive', count: statusCounts.inactive },
                        ]}
                        selectedValues={selectedStatuses}
                        onSelectionChange={setSelectedStatuses}
                    />
                    {Object.keys(rowSelection).length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setIsBulkDeleteOpen(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Selected ({Object.keys(rowSelection).length})
                        </Button>
                    )}

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

                {selectedStatuses.length > 0 && (
                    <div className="flex items-center gap-2">
                        {selectedStatuses.map((status) => (
                            <Badge key={status} variant="secondary" className="rounded-sm px-1 font-normal">
                                {status === 'active' ? 'Active' : 'Inactive'}
                                <button
                                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    onClick={() => setSelectedStatuses(selectedStatuses.filter(s => s !== status))}
                                >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                            </Badge>
                        ))}
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedStatuses([])}
                            className="h-8 px-2 lg:px-3"
                        >
                            Clear filters
                        </Button>
                    </div>
                )}

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
                            {isLoading ? (
                                <TableSkeleton />
                            ) : table.getRowModel().rows?.length ? (
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
                        {Object.keys(rowSelection).length} of{' '}
                        {users.total} row(s) selected.
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
                        <div className="flex w-[130px] items-center justify-center text-sm font-medium">
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
                <EditUserModal
                    open={isEditOpen}
                    onOpenChange={(open) => {
                        setIsEditOpen(open)
                        if (!open) setSelectedUser(null)
                    }}
                    name={editName}
                    email={editEmail}
                    phone={editPhone}
                    status={editStatus}
                    setName={setEditName}
                    setEmail={setEditEmail}
                    setPhone={setEditPhone}
                    setStatus={setEditStatus}
                    onSave={handleUpdate}
                    saving={saving}
                />
                <DeleteUserModal
                    open={isDeleteOpen}
                    onOpenChange={(open) => {
                        setIsDeleteOpen(open)
                        if (!open) setUserToDelete(null)
                    }}
                    user={userToDelete}
                    onConfirm={handleDelete}
                />
                <BulkDeleteModal
                    open={isBulkDeleteOpen}
                    onOpenChange={setIsBulkDeleteOpen}
                    count={Object.keys(rowSelection).length}
                    onConfirm={handleBulkDelete}
                />
                <CreateUserModal
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                    name={createName}
                    email={createEmail}
                    phone={createPhone}
                    password={createPassword}
                    passwordConfirmation={createPasswordConfirmation}
                    status={createStatus}
                    setName={setCreateName}
                    setEmail={setCreateEmail}
                    setPhone={setCreatePhone}
                    setPassword={setCreatePassword}
                    setPasswordConfirmation={setCreatePasswordConfirmation}
                    setStatus={setCreateStatus}
                    onCreate={handleCreate}
                    creating={creating}
                />
                <ImportUserModal
                    open={isImportOpen}
                    onOpenChange={setIsImportOpen}
                    onImport={handleImport}
                    importing={importing}
                />

            </div>
        </BackendLayout>
    )
}

// Edit Modal
function EditUserModal({
    open,
    onOpenChange,
    name,
    email,
    phone,
    status,
    setName,
    setEmail,
    setPhone,
    setStatus,
    onSave,
    saving,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    name: string
    email: string
    phone: string
    status: string
    setName: (v: string) => void
    setEmail: (v: string) => void
    setPhone: (v: string) => void
    setStatus: (v: string) => void
    onSave: () => void
    saving: boolean
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Update the user's details below.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="edit-name">Name</label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="edit-email">Email</label>
                        <Input
                            id="edit-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="edit-phone">Phone</label>
                        <Input
                            id="edit-phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="edit-status">Status</label>

                        <Select
                            value={status}
                            onValueChange={(value) => setStatus(value)}
                        >
                            <SelectTrigger id="edit-status">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={onSave} disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function DeleteUserModal({
    open,
    onOpenChange,
    user,
    onConfirm,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: User | null
    onConfirm: () => void
}) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete User?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {user ? (
                            <>
                                Are you sure you want to delete <b>{user.name}</b>?
                                This action cannot be undone.
                            </>
                        ) : (
                            "Are you sure you want to delete this user?"
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-white hover:bg-destructive/90"
                        onClick={onConfirm}
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}





function BulkDeleteModal({
    open,
    onOpenChange,
    count,
    onConfirm,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    count: number
    onConfirm: () => void
}) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete {count} User{count !== 1 ? 's' : ''}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete {count} selected user{count !== 1 ? 's' : ''}?
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-white hover:bg-destructive/90"
                        onClick={onConfirm}
                    >
                        Delete {count} User{count !== 1 ? 's' : ''}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

function CreateUserModal({
    open,
    onOpenChange,
    name,
    email,
    phone,
    password,
    passwordConfirmation,
    status,
    setName,
    setEmail,
    setPhone,
    setPassword,
    setPasswordConfirmation,
    setStatus,
    onCreate,
    creating,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    name: string
    email: string
    phone: string
    password: string
    passwordConfirmation: string
    status: string
    setName: (v: string) => void
    setEmail: (v: string) => void
    setPhone: (v: string) => void
    setPassword: (v: string) => void
    setPasswordConfirmation: (v: string) => void
    setStatus: (v: string) => void
    onCreate: () => void
    creating: boolean
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                        Add a new user to the system.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="create-name">Name</label>
                        <Input
                            id="create-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter user name"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="create-email">Email</label>
                        <Input
                            id="create-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="create-phone">Phone</label>
                        <Input
                            id="create-phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Enter phone number"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="create-password">Password</label>
                        <Input
                            id="create-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="create-password-confirmation">Confirm Password</label>
                        <Input
                            id="create-password-confirmation"
                            type="password"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            placeholder="Confirm password"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="create-status">Status</label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="create-status">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
                        Cancel
                    </Button>
                    <Button onClick={onCreate} disabled={creating}>
                        {creating ? "Creating..." : "Create User"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ImportUserModal({
    open,
    onOpenChange,
    onImport,
    importing,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onImport: (file: File) => void
    importing: boolean
}) {
    const [file, setFile] = useState<File | null>(null)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import Users</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to import users. The CSV should have headers: name, email, phone, password, status.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="import-file">CSV File</label>
                        <Input
                            id="import-file"
                            type="file"
                            accept=".csv"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
                        Cancel
                    </Button>
                    <Button onClick={() => file && onImport(file)} disabled={!file || importing}>
                        {importing ? "Importing..." : "Import"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default Users