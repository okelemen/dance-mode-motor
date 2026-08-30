# Dance Mode — render motoru

Ritim-oyunu görünümlü, prosedürel üretilen warm-up videoları için render motoru.
Ekranda çekilmiş tek bir kare yok; her piksel kodla üretiliyor.

Bu depo **sadece motoru** içeriyor. Kanal stratejisi, rakip analizi ve içerik
planlaması ayrı bir özel depoda.

---

## Nasıl çalışır

Three.js sahnesi başsız Chrome içinde çalışır, `render.js` her kareyi
`kareKur(n)` ile kurar, görüntüyü alır ve doğrudan ffmpeg'e boru ile gönderir.

**Deterministik:** `kare N = zaman N/30`. Duvar saati yok, ekran kaydı yok,
rastgelelik yok — parçacık konumları bile indeksten türetiliyor. Aynı girdi
her zaman aynı videoyu verir.

**Kareler diske yazılmaz.** 8:48'lik bölüm 1080p'de 15.840 kare; PNG olarak
~25 GB, ham RGBA olarak ~134 GB. Boru bir zorunluluk, optimizasyon değil.

## Kullanım

```bash
cd 03-motor
npm install

# tam bölüm
node render.js --w 1920 --h 1080 --olcu 264 --toplam 264 --tema b \
  --muzik ../01-muzik/tam-bolum-264-120bpm.wav --cikti ../04-ciktilar/bolum.mp4

# kısa kontrol kesiti (ölçü 40-56)
node render.js --w 1280 --h 720 --baslangic 40 --olcu 16 --toplam 264 \
  --tema b --sessiz --cikti ../04-ciktilar/kesit.mp4

# tek kare
node kare-al.js --n 3000 --tema b --toplam 264 --cikti ../04-ciktilar/kare.png
```

| Parametre | Anlamı |
|---|---|
| `--olcu` | Render edilecek ölçü sayısı (1 ölçü = 2 sn) |
| `--toplam` | Bölümün TAM uzunluğu — parça render'da parçanınki değil |
| `--baslangic` | Ölçü cinsinden ofset (paralel parça render'ı için) |
| `--tema` | `a` neon ritim şeridi · `b` koyu neon (varsayılan görünüm) |
| `--bicim` | `webp` (kayıpsız, varsayılan) · `png` · `jpeg` |
| `--sessiz` | Ses ekleme (parça render'ında kullanılır) |

Uzun bölümler `.github/workflows/render-bolum.yml` ile parçalara bölünüp
paralel koşturulur, sonra birleştirilir.

## Yapı

| Klasör | İçerik |
|---|---|
| `01-muzik/` | Ham parça + `muzik-bolum.py` ile üretilen bölüm müziği |
| `02-hareketler/` | Siluet animasyon klipleri (FBX) |
| `03-motor/` | Sahne, render, ölçüm ve yardımcı araçlar |
| `spec/` | Sabitler ve bölüm şablonu |
| `.github/workflows/` | Bulut render iş akışları |

## Ölçülmüş performans

Bu makinede (i5-7200U, yazılım GL) darboğaz **dolgu hızı** — kare süresi piksel
sayısıyla doğru orantılı:

| Çözünürlük | Hız |
|---|---:|
| 960×540 | 1,5 kare/sn |
| 1280×720 | 1,0 kare/sn |
| 1920×1080 | 0,5 kare/sn |

Kare biçimi hızı **değiştirmiyor**: WebGL komutları asenkron, `toDataURL`
sadece bekleyen rasterleştirmeyi bekletiyor. Ölçüm araçları `03-motor/olc-*.js`.

## Varlıklar hakkında

- `02-hareketler/*.fbx` — Mixamo (Adobe) animasyon klipleri.
- `01-muzik/*.mp3` — Suno ile üretilmiş.

Bu dosyalar projenin çalışması için burada duruyor; kendi projende kullanmadan
önce ilgili servislerin lisans şartlarını kontrol et.

Kod MIT.
