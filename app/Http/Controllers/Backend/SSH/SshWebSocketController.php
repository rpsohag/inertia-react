<?php

namespace App\Http\Controllers\Backend\SSH;

use App\Events\SshTerminalEvent;
use App\Http\Controllers\Controller;
use App\Models\Server;
use App\Models\SshKey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use phpseclib3\Crypt\PublicKeyLoader;
use phpseclib3\Net\SSH2;

class SshWebSocketController extends Controller
{
    /**
     * Connect to SSH server and create a persistent session
     */
    public function connect(Request $request)
    {
        $validated = $request->validate([
            'server_id' => 'required|exists:servers,id',
        ]);

        $server = Server::findOrFail($validated['server_id']);

        try {
            $sessionId = Str::uuid()->toString();

            Cache::put("ssh_websocket_{$sessionId}", [
                'server_id' => $server->id,
                'created_at' => time(),
            ], now()->addHours(1));

            $initialOutput = '$ ';

            return response()->json([
                'success' => true,
                'session_id' => $sessionId,
                'message' => 'Connected successfully',
                'initial_output' => $initialOutput,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection failed: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send input to SSH session
     */
    public function sendInput(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|string',
            'input' => 'required|string',
        ]);

        $sessionId = $validated['session_id'];
        $sessionData = Cache::get("ssh_websocket_{$sessionId}");

        if (! $sessionData) {
            return response()->json([
                'success' => false,
                'message' => 'Session expired or not found',
            ], 404);
        }

        try {
            $server = Server::find($sessionData['server_id']);

            if (! $server) {
                return response()->json([
                    'success' => false,
                    'message' => 'Server not found',
                ], 404);
            }

            $ssh = $this->createSshConnection($server);

            $input = trim($validated['input']);

            $output = $ssh->exec($input);

            $ssh->disconnect();

            if ($output !== false && $output !== null && $output !== '') {
                $output = $this->cleanOutput($output);

                try {
                    broadcast(new SshTerminalEvent($sessionId, $output));
                } catch (\Exception $e) {
                }

                return response()->json([
                    'success' => true,
                    'output' => $output,
                ]);
            } else {
                return response()->json([
                    'success' => true,
                    'output' => '',
                ]);
            }

        } catch (\Exception $e) {

            broadcast(new SshTerminalEvent($sessionId, '', 'Input failed000: '.$e->getMessage()));

            return response()->json([
                'success' => false,
                'message' => 'Input failed00: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create SSH connection
     */
    private function createSshConnection(Server $server): SSH2
    {
        $ssh = new SSH2($server->ip_address, (int) $server->port, 30);

        if ($server->auth_type === 'password') {
            if (empty($server->password)) {
                throw new \Exception('Server password is not configured.');
            }

            if (! $ssh->login($server->username, $server->password)) {
                throw new \Exception('SSH authentication failed.');
            }
        } else {
            if (empty($server->ssh_key_id)) {
                throw new \Exception('Server SSH key is not configured.');
            }

            $sshKey = SshKey::find($server->ssh_key_id);

            if (! $sshKey) {
                throw new \Exception('SSH key not found.');
            }

            try {
                $privateKeyContent = str_replace('\\n', "\n", $sshKey->private_key);

                Log::info('Private key content: '.$privateKeyContent);

                $key = PublicKeyLoader::load($privateKeyContent);
            } catch (\Exception $e) {
                if (str_contains($e->getMessage(), 'password')) {
                    throw new \Exception('SSH key appears to be encrypted with a passphrase. Passphrase-protected keys are not currently supported.');
                } elseif (str_contains($e->getMessage(), 'format')) {
                    throw new \Exception('SSH key format is not recognized. Expected OpenSSH format.');
                } else {
                    throw new \Exception('Failed to load SSH key: '.$e->getMessage());
                }
            }

            if (! $ssh->login($server->username, $key)) {
                throw new \Exception('SSH key authentication failed.');
            }
        }

        $ssh->setTimeout(10);

        return $ssh;
    }

    /**
     * Disconnect SSH session
     */
    public function disconnect(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|string',
        ]);

        $sessionId = $validated['session_id'];

        Cache::forget("ssh_websocket_{$sessionId}");

        return response()->json([
            'success' => true,
            'message' => 'Disconnected successfully',
        ]);
    }

    /**
     * Clean output for terminal display
     */
    private function cleanOutput(string $output): string
    {
        if (! mb_check_encoding($output, 'UTF-8')) {
            $output = mb_convert_encoding($output, 'UTF-8', 'UTF-8');
        }

        return $output;
    }
}
