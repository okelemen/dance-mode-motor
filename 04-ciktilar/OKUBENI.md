# 04 — Çıktılar

Render edilmiş videolar ve kapaklar.

## Adlandırma

```
bolum-01-neon-grid.mp4        <- 1080p / 30 fps
bolum-01-kapak.png            <- 1280x720
```

## Hedef format

1080p · 30 fps · H.264 · sabit tünel hızı · kesme yok

## Kapak

Aynı motordan alınan **tek kare** + overlay:

| Öğe | İçerik |
|---|---|
| Üst metin | `NEW GAME` veya `DANCE MODE` (dönüşümlü) |
| Rozet | `NEW LEVEL n` |
| Combo rakamı | Bölümün toplam cue sayısı |

Combo rakamı render bitince otomatik hesaplanır ve kapağa basılır.
Bilerek spoiler ediliyor — bu bir bilgi kaybı değil, meydan okuma.
Bkz. `../docs/KAYNAK-KANAL.md`

## Not

Tam render **bu makinede yapılmayacak**, GitHub Actions'tan artifact olarak inecek.
Bkz. `../docs/MAKINE-DURUMU.md`
