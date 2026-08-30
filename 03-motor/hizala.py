"""
Hassas BPM olcumu + izgaraya hizalama.

analiz-bpm.py kaba tempoyu bulur. Bu script onun etrafinda cok ince bir
tarama yapar: aday BPM'ler icin tum parca boyunca bir vurus izgarasi kurar
ve onset zarfiyla ortusmeyi olcer (tarak filtresi).

Neden daha hassas: 240 saniyede 0,01 BPM'lik hata son vurusu 20 ms kaydirir.
Otokorelasyon bunu goremez, tum parcaya yayilan izgara gorur.

Kullanim:
  python hizala.py <ses> [merkez_bpm]
"""
import subprocess, sys, os
import numpy as np

SR = 22050
HOP = 256
HEDEF_BPM = 120.0
FPS_ZARF = SR / HOP


def pcm_oku(yol):
    p = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", yol,
         "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
        stdout=subprocess.PIPE, check=True)
    return np.frombuffer(p.stdout, dtype=np.float32)


def onset_zarfi(x):
    n_fft = 1024
    pencere = np.hanning(n_fft).astype(np.float32)
    n = (len(x) - n_fft) // HOP
    spek = np.empty((n, n_fft // 2 + 1), dtype=np.float32)
    for i in range(n):
        spek[i] = np.abs(np.fft.rfft(x[i * HOP: i * HOP + n_fft] * pencere))
    fark = np.diff(spek, axis=0)
    fark[fark < 0] = 0
    z = fark.sum(axis=1)
    return z - z.mean()


def skor(zarf, bpm, faz):
    """Izgara vuruslarindaki zarf toplami."""
    adim = 60.0 / bpm * FPS_ZARF
    idx = np.arange(faz, len(zarf) - 1, adim)
    return zarf[np.round(idx).astype(int)].sum()


def ince_tara(zarf, merkez, yaricap=1.5, kaba=0.01, faz_adim=120):
    """Once kaba, sonra o noktanin etrafinda cok ince."""
    def en_iyi(bpm_listesi):
        eb, ef, es = None, None, -1e18
        for bpm in bpm_listesi:
            adim = 60.0 / bpm * FPS_ZARF
            for k in range(faz_adim):
                f = adim * k / faz_adim
                s = skor(zarf, bpm, f)
                if s > es:
                    es, eb, ef = s, bpm, f
        return eb, ef, es

    b1, f1, _ = en_iyi(np.arange(merkez - yaricap, merkez + yaricap, kaba))
    b2, f2, _ = en_iyi(np.arange(b1 - kaba, b1 + kaba, kaba / 20))
    return b2, f2


if __name__ == "__main__":
    yol = sys.argv[1]
    merkez = float(sys.argv[2]) if len(sys.argv) > 2 else None

    x = pcm_oku(yol)
    sure = len(x) / SR
    zarf = onset_zarfi(x)

    if merkez is None:
        # kaba tahmin: otokorelasyon
        lag_min = int(FPS_ZARF * 60.0 / 160)
        lag_max = int(FPS_ZARF * 60.0 / 90)
        kor = np.correlate(zarf, zarf, mode="full")[len(zarf) - 1:]
        merkez = 60.0 * FPS_ZARF / (int(np.argmax(kor[lag_min:lag_max + 1])) + lag_min)

    bpm, faz = ince_tara(zarf, merkez)
    t0 = faz / FPS_ZARF
    vurus = 60.0 / bpm

    # faz bir vurusun sonuna cok yakinsa aslinda sifira yakindir
    if t0 > vurus * 0.5:
        t0 -= vurus

    print(f"Dosya : {os.path.basename(yol)}")
    print(f"Sure  : {sure:.3f} sn")
    print(f"\nHASSAS BPM  : {bpm:.4f}")
    print(f"Ilk vurus   : {t0:+.4f} sn")
    print(f"Sapma       : {bpm - HEDEF_BPM:+.4f} BPM ({(bpm/HEDEF_BPM-1)*100:+.4f}%)")

    oran = HEDEF_BPM / bpm
    print(f"\n--- 120 BPM icin ---")
    print(f"atempo      : {oran:.8f}")
    print(f"Yeni sure   : {sure/oran:.3f} sn")
    print(f"Yeni ilk vurus (kirpilacak): {t0/oran:+.4f} sn")
    yeni_sure = sure / oran - (t0 / oran)
    print(f"Kirpma sonrasi olcu sayisi : {yeni_sure/2.0:.2f}")
    print(f"Tam olcuye yuvarlanmis     : {int(yeni_sure//2)} olcu = {int(yeni_sure//2)*2} sn")
