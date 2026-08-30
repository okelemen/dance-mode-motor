# 03 — Motor

Three.js render motoru. **Henüz yazılmadı.**

## Ne olacak

Node + Three.js + Puppeteer. Girdi: `../spec/sabitler.json` + bir bölüm JSON'u.
Çıktı: kare akışı → doğrudan ffmpeg'e boru → mp4.

## Kurulacaklar (proje başlayınca)

```bash
npm init -y && npm i three puppeteer
```

Puppeteer, Chromium'u kendi indirir (~300 MB).

## İlk hedef: TEK ÖLÇÜ

Tam bölüm değil. **2 saniye, loop halinde:**
bir tünel + bir hız + bir nota + bir siluet hareketi + bir combo tiki.

> Bu 2 saniye doğru hissettiriyorsa geri kalan 9 dakika sadece tekrardır.
> Yanlış hissettiriyorsa 9 dakika yapmak hiçbir şeyi kurtarmaz.

## İki görsel dil — `--tema`

Rakip analizi (`docs/RAKIP-ANALIZI-6-KANAL.md`) nişin tek değil **iki** olduğunu
gösterdi. Motor ikisini de üretiyor; değişen tek şey görsel katman.
Koreografi, müzik, zamanlama, ölçü ızgarası **aynı**.

```bash
node render.js --olcu 64 --tema a --cikti ../04-ciktilar/ornek-tema-a.mp4
node render.js --olcu 64 --tema b --cikti ../04-ciktilar/ornek-tema-b.mp4
```

| | `a` — soyut ritim şeridi | `b` — temalı koşu |
|---|---|---|
| Referans | Dance Mode, Beat Motion, Stay on Beat | Escapify, FLEM, Prime & Prep |
| Zemin | Koyu yol, parlak neon çizgi | Parlak renkli blok yolu, koyu derz |
| Harman | Additive (toplama ışık) | **Normal** |
| Ortamlar | Neon Grid / Uzay / CRT / Sıvı | Block Island / Candy Road / Jungle Run / Ice Peak |
| Kontrast | Parlaklıkla | **Renk alanı + koyu kontur** |
| Bloom | Güçlü | Neredeyse kapalı |
| Yazı | Beyaz kontur | **Koyu kontur** |

**Neden ayrı bir harman modu:** B'de additive kullanılamaz. Toplama ışık parlak
gökyüzünde beyaza doyar ve bütün sahne yıkanır. Aynı sebeple B'de bloom kısılır,
nota rengi materyal yerine **dokunun içine** gömülür (materyal rengi bütün dokuyu
çarptığı için beyaz dış kenar da lane rengine boyanıyor ve nota, aynı renkteki
yolun üzerinde kayboluyordu).

`b` teması hiçbir lisanslı evrene ait değil. Rakiplerin en büyük vuruşları IP'den
geliyor ama IP'siz de tema yapılabiliyor — arama hacmini çeken şey tema **ismi**.

## Değişmez tasarım kuralları

- Deterministik: `t = kare_no / fps`. Duvar saati YOK, ekran kaydı YOK.
- Kareler diske yazılmaz, ffmpeg'e boru ile gider.
- Yerel çalıştırma sadece 640x360 önizleme. Tam render GitHub Actions'ta.
- Blender pipeline'da yok. FBX/GLB doğrudan Three.js'e yüklenir.

## node_modules uyarısı

Bu klasör OneDrive dışında tutuluyor, sebebi tam olarak `node_modules`.
Projeyi asla OneDrive altına taşıma.
