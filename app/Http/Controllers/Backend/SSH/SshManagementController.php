<?php

namespace App\Http\Controllers\Backend\SSH;

use App\Http\Controllers\Controller;
use App\Models\Server;
use App\Models\SshKey;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class SshManagementController extends Controller
{
    public function servers(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $search = $request->input('search');
        $statusFilter = $request->input('status', []);
        $authTypeFilter = $request->input('auth_type', []);

        $query = Server::query();

        // Search
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if (! empty($statusFilter)) {
            $query->whereIn('status', $statusFilter);
        }

        // Filter by auth_type
        if (! empty($authTypeFilter)) {
            $query->whereIn('auth_type', $authTypeFilter);
        }

        $servers = $query->paginate($perPage)->withQueryString();

        // Get counts for filters
        $statusCounts = [
            'active' => Server::where('status', 'active')->count(),
            'inactive' => Server::where('status', 'inactive')->count(),
        ];

        $authTypeCounts = [
            'password' => Server::where('auth_type', 'password')->count(),
            'private_key' => Server::where('auth_type', 'private_key')->count(),
        ];

        $sshKeys = SshKey::select('id', 'name')->get();

        return Inertia::render('Backend/Servers/Servers', [
            'servers' => $servers,
            'sshKeys' => $sshKeys,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'auth_type' => $authTypeFilter,
            ],
            'statusCounts' => $statusCounts,
            'authTypeCounts' => $authTypeCounts,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'ip_address' => 'required|ip',
            'port' => 'required|integer',
            'username' => 'required|string|max:255',
            'password' => 'nullable|string',
            'ssh_key_id' => 'nullable|exists:ssh_keys,id',
            'status' => 'required|in:active,inactive',
            'auth_type' => 'required|in:password,private_key',
        ]);

        $validated['user_id'] = auth()->id();

        Server::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, Server $server)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'ip_address' => 'required|ip',
            'port' => 'required|integer',
            'username' => 'required|string|max:255',
            'status' => 'required|in:active,inactive',
            'auth_type' => 'required|in:password,private_key',
            'ssh_key_id' => 'nullable|exists:ssh_keys,id',
            'password' => 'nullable|string',
        ]);

        $server->update($validated);

        return redirect()->back();
    }

    public function destroy(Server $server)
    {
        $server->delete();

        return redirect()->back();
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:servers,id',
        ]);

        Server::whereIn('id', $validated['ids'])->delete();

        return redirect()->back();
    }

    // SSH Keys Methods
    public function sshKeys(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $search = $request->input('search');
        $typeFilter = $request->input('type', []);

        $query = SshKey::query();

        // Search
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('fingerprint', 'like', "%{$search}%");
            });
        }

        // Filter by type
        if (! empty($typeFilter)) {
            $query->whereIn('type', $typeFilter);
        }

        $sshKeys = $query->paginate($perPage)->withQueryString();

        // Get counts for filters
        $typeCounts = [
            'rsa' => SshKey::where('type', 'rsa')->count(),
            'ed25519' => SshKey::where('type', 'ed25519')->count(),
            'ecdsa' => SshKey::where('type', 'ecdsa')->count(),
        ];

        return Inertia::render('Backend/Servers/SshKyes', [
            'sshKeys' => $sshKeys,
            'filters' => [
                'search' => $search,
                'type' => $typeFilter,
            ],
            'typeCounts' => $typeCounts,
        ]);
    }

    public function storeSshKey(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'algorithm' => 'required|in:rsa,ed25519,ecdsa',
            'key_size' => 'nullable|integer|in:2048,4096',
            'passphrase' => 'nullable|string',
        ]);

        // Generate SSH key pair using the service
        $sshKeyService = new \App\Services\SshKeyService();
        $keyPair = $sshKeyService->generateKeyPair(
            $validated['algorithm'],
            $validated['key_size'] ?? null,
            $validated['passphrase'] ?? null
        );

        // Store in database
        $sshKey = SshKey::create([
            'user_id' => Auth::user()->id,
            'name' => $validated['name'],
            'public_key' => $keyPair['public_key'],
            'private_key' => $keyPair['private_key'],
            'type' => $validated['algorithm'],
            'key_size' => $validated['key_size'],
            'fingerprint' => $keyPair['fingerprint'],
        ]);

        // Return the created SSH key with the generated keys
        return response()->json([
            'success' => true,
            'message' => 'SSH key generated successfully',
            'ssh_key' => $sshKey,
            'generated_keys' => [
                'public_key' => $keyPair['public_key'],
                'private_key' => $keyPair['private_key'],
                'fingerprint' => $keyPair['fingerprint'],
            ],
        ]);
    }

    public function updateSshKey(Request $request, SshKey $sshKey)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'public_key' => 'required|string',
            'private_key' => 'required|string',
            'type' => 'required|in:rsa,ed25519,ecdsa',
            'fingerprint' => 'required|string|max:255',
        ]);

        $sshKey->update($validated);

        return redirect()->back();
    }

    public function destroySshKey(SshKey $sshKey)
    {
        $sshKey->delete();

        return redirect()->back();
    }

    public function bulkDeleteSshKeys(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:ssh_keys,id',
        ]);

        SshKey::whereIn('id', $validated['ids'])->delete();

        return redirect()->back();
    }
}
