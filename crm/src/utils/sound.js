/**
 * NetPrint - Sound Utility
 * Phát âm thanh bằng Web Audio API (không cần file âm thanh ngoài)
 */

/**
 * Phát âm thanh "chime" khi nhấn nút Tính giá
 * Âm thanh gồm 3 nốt đi lên: C5 → E5 → G5 (hợp âm trưởng - vui, tích cực)
 */
export function playCalculateSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();

        // 3 nốt nhạc (Hz): Do - Mi - Sol (C5-E5-G5)
        const notes = [523.25, 659.25, 783.99];
        const startTime = ctx.currentTime;

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime + i * 0.1);

            // Envelope: attack nhanh, decay mượt
            const noteStart = startTime + i * 0.1;
            gainNode.gain.setValueAtTime(0, noteStart);
            gainNode.gain.linearRampToValueAtTime(0.25, noteStart + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);

            osc.start(noteStart);
            osc.stop(noteStart + 0.4);
        });

        // Tự đóng context sau khi phát xong
        setTimeout(() => ctx.close(), 800);
    } catch (e) {
        // Bỏ qua nếu trình duyệt không hỗ trợ
        console.warn('Sound not supported:', e);
    }
}

/**
 * Phát âm thanh lỗi (khi validate thất bại)
 * Âm thanh thấp, ngắn
 */
export function playErrorSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);

        setTimeout(() => ctx.close(), 500);
    } catch (e) {
        console.warn('Sound not supported:', e);
    }
}
