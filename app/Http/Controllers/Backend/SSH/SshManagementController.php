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

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        if (! empty($statusFilter)) {
            $query->whereIn('status', $statusFilter);
        }
        if (! empty($authTypeFilter)) {
            $query->whereIn('auth_type', $authTypeFilter);
        }

        $servers = $query->paginate($perPage)->withQueryString();

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

        $validated['user_id'] = Auth::user()->id;

        Server::create([
            'name' => isset($validated['name']) ? $validated['name'] : '',
            'ip_address' => isset($validated['ip_address']) ? $validated['ip_address'] : '',
            'port' => isset($validated['port']) ? $validated['port'] : '',
            'username' => isset($validated['username']) ? $validated['username'] : '',
            'password' => isset($validated['password']) ? $validated['password'] : '',
            'ssh_key_id' => isset($validated['ssh_key_id']) ? $validated['ssh_key_id'] : null,
            'status' => isset($validated['status']) ? $validated['status'] : 'inactive',
            'auth_type' => isset($validated['auth_type']) ? $validated['auth_type'] : 'password',
            'user_id' => $validated['user_id'],
        ]);

        return redirect()->back()->with('success', 'Server created successfully');
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

        $server->update([
            'name' => isset($validated['name']) ? $validated['name'] : $server->name,
            'ip_address' => isset($validated['ip_address']) ? $validated['ip_address'] : $server->ip_address,
            'port' => isset($validated['port']) ? $validated['port'] : $server->port,
            'username' => isset($validated['username']) ? $validated['username'] : $server->username,
            'password' => isset($validated['password']) ? $validated['password'] : $server->password,
            'ssh_key_id' => isset($validated['ssh_key_id']) ? $validated['ssh_key_id'] : $server->ssh_key_id,
            'status' => isset($validated['status']) ? $validated['status'] : $server->status,
            'auth_type' => isset($validated['auth_type']) ? $validated['auth_type'] : $server->auth_type,
        ]);

        return redirect()->back()->with('success', 'Server updated successfully');
    }

    public function destroy(Server $server)
    {
        $server->delete();

        return redirect()->back()->with('success', 'Server deleted successfully');
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:servers,id',
        ]);

        Server::whereIn('id', $validated['ids'])->delete();

        return redirect()->back()->with('success', 'Servers deleted successfully');
    }

    public function sshKeys(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $search = $request->input('search');
        $typeFilter = $request->input('type', []);

        $query = SshKey::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('fingerprint', 'like', "%{$search}%");
            });
        }

        if (! empty($typeFilter)) {
            $query->whereIn('type', $typeFilter);
        }

        $sshKeys = $query->paginate($perPage)->withQueryString();

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

        $sshKeyService = new \App\Services\SshKeyService();
        $keyPair = $sshKeyService->generateKeyPair(
            $validated['algorithm'],
            $validated['key_size'] ?? null,
            $validated['passphrase'] ?? null
        );

        $sshKey = SshKey::create([
            'user_id' => Auth::user()->id,
            'name' => $validated['name'],
            'public_key' => $keyPair['public_key'],
            'private_key' => $keyPair['private_key'],
            'type' => $validated['algorithm'],
            'key_size' => $validated['key_size'],
            'fingerprint' => $keyPair['fingerprint'],
        ]);

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
