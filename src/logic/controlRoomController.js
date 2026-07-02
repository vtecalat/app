// src/logic/controlRoomController.js
import { supabase } from '../lib/supabase.js';

export class ControlRoomController {
    constructor() {
        this.sessionId = new URLSearchParams(window.location.search).get('id');
        this.sessionData = null;
    }

    async init() {
        if (!this.sessionId) return;
        await this.fetchSession();
        this.setupAccordion();
    }

    async fetchSession() {
        const { data, error } = await supabase.from('sessions').select('*').eq('id', this.sessionId).single();
        if (error) { console.error(error); return; }
        this.sessionData = data;
        this.render();
    }

    setupAccordion() {
        const toggleBtn = document.getElementById('btn-toggle-links');
        const content = document.getElementById('links-accordion-content');
        const icon = document.getElementById('accordion-icon');

        if (toggleBtn && content) {
            toggleBtn.onclick = () => {
                const isHidden = content.classList.contains('hidden');
                if (isHidden) {
                    content.classList.remove('hidden');
                    icon.style.transform = 'rotate(180deg)';
                } else {
                    content.classList.add('hidden');
                    icon.style.transform = 'rotate(0deg)';
                }
            };
        }
    }

    render() {
        document.getElementById('control-session-title').textContent = this.sessionData.session_title;
        document.title = `🔴 Estudio - ${this.sessionData.session_title}`;
        this.updateStreamControlsUI(this.sessionData.status);

        const btnActivateCamera = document.getElementById('btn-activate-camera');
        const selfCameraWrapper = document.getElementById('self-camera-wrapper');
        const selfCameraIframe = document.getElementById('self-camera-iframe');

        if (btnActivateCamera && this.sessionData.guest_url) {
            btnActivateCamera.onclick = () => {
                if (selfCameraWrapper.classList.contains('hidden')) {
                    selfCameraIframe.src = this.sessionData.guest_url;
                    selfCameraWrapper.classList.remove('hidden');
                    btnActivateCamera.innerHTML = '<i class="fa-solid fa-video-slash"></i> Cortar Fuente';
                    btnActivateCamera.className = 'bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors';
                } else {
                    selfCameraIframe.src = '';
                    selfCameraWrapper.classList.add('hidden');
                    btnActivateCamera.innerHTML = '<i class="fa-solid fa-video"></i> Conectar Fuente';
                    btnActivateCamera.className = 'bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors';
                }
            };
        }

        const monitorWrapper = document.getElementById('monitor-wrapper');
        const monitorIframe = document.getElementById('monitor-iframe');
        const directorSection = document.getElementById('director-section');
        const directorIframe = document.getElementById('director-iframe');
        
        monitorWrapper.classList.remove('hidden');

        if (this.sessionData.platform === 'youtube' && this.sessionData.platform_id) {
            monitorIframe.src = `https://www.youtube.com/embed/${this.sessionData.platform_id}?autoplay=1&mute=1`;
            directorSection.classList.add('hidden'); 
            document.getElementById('obs-stream-url').textContent = 'rtmp://a.rtmp.youtube.com/live2';
            document.getElementById('obs-stream-key').textContent = this.sessionData.stream_key || 'Esperando clave API...';
        } else {
            const urlObj = new URL(this.sessionData.guest_url);
            const roomName = urlObj.searchParams.get('room');
            
            // Monitor con dominio estable
            const monitorUrl = `https://vdo.ninja/?scene=0&layout&remote&showlabels&room=${roomName}`;
            monitorIframe.src = monitorUrl;

            // Mostramos el Panel del Director
            directorSection.classList.remove('hidden');
            directorIframe.src = this.sessionData.director_url;

            document.getElementById('obs-stream-url').textContent = 'Servidor Interno Vteca';
            document.getElementById('obs-stream-key').textContent = 'Señal interna (Clave no requerida)';
        }

        const btnOpenDirector = document.getElementById('btn-open-director');
        if (btnOpenDirector && this.sessionData.director_url) {
            btnOpenDirector.disabled = false;
            btnOpenDirector.onclick = () => window.open(this.sessionData.director_url, '_blank'); 
        }

        this.setupCopyButton('btn-copy-director', this.sessionData.director_url);
        this.setupCopyButton('btn-copy-guest', this.sessionData.guest_url);
        this.setupCopyButton('btn-copy-obs', this.sessionData.viewer_url); 

        document.getElementById('btn-stream-action').onclick = () => this.toggleStream();
    }

    setupCopyButton(btnId, valueToCopy) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.onclick = () => {
            if (!valueToCopy) { alert("Enlace no disponible."); return; }
            navigator.clipboard.writeText(valueToCopy);
            const icon = btn.innerHTML;
            btn.innerHTML = '<svg class="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>';
            setTimeout(() => { btn.innerHTML = icon; }, 2000);
        };
    }

    updateStreamControlsUI(status) {
        const btnAction = document.getElementById('btn-stream-action');
        const badge = document.getElementById('live-status-badge');

        if (status === 'PROGRAMADO' || !status) {
            badge.className = 'px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20';
            badge.innerHTML = '<i class="fa-solid fa-clock mr-1"></i> En Espera';
            btnAction.className = 'bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all';
            btnAction.innerHTML = 'Iniciar Transmisión Pública';
        } else if (status === 'EN VIVO') {
            badge.className = 'px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse';
            badge.innerHTML = '<i class="fa-solid fa-tower-broadcast mr-1"></i> EN VIVO';
            btnAction.className = 'bg-rose-600 hover:bg-rose-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all';
            btnAction.innerHTML = 'Finalizar Transmisión';
        } else if (status === 'FINALIZADO') {
            badge.className = 'px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700';
            badge.innerHTML = '<i class="fa-solid fa-flag-checkered mr-1"></i> Evento Finalizado';
            btnAction.className = 'bg-slate-800 text-slate-500 px-6 py-2.5 rounded-xl text-sm font-bold cursor-not-allowed';
            btnAction.innerHTML = 'Transmisión Cerrada';
            btnAction.disabled = true;
        }
    }

    async toggleStream() {
        if (this.sessionData.status === 'EN VIVO' && !confirm("¿Seguro que deseas FINALIZAR la transmisión permanentemente?")) return;
        const newStatus = this.sessionData.status === 'PROGRAMADO' ? 'EN VIVO' : 'FINALIZADO';
        await supabase.from('sessions').update({ status: newStatus }).eq('id', this.sessionId);
        window.location.reload();
    }
}