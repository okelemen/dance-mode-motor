"""
Tek parcayi tam bolum uzunluguna cikarir.

Elimizde 122 olculuk (244 sn) bir parca var, tam bolum 264 olcu istiyor.
Ikinci bir parca almak yerine mevcut parca yeniden diziliyor.

NEDEN duz tekrar degil:
  Parcayi bastan sona iki kez calmak, taniyici GIRIS bolumunu ikinci kez
  duyurur ve "bu tekrar" hissi verir. Onun yerine giris ve cikis birer kez
  kullaniliyor, ortadaki GOVDE tekrarlaniyor. Dinleyici tekrari fark etmez
  cunku govde zaten kendi icinde donguseldir.

Tum kesimler TAM OLCU sinirinda (2.000 sn'nin katlari). 120 BPM'de dort
vurus tam 2 saniye oldugu icin kesim noktasi her zaman bir vurusun basina
denk gelir - tik sesi olusmaz, ritim kaymaz.

Kullanim:
  python muzik-bolum.py <ham.mp3> <cikti.wav> [hedef_olcu]
"""
import subprocess, sys, os

OLCU_SN   = 2.0            # 120 BPM'de 1 olcu
ATEMPO    = 120.0 / 122.0  # Suno 122 BPM veriyor
KAYNAK_OLCU = 122          # esnetilmis parcanin olcu sayisi

GIRIS = 16                 # bastaki olcu sayisi - bir kez kullanilir
CIKIS = 16                 # sondaki olcu sayisi - bir kez kullanilir


def parcala(hedef_olcu):
    """[(baslangic_olcu, uzunluk_olcu), ...] listesi uretir."""
    govde_bas = GIRIS
    govde_uz  = KAYNAK_OLCU - GIRIS - CIKIS       # 90 olcu
    cikis_bas = KAYNAK_OLCU - CIKIS

    parcalar = [(0, GIRIS)]
    kalan = hedef_olcu - GIRIS - CIKIS
    while kalan > 0:
        al = min(govde_uz, kalan)
        parcalar.append((govde_bas, al))
        kalan -= al
    parcalar.append((cikis_bas, CIKIS))
    return parcalar


def main():
    ham    = sys.argv[1]
    cikti  = sys.argv[2]
    hedef  = int(sys.argv[3]) if len(sys.argv) > 3 else 264

    parcalar = parcala(hedef)
    toplam = sum(u for _, u in parcalar)
    print(f"hedef {hedef} olcu -> {len(parcalar)} parca, toplam {toplam} olcu")
    for b, u in parcalar:
        print(f"  olcu {b:>3} .. {b+u:>3}   ({u} olcu)")

    # tek ffmpeg cagrisi: esnet -> kopyala -> her kopyayi kirp -> birlestir
    n = len(parcalar)
    f  = f"[0:a]atempo={ATEMPO:.8f},asplit={n}" + "".join(f"[s{i}]" for i in range(n)) + ";"
    for i, (b, u) in enumerate(parcalar):
        bas, son = b * OLCU_SN, (b + u) * OLCU_SN
        f += f"[s{i}]atrim=start={bas:.3f}:end={son:.3f},asetpts=PTS-STARTPTS[p{i}];"
    # apad + -t: kaynak mp3 birkac ms kisa oldugu icin sondaki parca eksik
    # kaliyor. Tam olcu sinirina tamamlanir, yoksa izgara sonda kayar.
    f += "".join(f"[p{i}]" for i in range(n)) + f"concat=n={n}:v=0:a=1,apad[out]"

    komut = ["ffmpeg", "-v", "error", "-y", "-i", ham,
             "-filter_complex", f, "-map", "[out]",
             "-t", f"{hedef * OLCU_SN:.3f}",
             "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", cikti]
    subprocess.run(komut, check=True)

    sure = float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", cikti],
        capture_output=True, text=True).stdout.strip())
    print(f"\ncikti: {os.path.basename(cikti)}")
    print(f"sure : {sure:.3f} sn  =  {sure/OLCU_SN:.3f} olcu")
    beklenen = hedef * OLCU_SN
    fark = abs(sure - beklenen)
    print(f"hedef: {beklenen:.3f} sn   sapma: {fark*1000:.1f} ms")
    if fark > 0.05:
        print("UYARI: sapma buyuk, kesim noktalarini kontrol et")
        sys.exit(1)


if __name__ == "__main__":
    main()
