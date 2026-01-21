<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Linea extends Model
{
    use SoftDeletes;

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
     * Usuarios que pertenecen a esta línea
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'linea_user')
                    ->withTimestamps();
    }

    /**
     * Solo líderes de esta línea
     */
    public function leaders(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'linea_user')
                    ->where('role', 'leader')
                    ->withTimestamps();
    }
}
