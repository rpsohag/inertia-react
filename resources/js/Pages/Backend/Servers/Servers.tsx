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
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, MoreHorizontal, Settings2, PlusCircle, X, Check, Trash2, ServerIcon } from 'lucide-react';
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
import { TerminalModal } from '@/components/TerminalModal';

interface Server {
    id: number;
    name: string;
    ip_address: string;
    port: string;
    username: string;
    status: string;
    auth_type: string;
    ssh_key_id?: number | null;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PageProps {
    servers: {
        data: Server[];
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
        auth_type?: string[];
    };
    statusCounts: {
        active: number;
        inactive: number;
    };
    authTypeCounts: {
        password: number;
        private_key: number;
    };
    sshKeys: Array<{ id: number; name: string }>;
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

const Servers = ({ servers, filters, statusCounts, authTypeCounts, sshKeys }: PageProps) => {
    const [search, setSearch] = useState(filters.search || '')
    const [debouncedSearch] = useDebounce(search, 300)
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(filters.status || [])
    const [selectedAuthTypes, setSelectedAuthTypes] = useState<string[]>(filters.auth_type || [])
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})
    const [perPage, setPerPage] = useState(servers.per_page || 10)
    const [isLoading, setIsLoading] = useState(false)

    const [isEditOpen, setIsEditOpen] = useState(false)
    const [selectedServer, setSelectedServer] = useState<Server | null>(null)
    const [editName, setEditName] = useState('')
    const [editIpAddress, setEditIpAddress] = useState('')
    const [editPort, setEditPort] = useState('')
    const [editUsername, setEditUsername] = useState('')
    const [editStatus, setEditStatus] = useState('')
    const [editAuthType, setEditAuthType] = useState('')
    const [editSshKeyId, setEditSshKeyId] = useState('')
    const [editPassword, setEditPassword] = useState('')
    const [saving, setSaving] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [serverToDelete, setServerToDelete] = useState<Server | null>(null)
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createName, setCreateName] = useState('')
    const [createIpAddress, setCreateIpAddress] = useState('')
    const [createPort, setCreatePort] = useState('22')
    const [createUsername, setCreateUsername] = useState('')
    const [createPassword, setCreatePassword] = useState('')
    const [createSshKeyId, setCreateSshKeyId] = useState('')
    const [createStatus, setCreateStatus] = useState('active')
    const [createAuthType, setCreateAuthType] = useState('password')
    const [creating, setCreating] = useState(false)

    const [isTerminalOpen, setIsTerminalOpen] = useState(false)
    const [terminalServer, setTerminalServer] = useState<Server | null>(null)

    const columns: ColumnDef<Server>[] = [
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
            accessorKey: 'ip_address',
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    IP Address
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
        },
        {
            accessorKey: 'port',
            header: 'Port',
            cell: ({ row }) => row.getValue('port'),
        },
        {
            accessorKey: 'username',
            header: 'Username',
            cell: ({ row }) => row.getValue('username'),
        },
        {
            accessorKey: 'auth_type',
            header: 'Auth Type',
            cell: ({ row }) => {
                const authType = row.getValue('auth_type') as string;
                return (
                    <Badge variant={authType === 'password' ? 'default' : 'secondary'}>
                        {authType === 'password' ? 'Password' : 'Private Key'}
                    </Badge>
                )
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                return (
                    <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                        {status}
                    </Badge>
                )
            },
        },
        {
            accessorKey: 'created_at',
            header: 'Created',
            cell: ({ row }) => new Date(row.getValue('created_at')).toLocaleDateString(),
        },
        {
            id: 'actions',
            enableHiding: false,
            cell: ({ row }) => {
                const server = row.original
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
                                    setTerminalServer(server)
                                    setIsTerminalOpen(true)
                                }}
                            >
                                Open Terminal
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    setSelectedServer(server)
                                    setEditName(server.name)
                                    setEditIpAddress(server.ip_address)
                                    setEditPort(server.port)
                                    setEditUsername(server.username)
                                    setEditStatus(server.status)
                                    setEditAuthType(server.auth_type)
                                    setEditSshKeyId(server.ssh_key_id ? server.ssh_key_id.toString() : '')
                                    setEditPassword('')
                                    setIsEditOpen(true)
                                }}
                            >
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                    setServerToDelete(server)
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
        if (!selectedServer) return
        setSaving(true)
        router.put(
            route('ssh.servers.update', selectedServer.id),
            {
                name: editName,
                ip_address: editIpAddress,
                port: editPort,
                username: editUsername,
                status: editStatus,
                auth_type: editAuthType,
                ssh_key_id: editAuthType === 'private_key' ? editSshKeyId : null,
                password: editAuthType === 'password' ? editPassword : null,
            },
            {
                preserveState: true,
                replace: true,
                onSuccess: () => {
                    setSaving(false)
                    setIsEditOpen(false)
                    setSelectedServer(null)
                    toast.success('Server updated successfully')
                },
                onError: () => {
                    setSaving(false)
                    toast.error('Failed to update server. Please check the form and try again.')
                },
            }
        )
    }

    const handleDelete = () => {
        if (!serverToDelete) return

        router.delete(route('servers.destroy', serverToDelete.id), {
            preserveState: true,
            replace: true,
            onSuccess: () => {
                toast.success("Server deleted successfully")
                setIsDeleteOpen(false)
                setServerToDelete(null)
            },
            onError: () => {
                toast.error("Failed to delete server")
            },
        })
    }

    const handleBulkDelete = () => {
        const selectedIds = Object.keys(rowSelection)
        if (selectedIds.length === 0) return

        router.post(
            route('servers.bulk-delete'),
            { ids: selectedIds },
            {
                preserveState: true,
                replace: true,
                onSuccess: () => {
                    toast.success(`${selectedIds.length} server(s) deleted successfully`)
                    setIsBulkDeleteOpen(false)
                    setRowSelection({})
                },
                onError: () => {
                    toast.error("Failed to delete servers")
                },
            }
        )
    }

    const handleCreate = () => {
        setCreating(true)
        router.post(
            route('ssh.servers.store'),
            {
                name: createName,
                ip_address: createIpAddress,
                port: createPort,
                username: createUsername,
                password: createAuthType === 'password' ? createPassword : null,
                ssh_key_id: createAuthType === 'private_key' ? createSshKeyId : null,
                status: createStatus,
                auth_type: createAuthType,
            },
            {
                preserveState: true,
                replace: true,
                onSuccess: () => {
                    setCreating(false)
                    setIsCreateOpen(false)
                    setCreateName('')
                    setCreateIpAddress('')
                    setCreatePort('22')
                    setCreateUsername('')
                    setCreatePassword('')
                    setCreateSshKeyId('')
                    setCreateStatus('active')
                    setCreateAuthType('password')
                    toast.success('Server created successfully')
                },
                onError: () => {
                    setCreating(false)
                    toast.error('Failed to create server. Please check the form and try again.')
                },
            }
        )
    }

    const table = useReactTable({
        data: servers.data,
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
        pageCount: servers.last_page,
    })

    useEffect(() => {
        const currentSearch = filters.search || '';
        const currentStatus = filters.status || [];
        const currentAuthType = filters.auth_type || [];

        if (
            debouncedSearch !== currentSearch ||
            perPage !== servers.per_page ||
            JSON.stringify(selectedStatuses) !== JSON.stringify(currentStatus) ||
            JSON.stringify(selectedAuthTypes) !== JSON.stringify(currentAuthType)
        ) {
            router.get(
                route('ssh.servers'),
                {
                    search: debouncedSearch,
                    per_page: perPage,
                    status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
                    auth_type: selectedAuthTypes.length > 0 ? selectedAuthTypes : undefined
                },
                {
                    preserveState: true,
                    replace: true,
                }
            );
        }
    }, [debouncedSearch, perPage, selectedStatuses, selectedAuthTypes]);

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
            <Head title="Servers" />
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Servers</h2>
                        <p>Manage all the servers from here</p>
                    </div>
                    <div>
                        <Button
                            variant="default"
                            size="sm"
                            className="ml-auto"
                            onClick={() => setIsCreateOpen(true)}
                        >
                            <ServerIcon className="mr-2 h-4 w-4" />
                            Create
                        </Button>
                    </div>
                </div>

                <div className="flex items-center py-4 gap-2">

                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search servers..."
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
                    <DataTableFacetedFilter
                        title="Auth Type"
                        options={[
                            { label: 'Password', value: 'password', count: authTypeCounts.password },
                            { label: 'Private Key', value: 'private_key', count: authTypeCounts.private_key },
                        ]}
                        selectedValues={selectedAuthTypes}
                        onSelectionChange={setSelectedAuthTypes}
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

                {(selectedStatuses.length > 0 || selectedAuthTypes.length > 0) && (
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
                        {selectedAuthTypes.map((authType) => (
                            <Badge key={authType} variant="secondary" className="rounded-sm px-1 font-normal">
                                {authType === 'password' ? 'Password' : 'Private Key'}
                                <button
                                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    onClick={() => setSelectedAuthTypes(selectedAuthTypes.filter(a => a !== authType))}
                                >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                            </Badge>
                        ))}
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setSelectedStatuses([])
                                setSelectedAuthTypes([])
                            }}
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
                        {servers.total} row(s) selected.
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
                            Page {servers.current_page} of {servers.last_page}
                        </div>
                        <div className="flex items-center space-x-2">
                            {servers.prev_page_url ? (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={servers.prev_page_url} preserveScroll preserveState>
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
                            {servers.next_page_url ? (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={servers.next_page_url} preserveScroll preserveState>
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
                <EditServerModal
                    open={isEditOpen}
                    onOpenChange={(open) => {
                        setIsEditOpen(open)
                        if (!open) setSelectedServer(null)
                    }}
                    name={editName}
                    ipAddress={editIpAddress}
                    port={editPort}
                    username={editUsername}
                    status={editStatus}
                    authType={editAuthType}
                    sshKeyId={editSshKeyId}
                    password={editPassword}
                    sshKeys={sshKeys}
                    setName={setEditName}
                    setIpAddress={setEditIpAddress}
                    setPort={setEditPort}
                    setUsername={setEditUsername}
                    setStatus={setEditStatus}
                    setAuthType={setEditAuthType}
                    setSshKeyId={setEditSshKeyId}
                    setPassword={setEditPassword}
                    onSave={handleUpdate}
                    saving={saving}
                />
                <DeleteServerModal
                    open={isDeleteOpen}
                    onOpenChange={(open) => {
                        setIsDeleteOpen(open)
                        if (!open) setServerToDelete(null)
                    }}
                    server={serverToDelete}
                    onConfirm={handleDelete}
                />
                <BulkDeleteModal
                    open={isBulkDeleteOpen}
                    onOpenChange={setIsBulkDeleteOpen}
                    count={Object.keys(rowSelection).length}
                    onConfirm={handleBulkDelete}
                />
                <CreateServerModal
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                    name={createName}
                    ipAddress={createIpAddress}
                    port={createPort}
                    username={createUsername}
                    password={createPassword}
                    sshKeyId={createSshKeyId}
                    status={createStatus}
                    authType={createAuthType}
                    sshKeys={sshKeys}
                    setName={setCreateName}
                    setIpAddress={setCreateIpAddress}
                    setPort={setCreatePort}
                    setUsername={setCreateUsername}
                    setPassword={setCreatePassword}
                    setSshKeyId={setCreateSshKeyId}
                    setStatus={setCreateStatus}
                    setAuthType={setCreateAuthType}
                    onCreate={handleCreate}
                    creating={creating}
                />
                <TerminalModal
                    open={isTerminalOpen}
                    onOpenChange={(open) => {
                        setIsTerminalOpen(open)
                        if (!open) setTerminalServer(null)
                    }}
                    server={terminalServer}
                />

            </div>
        </BackendLayout>
    )
}

// Edit Modal
function EditServerModal({
    open,
    onOpenChange,
    name,
    ipAddress,
    port,
    username,
    status,
    authType,
    sshKeyId,
    password,
    sshKeys,
    setName,
    setIpAddress,
    setPort,
    setUsername,
    setStatus,
    setAuthType,
    setSshKeyId,
    setPassword,
    onSave,
    saving,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    name: string
    ipAddress: string
    port: string
    username: string
    status: string
    authType: string
    sshKeyId: string
    password: string
    sshKeys: Array<{ id: number; name: string }>
    setName: (v: string) => void
    setIpAddress: (v: string) => void
    setPort: (v: string) => void
    setUsername: (v: string) => void
    setStatus: (v: string) => void
    setAuthType: (v: string) => void
    setSshKeyId: (v: string) => void
    setPassword: (v: string) => void
    onSave: () => void
    saving: boolean
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Server</DialogTitle>
                    <DialogDescription>
                        Update the server's details below.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium" htmlFor="edit-name">Name</label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium" htmlFor="edit-ip">IP Address</label>
                            <Input
                                id="edit-ip"
                                value={ipAddress}
                                onChange={(e) => setIpAddress(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium" htmlFor="edit-port">Port</label>
                            <Input
                                id="edit-port"
                                value={port}
                                onChange={(e) => setPort(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium" htmlFor="edit-username">Username</label>
                            <Input
                                id="edit-username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium" htmlFor="edit-status">Status</label>
                            <Select
                                value={status}
                                onValueChange={(value) => setStatus(value)}
                                className='w-full'
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

                        <div className="grid gap-2">
                            <label className="text-sm font-medium" htmlFor="edit-auth-type">Auth Type</label>
                            <Select
                                value={authType}
                                onValueChange={(value) => setAuthType(value)}
                                className='w-full'
                            >
                                <SelectTrigger id="edit-auth-type">
                                    <SelectValue placeholder="Select auth type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="password">Password</SelectItem>
                                    <SelectItem value="private_key">Private Key</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {authType === 'password' && (
                        <div className="grid gap-2">
                            <label className="text-sm font-medium" htmlFor="edit-password">Password</label>
                            <Input
                                id="edit-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password (leave empty to keep current)"
                            />
                        </div>
                    )}

                    {authType === 'private_key' && (
                        <div className="grid gap-2">
                            <label className="text-sm font-medium" htmlFor="edit-ssh-key">SSH Key</label>
                            <Select value={sshKeyId} onValueChange={setSshKeyId} className='w-full'>
                                <SelectTrigger id="edit-ssh-key">
                                    <SelectValue placeholder="Select SSH Key" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sshKeys.map((key) => (
                                        <SelectItem key={key.id} value={key.id.toString()}>
                                            {key.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
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

function DeleteServerModal({
    open,
    onOpenChange,
    server,
    onConfirm,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    server: Server | null
    onConfirm: () => void
}) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Server?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {server ? (
                            <>
                                Are you sure you want to delete <b>{server.name}</b>?
                                This action cannot be undone.
                            </>
                        ) : (
                            "Are you sure you want to delete this server?"
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
                    <AlertDialogTitle>Delete {count} Server{count !== 1 ? 's' : ''}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete {count} selected server{count !== 1 ? 's' : ''}?
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-white hover:bg-destructive/90"
                        onClick={onConfirm}
                    >
                        Delete {count} Server{count !== 1 ? 's' : ''}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

function CreateServerModal({
    open,
    onOpenChange,
    name,
    ipAddress,
    port,
    username,
    password,
    sshKeyId,
    status,
    authType,
    sshKeys,
    setName,
    setIpAddress,
    setPort,
    setUsername,
    setPassword,
    setSshKeyId,
    setStatus,
    setAuthType,
    onCreate,
    creating,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    name: string
    ipAddress: string
    port: string
    username: string
    password: string
    sshKeyId: string
    status: string
    authType: string
    sshKeys: Array<{ id: number; name: string }>
    setName: (v: string) => void
    setIpAddress: (v: string) => void
    setPort: (v: string) => void
    setUsername: (v: string) => void
    setPassword: (v: string) => void
    setSshKeyId: (v: string) => void
    setStatus: (v: string) => void
    setAuthType: (v: string) => void
    onCreate: () => void
    creating: boolean
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Server</DialogTitle>
                    <DialogDescription>
                        Add a new server to the system.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium" htmlFor="create-name">Name</label>
                            <Input
                                id="create-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter server name"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium" htmlFor="create-ip">IP Address</label>
                            <Input
                                id="create-ip"
                                value={ipAddress}
                                onChange={(e) => setIpAddress(e.target.value)}
                                placeholder="Enter IP address"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium" htmlFor="create-port">Port</label>
                            <Input
                                id="create-port"
                                value={port}
                                onChange={(e) => setPort(e.target.value)}
                                placeholder="Enter port number"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium" htmlFor="create-username">Username</label>
                            <Input
                                id="create-username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium" htmlFor="create-status">Status</label>
                            <Select value={status} onValueChange={setStatus} className="w-full">
                                <SelectTrigger id="create-status">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium" htmlFor="create-auth-type">Auth Type</label>
                            <Select value={authType} onValueChange={setAuthType} className="w-full">
                                <SelectTrigger id="create-auth-type">
                                    <SelectValue placeholder="Select auth type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="password">Password</SelectItem>
                                    <SelectItem value="private_key">Private Key</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {authType === 'password' && (
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
                    )}

                    {authType === 'private_key' && (
                        <div className="grid gap-2">
                            <label className="text-sm font-medium" htmlFor="create-ssh-key">SSH Key</label>
                            <Select value={sshKeyId} onValueChange={setSshKeyId} className="w-full">
                                <SelectTrigger id="create-ssh-key">
                                    <SelectValue placeholder="Select SSH Key" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sshKeys.map((key) => (
                                        <SelectItem key={key.id} value={key.id.toString()}>
                                            {key.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
                        Cancel
                    </Button>
                    <Button onClick={onCreate} disabled={creating}>
                        {creating ? "Creating..." : "Create Server"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default Servers
