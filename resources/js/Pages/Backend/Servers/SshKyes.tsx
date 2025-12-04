import BackendLayout from '@/Layouts/BackendLayout';
import { Head, router, Link } from '@inertiajs/react';
import axios from 'axios';
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
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, MoreHorizontal, Settings2, PlusCircle, X, Check, Trash2, KeyRound, Copy, Download } from 'lucide-react';
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

interface SshKey {
    id: number;
    name: string;
    key_size: number;
    public_key: string;
    private_key: string;
    type: string;
    fingerprint: string;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PageProps {
    sshKeys: {
        data: SshKey[];
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
        type?: string[];
    };
    typeCounts: {
        rsa: number;
        ed25519: number;
        ecdsa: number;
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

const SshKeys = ({ sshKeys, filters, typeCounts }: PageProps) => {
    const [search, setSearch] = useState(filters.search || '')
    const [debouncedSearch] = useDebounce(search, 300)
    const [selectedTypes, setSelectedTypes] = useState<string[]>(filters.type || [])
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})
    const [perPage, setPerPage] = useState(sshKeys.per_page || 10)
    const [isLoading, setIsLoading] = useState(false)

    const [isViewOpen, setIsViewOpen] = useState(false)
    const [selectedSshKey, setSelectedSshKey] = useState<SshKey | null>(null)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [sshKeyToDelete, setSshKeyToDelete] = useState<SshKey | null>(null)
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createName, setCreateName] = useState('')
    const [createAlgorithm, setCreateAlgorithm] = useState('rsa')
    const [createKeySize, setCreateKeySize] = useState('2048')
    const [createPassphrase, setCreatePassphrase] = useState('')
    const [creating, setCreating] = useState(false)

    // Success modal state for displaying generated keys
    const [isSuccessOpen, setIsSuccessOpen] = useState(false)
    const [generatedKeys, setGeneratedKeys] = useState<{
        public_key: string;
        private_key: string;
        fingerprint: string;
    } | null>(null)

