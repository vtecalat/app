// src/logic/sessionController.js
import { supabase } from '../lib/supabase.js';

export class SessionController {
    constructor() {
        this.platformSelect = document.getElementById('platform-provider');
        this.dynamicFields = document.getElementById('dynamic-fields');
        this.form = document.getElementById('session-form');
    }

    init() {
        if (!this.platformSelect) return;
        this.platformSelect.addEventListener('change', (e) => this.renderFields(e.target.value));
        this.renderFields(this.platformSelect.value);
        this.form.addEventListener('submit', (e) => this.save(e));
    }

    renderFields(platform) {
        this.dynamicFields.innerHTML = '';
        if (platform === 'youtube') {
            this.dynamicFields.innerHTML = `
                <div class="space-y-2">
                    <label class="text-xs text-slate-400 font-bold uppercase">ID de Transmisión (YouTube)</label>
                    <input type="text" id="platform-id" class="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 text-white" placeholder="Ej: dQw4w9WgXcQ">
                </div>
            `;
        }
    }

    async save(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-save');
        btn.disabled = true;
        btn.textContent = 'Guardando sesión...';

        const { data: { user } } = await supabase.auth.getUser();

        const sessionData = {
            user_id: user.id,
            session_title: document.getElementById('session-title').value,
            description: document.getElementById('session-desc').value,
            scheduled_at: document.getElementById('session-start').value,
            session_type: document.getElementById('session-category').value,
            platform: this.platformSelect.value,
            platform_id: document.getElementById('platform-id')?.value || null,
            status: 'PROGRAMADO'
        };

        try {
            const { data, error } = await supabase
                .from('sessions')
                .insert([sessionData])
                .select()
                .single();

            if (error) throw error;

            alert('¡Sesión programada con éxito!');
            window.location.href = `/dashboard/sala-de-control?id=${data.id}`;
        } catch (err) {
            console.error(err);
            alert('Error al guardar: ' + err.message);
            btn.disabled = false;
            btn.textContent = 'Guardar y Generar Sala';
        }
    }
}