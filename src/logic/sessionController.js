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
                    <p class="text-[10px] text-slate-500 mt-1">Si dejas esto en blanco, el sistema generará el evento automáticamente en el canal de la institución.</p>
                </div>
            `;
        } else {
            this.dynamicFields.innerHTML = `
                <p class="text-sm text-emerald-400 bg-emerald-900/20 p-3 rounded-lg border border-emerald-800">
                    <i class="fa-solid fa-circle-check"></i> Vteca Live: Sala de Director y enlaces generados automáticamente.
                </p>
            `;
        }
    }

    // LÓGICA VDO.NINJA (Sala Clásica Estable)
    generateVdoNinjaUrls() {
        const stableId = self.crypto.randomUUID().slice(0, 8);
        const roomName = `vteca_${stableId}`; 
        const vdoDomain = 'https://vdo.ninja'; // Usamos el dominio estable
        
        return {
            director_url: `${vdoDomain}/?director=${roomName}`,
            guest_url: `${vdoDomain}/?room=${roomName}`,
            viewer_url: `${vdoDomain}/?scene=0&room=${roomName}&cleanoutput`
        };
    }

    async save(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-save');
        btn.disabled = true;
        btn.textContent = 'Guardando sesión...';

        const { data: { user } } = await supabase.auth.getUser();
        const platform = this.platformSelect.value;

        let sessionData = {
            user_id: user.id,
            session_title: document.getElementById('session-title').value,
            description: document.getElementById('session-desc').value,
            scheduled_at: document.getElementById('session-start').value,
            session_type: document.getElementById('session-category').value,
            platform: platform,
            status: 'PROGRAMADO'
        };

        const vdoUrls = this.generateVdoNinjaUrls();
        sessionData = { ...sessionData, ...vdoUrls };

        if (platform === 'youtube') {
            sessionData.platform_id = document.getElementById('platform-id')?.value || null;
        } else {
            sessionData.stream_key = `vteca-live-${self.crypto.randomUUID().slice(0, 8)}`;
        }

        try {
            const { data, error } = await supabase.from('sessions').insert([sessionData]).select().single();
            if (error) throw error;
            window.location.href = `/dashboard/sala-de-control?id=${data.id}`;
        } catch (err) {
            console.error(err);
            alert('Error al guardar: ' + err.message);
            btn.disabled = false;
            btn.textContent = 'Guardar y Generar Sala';
        }
    }
}