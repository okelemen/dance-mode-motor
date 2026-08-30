"""
BPM ve ilk vurus olcumu.

ffmpeg ile ham PCM cikarir, enerji zarfi (onset envelope) hesaplar,
otokorelasyon ile tempoyu bulur, sonra faz kaydirmasiyla ilk vurusu bulur.

Kullanim:  python analiz-bpm.py <ses-dosyasi>
"""
import subprocess, sys, os
import numpy as np

SR = 22050
HOP = 256                      # ~11.6 ms cerceve
BPM_MIN, BPM_MAX = 90, 160


def pcm_oku(yol):
    p = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", yol,
         "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
        stdout=subprocess.PIPE, check=True)
    return np.frombuffer(p.stdout, dtype=np.float32)


def onset_zarfi(x):
    """Spektral akis: her cercevede enerjinin ARTISI."""
    n_fft = 1024
    pencere = np.hanning(n_fft).astype(np.float32)
    cerceve_sayisi = (len(x) - n_fft) // HOP
    spek = np.empty((cerceve_sayisi, n_fft // 2 + 1), dtype=np.float32)
    for i in range(cerceve_sayisi):
        parca = x[i * HOP: i * HOP + n_fft] * pencere
        spek[i] = np.abs(np.fft.rfft(parca))
    fark = np.diff(spek, axis=0)
    fark[fark < 0] = 0                      # sadece artis
    zarf = fark.sum(axis=1)
    zarf -= zarf.mean()
    return zarf


def tempo_bul(zarf):
    fps = SR / HOP
    lag_min = int(fps * 60.0 / BPM_MAX)
    lag_max = int(fps * 60.0 / BPM_MIN)
    z = zarf - zarf.mean()
    kor = np.correlate(z, z, mode="full")[len(z) - 1:]
    aralik = kor[lag_min:lag_max + 1]
    en_iyi = int(np.argmax(aralik)) + lag_min

    # parabolik ince ayar - tam sayi lag'in otesine gec
    if lag_min < en_iyi < lag_max:
        y0, y1, y2 = kor[en_iyi - 1], kor[en_iyi], kor[en_iyi + 1]
        payda = (y0 - 2 * y1 + y2)
        duzeltme = 0.5 * (y0 - y2) / payda if payda != 0 else 0.0
    else:
        duzeltme = 0.0
    lag = en_iyi + duzeltme
    return 60.0 * fps / lag, kor, lag


def ilk_vurus(zarf, lag):
    """Vurus izgarasini kaydirarak zarfla en cok ortusen fazi bul."""
    fps = SR / HOP
    en_iyi_faz, en_iyi_skor = 0.0, -1e18
    adim = 200
    for k in range(adim):
        faz = lag * k / adim
        idx = np.round(np.arange(faz, len(zarf) - 1, lag)).astype(int)
        skor = zarf[idx].sum()
        if skor > en_iyi_skor:
            en_iyi_skor, en_iyi_faz = skor, faz
    return en_iyi_faz / fps


def tempo_kaymasi(zarf, lag, parca=6):
    """Parcayi bolup her bolumun tempossunu ayri olc - suruklenme var mi?"""
    fps = SR / HOP
    n = len(zarf) // parca
    sonuc = []
    for i in range(parca):
        dilim = zarf[i * n:(i + 1) * n]
        bpm, _, _ = tempo_bul(dilim)
        sonuc.append(bpm)
    return sonuc


if __name__ == "__main__":
    yol = sys.argv[1]
    print(f"Dosya: {os.path.basename(yol)}")
    x = pcm_oku(yol)
    sure = len(x) / SR
    print(f"Sure : {sure:.3f} sn")

    zarf = onset_zarfi(x)
    bpm, kor, lag = tempo_bul(zarf)
    print(f"\nOLCULEN BPM : {bpm:.3f}")
    print(f"Hedef       : 120.000")
    print(f"Sapma       : {bpm - 120:+.3f} BPM  ({(bpm/120 - 1)*100:+.3f}%)")

    t0 = ilk_vurus(zarf, lag)
    print(f"\nIlk vurus   : {t0:.4f} sn")

    print(f"\nTempo tutarliligi (6 dilim):")
    for i, b in enumerate(tempo_kaymasi(zarf, lag)):
        print(f"  dilim {i+1}: {b:7.2f} BPM")

    olcu = sure / (4 * 60.0 / bpm)
    print(f"\nToplam olcu (olculen BPM'e gore): {olcu:.2f}")
    print(f"Toplam olcu (120 BPM'e gore)    : {sure / 2.0:.2f}")