    const columns: ColumnDef<SshKey>[] = [
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
            accessorKey: 'key_size',
            header: 'Key Size',
            cell: ({ row }) => {
                const keySize = row.getValue('key_size') as number;
                return (
                    <Badge variant="default">
                        {keySize}
                    </Badge>
                )
            },
        },
        {
            accessorKey: 'type',
            header: 'Type',
            cell: ({ row }) => {
                const type = row.getValue('type') as string;
                return (
                    <Badge variant="default">
                        {type.toUpperCase()}
                    </Badge>
                )
            },
        },
        {
            accessorKey: 'fingerprint',
            header: 'Fingerprint',
            cell: ({ row }) => {
                const fingerprint = row.getValue('fingerprint') as string;
                return (
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                        {fingerprint.length > 40 ? fingerprint.substring(0, 40) + '...' : fingerprint}
                    </code>
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
                const sshKey = row.original
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
                                    setSelectedSshKey(sshKey)
                                    setIsViewOpen(true)
                                }}
                            >
                                View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                    setSshKeyToDelete(sshKey)
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



    const handleDelete = () => {
        if (!sshKeyToDelete) return

        router.delete(route('ssh.ssh-keys.destroy', sshKeyToDelete.id), {
            preserveState: true,
            replace: true,
            onSuccess: () => {
                toast.success("SSH key deleted successfully")
                setIsDeleteOpen(false)
                setSshKeyToDelete(null)
            },
            onError: () => {
                toast.error("Failed to delete SSH key")
            },
        })
    }

    const handleBulkDelete = () => {
        const selectedIds = Object.keys(rowSelection)
        if (selectedIds.length === 0) return

        router.post(
            route('ssh.ssh-keys.bulk-delete'),
            { ids: selectedIds },
            {
                preserveState: true,
                replace: true,
                onSuccess: () => {
                    toast.success(`${selectedIds.length} SSH key(s) deleted successfully`)
                    setIsBulkDeleteOpen(false)
                    setRowSelection({})
                },
                onError: () => {
                    toast.error("Failed to delete SSH keys")
                },
            }
        )
    }

    const handleCreate = async () => {
        setCreating(true)

        try {
            const response = await axios.post(route('ssh.ssh-keys.store'), {
                name: createName,
                key_size: createKeySize,
                algorithm: createAlgorithm,
                passphrase: createPassphrase || null,
            });

            const data = response.data;

            if (data.success) {
                setCreating(false)
                setIsCreateOpen(false)

                // Store generated keys and show success modal
                setGeneratedKeys(data.generated_keys)
                setIsSuccessOpen(true)

                // Reset form
                setCreateName('')
                setCreateAlgorithm('rsa')
                setCreateKeySize('2048')
                setCreatePassphrase('')

                toast.success('SSH key generated successfully')

                // Reload the page to show the new key in the table
                router.reload({ only: ['sshKeys'] })
            } else {
                setCreating(false)
                toast.error('Failed to generate SSH key')
            }
        } catch (error) {
            setCreating(false)
            console.error(error)
            toast.error('Failed to generate SSH key. Please try again.')
        }
    }



    const table = useReactTable({
        data: sshKeys.data,
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
        pageCount: sshKeys.last_page,
    })

    useEffect(() => {
        const currentSearch = filters.search || '';
        const currentType = filters.type || [];

        if (
            debouncedSearch !== currentSearch ||
            perPage !== sshKeys.per_page ||
            JSON.stringify(selectedTypes) !== JSON.stringify(currentType)
        ) {
            router.get(
                route('ssh.ssh-keys'),
                {
                    search: debouncedSearch,
                    per_page: perPage,
                    type: selectedTypes.length > 0 ? selectedTypes : undefined
                },
                {
                    preserveState: true,
                    replace: true,
                }
            );
        }
    }, [debouncedSearch, perPage, selectedTypes]);

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
            <Head title="SSH Keys" />
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">SSH Keys</h2>
                        <p>Manage all the SSH keys from here</p>
                    </div>
                    <div>
                        <Button
                            variant="default"
                            size="sm"
                            className="ml-auto"
                            onClick={() => setIsCreateOpen(true)}
                        >
                            <KeyRound className="mr-2 h-4 w-4" />
                            Create
                        </Button>
                    </div>
                </div>

                <div className="flex items-center py-4 gap-2">

                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search SSH keys..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <DataTableFacetedFilter
                        title="Type"
                        options={[
                            { label: 'RSA', value: 'rsa', count: typeCounts.rsa },
                            { label: 'ED25519', value: 'ed25519', count: typeCounts.ed25519 },
                            { label: 'ECDSA', value: 'ecdsa', count: typeCounts.ecdsa },
                        ]}
                        selectedValues={selectedTypes}
                        onSelectionChange={setSelectedTypes}
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

                {selectedTypes.length > 0 && (
                    <div className="flex items-center gap-2">
                        {selectedTypes.map((type) => (
                            <Badge key={type} variant="secondary" className="rounded-sm px-1 font-normal">
                                {type.toUpperCase()}
                                <button
                                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    onClick={() => setSelectedTypes(selectedTypes.filter(t => t !== type))}
                                >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                            </Badge>
                        ))}
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedTypes([])}
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
                        {sshKeys.total} row(s) selected.
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
                            Page {sshKeys.current_page} of {sshKeys.last_page}
                        </div>
                        <div className="flex items-center space-x-2">
                            {sshKeys.prev_page_url ? (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={sshKeys.prev_page_url} preserveScroll preserveState>
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
                            {sshKeys.next_page_url ? (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={sshKeys.next_page_url} preserveScroll preserveState>
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
                <ViewSshKeyModal
                    open={isViewOpen}
                    onOpenChange={(open) => {
                        setIsViewOpen(open)
                        if (!open) setSelectedSshKey(null)
                    }}
                    sshKey={selectedSshKey}
                />
                <DeleteSshKeyModal
                    open={isDeleteOpen}
                    onOpenChange={(open) => {
                        setIsDeleteOpen(open)
                        if (!open) setSshKeyToDelete(null)
                    }}
                    sshKey={sshKeyToDelete}
                    onConfirm={handleDelete}
                />
                <BulkDeleteModal
                    open={isBulkDeleteOpen}
                    onOpenChange={setIsBulkDeleteOpen}
                    count={Object.keys(rowSelection).length}
                    onConfirm={handleBulkDelete}
                />
                <CreateSshKeyModal
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                    name={createName}
                    algorithm={createAlgorithm}
                    keySize={createKeySize}
                    passphrase={createPassphrase}
                    setName={setCreateName}
                    setAlgorithm={setCreateAlgorithm}
                    setKeySize={setCreateKeySize}
                    setPassphrase={setCreatePassphrase}
                    onCreate={handleCreate}
                    creating={creating}
                />
                <KeysSuccessModal
                    open={isSuccessOpen}
                    onOpenChange={setIsSuccessOpen}
                    generatedKeys={generatedKeys}
                />

            </div>
        </BackendLayout>
    )
}

// View Modal
function ViewSshKeyModal({
    open,
    onOpenChange,
    sshKey,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    sshKey: SshKey | null
}) {
    const [copiedPublic, setCopiedPublic] = useState(false)
    const [copiedPrivate, setCopiedPrivate] = useState(false)

    if (!sshKey) return null

    const copyToClipboard = async (text: string, type: 'public' | 'private') => {
        try {
            await navigator.clipboard.writeText(text)
            if (type === 'public') {
                setCopiedPublic(true)
                setTimeout(() => setCopiedPublic(false), 2000)
            } else {
                setCopiedPrivate(true)
                setTimeout(() => setCopiedPrivate(false), 2000)
            }
            toast.success(`${type === 'public' ? 'Public' : 'Private'} key copied to clipboard`)
        } catch (err) {
            toast.error('Failed to copy to clipboard')
        }
    }

    const downloadKey = (text: string, filename: string) => {
        const element = document.createElement("a");
        const file = new Blob([text], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>View SSH Key</DialogTitle>
                    <DialogDescription>
                        View and download the SSH key details.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input value={sshKey.name} readOnly />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Type</label>
                        <Input value={sshKey.type.toUpperCase()} readOnly />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Fingerprint</label>
                        <code className="text-xs bg-muted px-3 py-2 rounded block overflow-x-auto">
                            {sshKey.fingerprint}
                        </code>
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Public Key</label>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => copyToClipboard(sshKey.public_key, 'public')}
                                    title="Copy Public Key"
                                >
                                    {copiedPublic ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => downloadKey(sshKey.public_key, `${sshKey.name}.pub`)}
                                    title="Download Public Key"
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <textarea
                            readOnly
                            value={sshKey.public_key}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-muted px-3 py-2 text-xs font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Private Key</label>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => copyToClipboard(sshKey.private_key, 'private')}
                                    title="Copy Private Key"
                                >
                                    {copiedPrivate ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => downloadKey(sshKey.private_key, `${sshKey.name}`)}
                                    title="Download Private Key"
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <textarea
                            readOnly
                            value={sshKey.private_key}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-muted px-3 py-2 text-xs font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function DeleteSshKeyModal({
    open,
    onOpenChange,
    sshKey,
    onConfirm,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    sshKey: SshKey | null
    onConfirm: () => void
}) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete SSH Key?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {sshKey ? (
                            <>
                                Are you sure you want to delete <b>{sshKey.name}</b>?
                                This action cannot be undone.
                            </>
                        ) : (
                            "Are you sure you want to delete this SSH key?"
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
                    <AlertDialogTitle>Delete {count} SSH Key{count !== 1 ? 's' : ''}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete {count} selected SSH key{count !== 1 ? 's' : ''}?
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-white hover:bg-destructive/90"
                        onClick={onConfirm}
                    >
                        Delete {count} SSH Key{count !== 1 ? 's' : ''}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

function CreateSshKeyModal({
    open,
    onOpenChange,
    name,
    algorithm,
    keySize,
    passphrase,
    setName,
    setAlgorithm,
    setKeySize,
    setPassphrase,
    onCreate,
    creating,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    name: string
    algorithm: string
    keySize: string
    passphrase: string
    setName: (v: string) => void
    setAlgorithm: (v: string) => void
    setKeySize: (v: string) => void
    setPassphrase: (v: string) => void
    onCreate: () => void
    creating: boolean
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Generate New SSH Key</DialogTitle>
                    <DialogDescription>
                        Configure the parameters for your new SSH key pair.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="create-name">Name</label>
                        <Input
                            id="create-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter SSH key name"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium" htmlFor="create-algorithm">Algorithm</label>
                            <Select value={algorithm} onValueChange={setAlgorithm}>
                                <SelectTrigger id="create-algorithm" className="w-full">
                                    <SelectValue placeholder="Select algorithm" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rsa">RSA</SelectItem>
                                    <SelectItem value="ed25519">ED25519</SelectItem>
                                    <SelectItem value="ecdsa">ECDSA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {algorithm === 'rsa' && (
                            <div className="grid gap-2">
                                <label className="text-sm font-medium" htmlFor="create-key-size">Key Size</label>
                                <Select value={keySize} onValueChange={setKeySize}>
                                    <SelectTrigger id="create-key-size" className="w-full">
                                        <SelectValue placeholder="Select key size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2048">2048 bits</SelectItem>
                                        <SelectItem value="4096">4096 bits</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="create-passphrase">
                            Passphrase (Optional)
                        </label>
                        <Input
                            id="create-passphrase"
                            type="password"
                            value={passphrase}
                            onChange={(e) => setPassphrase(e.target.value)}
                            placeholder="Enter passphrase to encrypt private key"
                        />
                        <p className="text-xs text-muted-foreground">
                            Leave empty for an unencrypted private key
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
                        Cancel
                    </Button>
                    <Button onClick={onCreate} disabled={creating || !name}>
                        {creating ? "Generating..." : "Generate SSH Key"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function KeysSuccessModal({
    open,
    onOpenChange,
    generatedKeys,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    generatedKeys: {
        public_key: string
        private_key: string
        fingerprint: string
    } | null
}) {
    const [copiedPublic, setCopiedPublic] = useState(false)
    const [copiedPrivate, setCopiedPrivate] = useState(false)

    const copyToClipboard = async (text: string, type: 'public' | 'private') => {
        try {
            await navigator.clipboard.writeText(text)
            if (type === 'public') {
                setCopiedPublic(true)
                setTimeout(() => setCopiedPublic(false), 2000)
            } else {
                setCopiedPrivate(true)
                setTimeout(() => setCopiedPrivate(false), 2000)
            }
            toast.success(`${type === 'public' ? 'Public' : 'Private'} key copied to clipboard`)
        } catch (err) {
            toast.error('Failed to copy to clipboard')
        }
    }

    if (!generatedKeys) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>SSH Key Generated Successfully!</DialogTitle>
                    <DialogDescription>
                        Your SSH key pair has been generated. Make sure to copy and save your private key securely.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Fingerprint</label>
                        </div>
                        <code className="text-xs bg-muted px-3 py-2 rounded block overflow-x-auto">
                            {generatedKeys.fingerprint}
                        </code>
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Public Key</label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(generatedKeys.public_key, 'public')}
                            >
                                {copiedPublic ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>
                        <textarea
                            readOnly
                            value={generatedKeys.public_key}
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-muted px-3 py-2 text-xs font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Private Key</label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(generatedKeys.private_key, 'private')}
                            >
                                {copiedPrivate ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>
                        <textarea
                            readOnly
                            value={generatedKeys.private_key}
                            className="flex min-h-[200px] w-full rounded-md border border-input bg-muted px-3 py-2 text-xs font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                        <p className="text-xs text-amber-600 dark:text-amber-500">
                            ⚠️ This is the only time you'll see the private key. Save it securely!
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default SshKeys
