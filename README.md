# Simülasyon Lab --- Zaman Dilimleme

İki makineli bir atölye sistemini **zaman dilimleme (time-slicing)**
yaklaşımıyla adım adım incelemek için hazırlanmış, tarayıcıda çalışan
etkileşimli bir eğitim uygulamasıdır. Simülasyon ve Modelleme dersindeki
örnekleri görselleştirmeyi ve sınav hazırlığını desteklemeyi amaçlar.

## Özellikler

-   Canlı simülasyon: başlatma, duraklatma ve zaman adımları arasında
    gezinme.
-   İki makineli iş akışı: işlerin önce Makine A'da, ardından Makine
    B'de işlenmesini izleme.
-   Düzenlenebilir örnek: yığın büyüklüklerini ve beklenen geliş
    günlerini değiştirerek senaryoyu yeniden çalıştırma.
-   Günlük durum tablosu: kuyruktaki ve işlem gören işleri gün gün
    inceleme.
-   Zaman çizelgesi ve sonuçlar: işlem sürecini ve tamamlanma
    zamanlarını karşılaştırma.
-   CSV dışa aktarma, ders notları ve sınav modu.

## Kullanılan teknolojiler

-   HTML
-   CSS
-   Vanilla JavaScript

Temel kullanım için paket yöneticisi veya derleme adımı gerekmez.

## Dosya yapısı

``` text
zaman-dilimleme-simulator/
├── index.html   # Sayfa yapısı
├── styles.css   # Görsel tasarım
├── app.js       # Simülasyon mantığı ve etkileşimler
└── README.md    # Proje açıklaması
```

## Yerel olarak çalıştırma

1.  ZIP dosyasını indirin ve ayıklayın.
2.  `index.html` dosyasına çift tıklayarak tarayıcıda açın.
3.  Simülasyonu başlatın; zaman adımları arasında ilerleyin ve tabloyu
    inceleyin.

HTML, CSS ve JavaScript dosyalarını aynı klasörde tutun.

## GitHub Pages ile yayınlama

1.  GitHub'da yeni bir **Public repository** oluşturun.
2.  ZIP içindeki dosyaları ayıklayın ve `index.html`, `styles.css`,
    `app.js` ve `README.md` dosyalarını deponun kök dizinine yükleyin.
3.  Depoda **Settings → Pages** bölümünü açın.
4.  **Build and deployment** altında `Deploy from a branch` seçin.
5.  Branch olarak `main`, klasör olarak `/(root)` seçip **Save**
    düğmesine basın.
6.  Yayınlama tamamlandığında GitHub Pages bölümünde görünen bağlantıyı
    açın.

Site adresi genellikle şu biçimdedir:

``` text
https://GITHUB-KULLANICI-ADIN.github.io/DEPO-ADI/
```

Kullanıcı adı ve depo adı alanlarını kendi bilgilerinizle değiştirin.
İlk yayınlama birkaç dakika sürebilir.

## Varsayılan örnek senaryo

    İş numarası   Yığın büyüklüğü   Beklenen geliş günü
  ------------- ----------------- ---------------------
              1               200                     1
              2               400                     8
              3               100                    14
              4               200                    18

İşler önce Makine A'da işlenir. A makinesindeki işlem tamamlandıktan
sonra iş Makine B'ye geçer. B makinesi meşgulse iş, B makinesi için
kuyrukta bekleyebilir.

İşlem süreleri uygulamadaki makine formüllerine göre hesaplanır. Ders
kitabındaki tabloyla karşılaştırırken günlerin başlangıç/bitiş sayımı ve
makinenin gün sonunda hangi duruma geçtiği gibi model varsayımlarını
dikkate alın.

## Modelleme notu

Zaman dilimleme yaklaşımında sistem belirli aralıklarla güncellenir. Her
adımda makinelerin durumu, işlem gören işler ve kuyruklar
değerlendirilir. Zaman dilimi çok büyük seçilirse ara durumlar gözden
kaçabilir; çok küçük seçilirse gereksiz hesaplama yapılabilir.

Bu uygulama eğitim amaçlıdır. Sınavdaki soru farklı işlem süreleri,
geliş zamanları veya kuyruk kuralları veriyorsa çözümü o sorunun
varsayımlarına göre yapın.

## Geliştirme fikirleri

-   Yeni iş ve makine sayısı belirleme
-   Farklı kuyruk disiplinlerini karşılaştırma
-   Makine kullanım oranı ve ortalama bekleme süresi grafikleri
-   Rastgele geliş ve servis süreleriyle olasılıklı benzetim
-   Monte Carlo örnekleri ve adım adım sınav çözümleri

Hata veya geliştirme önerileri için GitHub deposunda bir **Issue**
açabilir ya da **Pull Request** gönderebilirsiniz.

## Lisans

Açık kaynak lisansı eklemek istiyorsanız depoya uygun bir `LICENSE`
dosyası ekleyin. Lisans olmadan başkalarının kodu hangi koşullarda
yeniden kullanabileceği net değildir.

