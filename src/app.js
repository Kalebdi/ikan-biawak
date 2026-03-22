;(function () {
    'use strict';

    /* ----------------------------------------------------------------
       DOMAIN LOCK
       Ganti ALLOWED_HOSTS dengan domain Vercel kamu.
       Bisa lebih dari satu (misal preview + production).
       Kalau hostname tidak cocok → semua fungsi tidak didaftarkan
       ke window, onclick di HTML tidak akan menemukan fungsi apapun.
    ---------------------------------------------------------------- */
    var ALLOWED_HOSTS = [
        'heaxon.vercel.app',          
        'localhost',                     
        '127.0.0.1',                    
    ];

    var _host = (window.location.hostname || '').toLowerCase();
    var _ok   = false;
    for (var _i = 0; _i < ALLOWED_HOSTS.length; _i++) {
        if (_host === ALLOWED_HOSTS[_i] || _host.endsWith('.' + ALLOWED_HOSTS[_i])) {
            _ok = true;
            break;
        }
    }

    // Kalau bukan domain yang diizinkan → diam saja, tidak expose fungsi apapun
    if (!_ok) return;

    /* ----------------------------------------------------------------
       SETELAH LULUS DOMAIN CHECK — semua logic di dalam IIFE ini
       tidak bisa diakses dari luar scope ini.
       Fungsi yang perlu dipanggil dari HTML di-expose lewat window.
    ---------------------------------------------------------------- */

    var MAX_LEN = 500;

    /* ---- VALIDATE URL ------------------------------------------- */
    function _validateUrl(url) {
        if (!url)               return { ok: false, type: 'error', msg: 'URL tidak boleh kosong.' };
        if (url.length > MAX_LEN) return { ok: false, type: 'error', msg: 'URL terlalu panjang (maks ' + MAX_LEN + ' karakter).' };
        if (!url.startsWith('https://')) return { ok: false, type: 'error', msg: 'URL harus diawali dengan https://' };
        return { ok: true, type: 'success', msg: 'URL valid \u2714' };
    }

    /* ---- FEEDBACK ------------------------------------------------ */
    function _setFeedback(type, message) {
        var box  = document.getElementById('feedbackMsg');
        var icon = document.getElementById('feedbackIcon');
        var text = document.getElementById('feedbackText');
        var inp  = document.getElementById('githubUrl');
        box.classList.remove('error', 'warn', 'success', 'show');
        inp.classList.remove('state-error', 'state-warn', 'state-success');
        if (!type) return;
        var icons = { error: '\u2716', warn: '\u26a0', success: '\u2714' };
        icon.textContent = icons[type] || '';
        text.textContent = message;
        box.classList.add(type, 'show');
        inp.classList.add('state-' + type);
    }

    function _clearFeedback() { _setFeedback(null, ''); }

    /* ---- URL PREVIEW -------------------------------------------- */
    function _setUrlPreview(url) {
        var el = document.getElementById('urlPreview');
        if (!url) { el.classList.remove('show'); el.innerHTML = ''; return; }
        try {
            var u    = new URL(url);
            var path = u.pathname.length > 60 ? u.pathname.substring(0, 60) + '\u2026' : u.pathname;
            el.innerHTML = '\uD83D\uDD17 Host: <span>' + u.hostname + '</span>'
                         + (u.pathname && u.pathname !== '/' ? ' \xB7 Path: <span>' + path + '</span>' : '');
            el.classList.add('show');
        } catch (e) { el.classList.remove('show'); }
    }

    /* ---- TOAST -------------------------------------------------- */
    var _toastTimer;
    function _showToast(message, type, duration) {
        type     = type     || 'success';
        duration = duration || 2000;
        var t = document.getElementById('toast');
        clearTimeout(_toastTimer);
        t.textContent = message;
        t.className   = type === 'error' ? 'toast-error' : '';
        void t.offsetWidth;
        t.classList.add('show');
        _toastTimer = setTimeout(function () { t.classList.remove('show'); }, duration);
    }

    /* ---- CHAR COUNTER ------------------------------------------- */
    function _updateCharCount(len) {
        var el = document.getElementById('charCount');
        el.textContent = len + ' / ' + MAX_LEN;
        el.className   = len > MAX_LEN * 0.85 ? 'warn' : '';
    }

    /* ---- GENERATE ----------------------------------------------- */
    function _generate() {
        var url    = document.getElementById('githubUrl').value.trim();
        var output = document.getElementById('output');
        var result = _validateUrl(url);
        _setFeedback(result.type, result.msg);
        _setUrlPreview(result.ok ? url : null);
        if (!result.ok) { output.value = ''; return; }
        output.value = 'loadstring(game:HttpGet("' + url + '"))()';
        _showToast('\u2714 Loadstring berhasil dibuat!', 'success');
    }

    /* ---- COPY KE CLIPBOARD ------------------------------------- */
    function _copyToClipboard() {
        var output = document.getElementById('output');
        var btn    = document.getElementById('copyBtn');

        if (!output.value) {
            _setFeedback('error', 'Tidak ada kode untuk disalin! Klik Generate terlebih dahulu.');
            _showToast('\u2716 Tidak ada kode!', 'error');
            btn.classList.add('copy-error');
            setTimeout(function () { btn.classList.remove('copy-error'); }, 1500);
            return;
        }

        function onSuccess() {
            btn.textContent = '\u2713 Copied!';
            btn.classList.add('copied');
            _showToast('\u2714 Berhasil disalin!', 'success');
            setTimeout(function () {
                btn.textContent = '\uD83D\uDCCB Copy ke Clipboard';
                btn.classList.remove('copied');
            }, 1800);
        }

        function onFail(err) {
            _setFeedback('error', 'Gagal menyalin! Coba salin manual dari kotak output.');
            _showToast('\u2716 Gagal menyalin!', 'error', 3000);
            btn.classList.add('copy-error');
            setTimeout(function () {
                btn.textContent = '\uD83D\uDCCB Copy ke Clipboard';
                btn.classList.remove('copy-error');
            }, 1800);
            console.error('[LoadGene] Clipboard error:', err);
        }

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(output.value).then(onSuccess).catch(onFail);
        } else {
            try {
                output.select();
                output.setSelectionRange(0, 99999);
                document.execCommand('copy');
                onSuccess();
            } catch (e) { onFail(e); }
        }
    }

    /* ---- CLEAR ALL --------------------------------------------- */
    function _clearAll() {
        document.getElementById('githubUrl').value = '';
        document.getElementById('output').value    = '';
        _clearFeedback();
        _setUrlPreview(null);
        _updateCharCount(0);
        _showToast('\uD83D\uDDD1 Dibersihkan', 'success', 1200);
    }

    /* ---- EVENT LISTENERS --------------------------------------- */
    document.addEventListener('DOMContentLoaded', function () {
        var inputEl = document.getElementById('githubUrl');

        inputEl.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); _generate(); }
        });
        inputEl.addEventListener('input', function () {
            _clearFeedback();
            _setUrlPreview(null);
            _updateCharCount(this.value.length);
        });
        inputEl.addEventListener('paste', function () {
            var self = this;
            setTimeout(function () {
                var v = self.value.trim();
                _updateCharCount(v.length);
                if (v.length > 8) {
                    var r = _validateUrl(v);
                    _setFeedback(r.type, r.msg);
                    if (r.ok) _setUrlPreview(v);
                }
            }, 50);
        });
    });

    /* ----------------------------------------------------------------
       EXPOSE ke window — hanya nama ini yang dipanggil dari HTML onclick.
       Semua nama internal (_generate dll) tidak bisa diakses dari luar.
    ---------------------------------------------------------------- */
    window.generate         = _generate;
    window.copyToClipboard  = _copyToClipboard;
    window.clearAll         = _clearAll;

})(); // ← akhir IIFE, tidak ada yang bocor ke global scope
                                           
