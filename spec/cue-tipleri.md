# Cue tipleri

Bir "cue", izleyiciden beklenen tek bir hareket. Ekranda **vuruşundan tam 1 ölçü
(2 sn) önce** doğar, tünelde ilerler, vuruş çizgisinde çözülür.

---

## İKİ HAREKET AİLESİ

| Aile | Ne | Siluetin rolü | Durum |
|---|---|---|---|
| **Tepki** | adım, zıpla, çömel, kaç, yumruk | Tepki veren | **Faz 1 — aktif** |
| **Takip** | running man, raise the roof, shimmy, twist, charleston | **Öğretmen** | Faz 2 — planlandı |

Tepki hareketleri oyun mekaniğidir: izleyici anında tepki verir, combo işler.
Takip hareketleri bir-iki ölçü boyunca *yapılan* şeylerdir — gerçek dans ve
antrenman değeri buradan gelir.

Format ikisinin dönüşümünden kazanır: tepki bölümleri nabzı yükseltir, takip
bölümleri hem nefes aldırır hem kanalın "Full Body" vaadini karşılar.
Molalar boş kalmaz, takip hareketine dönüşür.

> **Faz kararı (23 Ağu 2026):** Önce sadece tepki ailesiyle başlanacak. Motor,
> ızgara ve prototip bunun üstüne kurulacak. Takip ailesi kademeli eklenecek —
> klip listesi hazır, bkz. `../docs/MIXAMO-HAREKET-LISTESI.md` "FAZ 2".

**Faz 2'nin getireceği tasarım işi:** cue görsel dili büyümek zorunda. Şu anki
tasarım zeminde lane'lere dayanıyor; bu adım ve kaçış için mükemmel ama "gövde
döndür" veya "kol çevir" hareketini yerdeki bir kareyle anlatamazsın. Üst vücut
için ayrı bir cue ailesi gerekecek: göğüs hizasında gelen halkalar, yandan
süpüren yaylar gibi.

## Temel tipler (1. bölümden itibaren)

| Kod | Ekranda | İzleyici ne yapar | Lane |
|---|---|---|---|
| `step_L` | Sol adım karesi | Sola adım | 0 |
| `step_R` | Sağ adım karesi | Sağa adım | 2 |
| `jump` | Çift halka, yukarı ok | Zıplar | 1 |
| `duck` | Alçak bariyer | Çömelir | 1 |
| `dodge_L` | Sağdan gelen engel | Sola kaçar | 0 |
| `dodge_R` | Soldan gelen engel | Sağa kaçar | 2 |
| `arms_up` | Yükselen ışık sütunu | Kolları kaldırır | 1 |
| `rest` | Boş | Dinlenir | — |

## İleri tipler (bölüm mekaniği olarak tanıtılır)

| Kod | Ekranda | Hangi bölümde | Not |
|---|---|---|---|
| `hold` | Uzayan bant | Tutma notası bölümü | Süre `vurus` cinsinden verilir |
| `double` | İki lane aynı anda | Çift lane bölümü | İki ayrı cue değil, tek `double` |
| `spin` | Dönen halka | Dönüş bölümü | 2 ölçü sürer |
| `punch` | Öne çıkan hedef | Punch bölümü | |
| `mirror` | Ayna simgesi | Ayna modu bölümü | Sonraki 8 ölçü ters çevrilir |
| `half` | Yarım tempo işareti | Yarım tempo bölümü | Sonraki 8 ölçü 2 vuruşta bir |

> **Kural:** her bölüm ileri tiplerden **yalnızca birini** tanıtır ve ilk 32 ölçüde
> (öğretme bölümü) öğretir. "NEW LEVEL" vaadi bununla karşılanır.
> Bkz. `DANCE-MODE-PLANI.md` bölüm 6.

---

## Cue → hareket eşlemesi

Her cue tipi, `02-hareketler/` içindeki bir Mixamo klibine karşılık gelir.
Siluetin **cue ile aynı vuruşta** tepki vermesi zorunlu; kayarsa yanılsama çöker.

Süreler indirilen kliplerin ölçülen ham uzunluğuna göre belirlendi
(bkz. `../docs/MIXAMO-HAREKET-LISTESI.md`). Hepsi indirilmiş durumda.

| Cue | Hareket dosyası | Süre |
|---|---|---|
| `step_L` | `step-left.fbx` | **yarım ölçü** |
| `step_R` | `step-right.fbx` | **yarım ölçü** |
| `jump` | `jump.fbx` | 1 ölçü |
| `duck` | `duck.fbx` (Air Squat) | 1 ölçü |
| `dodge_L` | `dodge-right.fbx` **aynalanır** | 1 ölçü |
| `dodge_R` | `dodge-right.fbx` | 1 ölçü |
| `arms_up` | `arms-up.fbx` (Overhead Squat) | 1 ölçü |
| `punch` | `punch.fbx` | 1 ölçü |
| `rest` | `idle.fbx` (Fitness Idle) | 1 ölçü |
| dolgu | `jacks.fbx` (Jumping Jacks) | **yarım ölçü** |
| yedek | `jump-standing.fbx`, `idle-breathing.fbx` | 1 / 2 ölçü |
| `spin` | *henüz indirilmedi* | 2 ölçü |
| `hold` | *henüz indirilmedi* | değişken |

> **Yarım ölçü kuralı:** yan adımlar ve jumping jacks doğal olarak ~0,9 saniye
> sürüyor. 2,0 saniyeye çekmek hareketi sünger gibi yapardı. Bunlar 2 vuruş
> (1,0 sn) kaplar — koreografideki "1. ve 3. vuruşta adım" düzenine de birebir uyar.

---

## Yoğunluk kademeleri

Zorluk, "ölçü başına kaç cue" ile ayarlanır:

| Kademe | Cue / ölçü | Nerede |
|---|---|---|
| 1 | 1 (sadece 1. vuruş) | Öğretme, molalar |
| 2 | 2 (1. ve 3. vuruş) | Tur 1 |
| 3 | 4 (her vuruş) | Tur 2 |
| 4 | 4 + ileri tip karışımı | Tur 3 |
| 5 | 4 + ileri tip + son 16 ölçüde 8'lik | Final |

---

## Combo mantığı

Combo sayacı **her çözülen cue'da +1** artar ve **hiç sıfırlanmaz.**

Bu bilinçli: izleyici gerçekten oynamıyor, sayaç bir yanılsama aracı.
Sıfırlanırsa "başarısız oldum" hissi doğar ve izleyici bırakır.
Bkz. `DANCE-MODE-PLANI.md` bölüm 2.

Kapaktaki rakam = bölümün toplam cue sayısı. Kapak bunu **spoiler olarak gösterir**;
bu bir bilgi sızıntısı değil, meydan okumadır ("263'e çıkıyor, sen çıkarabilir misin?").
