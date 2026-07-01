// src/logic/controlRoomController.js
import { supabase } from '../lib/supabase.js';

export class ControlRoomController {
    constructor() {
        this.sessionId = new URLSearchParams(window.location.search).get('id');
        this.sessionData = null;
    }

    async init() {
        if (!this.sessionId) {
            document.getElementById('control-workspace').innerHTML = `
                <div class="text-center text-rose-500 mt-20">
                    <h2 class="text-2xl font-bold">Error: Sesión no encontrada</h2>
                    <p>No se proporcionó un ID de sesión válido.</p>
                </div>
            `;
            return;
        }
        await this.fetchSession();
    }

    async fetchSession() {
        try {
            const { data, error } = await supabase
                .from('sessions')
                .select('*')
                .eq('id', this.sessionId)
                .single();

            if (error) throw error;
            this.sessionData = data;
            this.renderUI();
        } catch (error) {
            console.error('Error cargando sesión:', error);
            alert('No se pudo cargar la sesión.');
        }
    }

    renderUI() {
        // 1. Título y Estado
        document.getElementById('control-title').textContent = this.sessionData.session_title;
        document.title = `🔴 Control - ${this.sessionData.session_title}`;
        
        const statusBadge = document.getElementById('live-status-badge');
        if (this.sessionData.status === 'PROGRAMADO') {
            statusBadge.innerHTML = '<i class="fa-solid fa-clock"></i> En Espera';
            statusBadge.className = 'px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20';
        }

        // 2. Lógica del Motor de Transmisión (VDO Ninja vs YouTube)
        const cameraWrapper = document.getElementById('camera-wrapper');
        const obsPanel = document.getElementById('obs-instructions');

        if (this.sessionData.platform === 'vdo_ninja') {
            // EPT Live (VDO Ninja)
            cameraWrapper.classList.remove('hidden');
            obsPanel.classList.remove('hidden');
            
            // Inyectamos el iframe del mixer/director
            if (this.sessionData.director_url) {
                document.getElementById('camera-iframe').src = this.sessionData.director_url;
            }

            // Mostramos los enlaces de ingesta
            document.getElementById('obs-stream-url').textContent = 'Servidor Interno EPT (VDO Ninja)';
            document.getElementById('obs-stream-key').textContent = this.sessionData.viewer_url || 'URL_NO_DISPONIBLE';

        } else if (this.sessionData.platform === 'youtube') {
            // YouTube Live
            cameraWrapper.classList.add('hidden'); // Ocultamos el mixer interno
            obsPanel.classList.remove('hidden');

            document.getElementById('obs-stream-url').textContent = 'rtmp://a.rtmp.youtube.com/live2';
            document.getElementById('obs-stream-key').textContent = 'Usa la clave proporcionada por tu canal de YouTube';
        }
    }
}