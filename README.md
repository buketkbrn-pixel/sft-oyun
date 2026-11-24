# S.F.T

Oyunu oyna: https://buketkbrn-pixel.github.io/sft-oyun/

Telefonda ön kamerayla elle oynama ve 360° VR 3 bu adreste çalışır.

Anime kız "Mita" modeli: "Mita Ashley - Anime girl - 3d stylized tpose" © lawlietrecluze (Sketchfab), CC BY 4.0 — oyun için küçültüldü ve iskelet takıldı.

Harita oluşturucu (durdurma menüsü → 🗺️ Harita oluştur) ayrı dosyadadır: `maker.js`. index.html onu yükler; oyunun içindeki değişkenlere `window.__sftG` tablosu (G) üzerinden erişir.

Harita oluşturma sadece admindir. Yayınlanan haritalar durdurma menüsü → 🏪 Harita Mağazası'nda görünür; açınca ağdan gelir, "🚪 Git" ile girilip oynanır (cihaza indirilmez). Herkese açık mağaza bu deponun `maps` dalında durur: `index.json` (başlık, açıklama, sahip, sürüm) ve `m/<id>.json` (harita). Admin oyunun içinden yayınlar (Mağaza → 📤 Yayınladıklarım → GitHub bağla; sadece bu depoya "Contents: Read and write" izni olan bir anahtar yeter, anahtar sadece o cihazda kalır).

Yarış (maceracı → 🏎️ Yarış, Işınla menüsü ya da admin → 🏎️ Yarış) ayrı dosyadadır: `race.js`. Bütün arabalar aynı hızda; drift, nitro, ✦ güç kutuları ve her arabanın kendi özel gücü var. Çok oyunculu odada herkes aynı yarışta, botları oda sahibi yönetir. Battle royale de odada ortaktır.
