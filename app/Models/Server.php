<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Server extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'ip_address',
        'port',
        'username',
        'password',
        'ssh_key_id',
        'status',
        'auth_type',
    ];

    /**
     * Get the user that owns the server.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the ssh key that owns the server.
     */
    public function sshKey(): BelongsTo
    {
        return $this->belongsTo(SshKey::class);
    }
}
