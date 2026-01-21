<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Ok extends Model
{
    use SoftDeletes;

    protected $table = 'oks';

    protected $fillable = [
        'nombre',
        'descripcion',
        'color',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Usuarios que pertenecen a este OK
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'ok_user')
                    ->withTimestamps();
    }

    /**
     * Solo líderes de este OK
     */
    public function leaders(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'ok_user')
                    ->where('role', 'leader')
                    ->withTimestamps();
    }
}
