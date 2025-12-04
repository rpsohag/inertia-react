<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SshKey extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'key_size',
        'public_key',
        'private_key',
        'type',
        'fingerprint',
    ];

    /**
     * Get the user that owns the ssh key.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
