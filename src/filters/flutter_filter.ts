import * as vscode from "vscode";

/**
 * Flutter metinleri için özel filtreleme sınıfı
 */
export class FlutterFilter {
  /**
   * Bir metnin Flutter sistem bileşeni olup olmadığını kontrol eder
   * @param text İncelenecek metin
   * @returns Metin bir sistem bileşeni ise true, değilse false
   */
  public static isSystemComponent(text: string): boolean {
    // Flutter sistem bileşenleri için regex desenler
    const systemPatterns = [
      // Widget ve bileşen desenleri
      /^Text\(.+\)$/,
      /^Icon\(.+\)$/,
      /^Image\(.+\)$/,
      /^AssetImage\(.+\)$/,
      /^NetworkImage\(.+\)$/,
      /^FileImage\(.+\)$/,
      /^MemoryImage\(.+\)$/,
      /^TextField\(.+\)$/,
      /^TextFormField\(.+\)$/,
      /^ElevatedButton\(.+\)$/,
      /^TextButton\(.+\)$/,
      /^OutlinedButton\(.+\)$/,
      /^IconButton\(.+\)$/,
      /^Scaffold\(.+\)$/,
      /^AppBar\(.+\)$/,
      /^BottomNavigationBar\(.+\)$/,
      /^BottomAppBar\(.+\)$/,
      /^AlertDialog\(.+\)$/,
      /^SimpleDialog\(.+\)$/,
      /^SnackBar\(.+\)$/,
      /^ListView\(.+\)$/,
      /^GridView\(.+\)$/,
      /^Container\(.+\)$/,
      /^BoxDecoration\(.+\)$/,
      /^InputDecoration\(.+\)$/,

      // Özellikleri
      /^Icons\.[a-zA-Z0-9_]+$/,
      /^FontWeight\.[a-zA-Z0-9_]+$/,
      /^BorderRadius\.[a-zA-Z0-9_]+$/,
      /^EdgeInsets\.[a-zA-Z0-9_]+$/,
      /^Alignment\.[a-zA-Z0-9_]+$/,
      /^Axis\.[a-zA-Z0-9_]+$/,
      /^MainAxisAlignment\.[a-zA-Z0-9_]+$/,
      /^CrossAxisAlignment\.[a-zA-Z0-9_]+$/,
      /^FontStyle\.[a-zA-Z0-9_]+$/,
      /^TextAlign\.[a-zA-Z0-9_]+$/,
      /^TextDirection\.[a-zA-Z0-9_]+$/,
      /^TextOverflow\.[a-zA-Z0-9_]+$/,
      /^TextBaseline\.[a-zA-Z0-9_]+$/,
      /^TextInputType\.[a-zA-Z0-9_]+$/,
      /^TextInputAction\.[a-zA-Z0-9_]+$/,
      /^BoxShape\.[a-zA-Z0-9_]+$/,
      /^BoxFit\.[a-zA-Z0-9_]+$/,
      /^Clip\.[a-zA-Z0-9_]+$/,
      /^MaterialState\.[a-zA-Z0-9_]+$/,
      /^MaterialStateProperty\.[a-zA-Z0-9_]+$/,
      /^FloatingActionButtonLocation\.[a-zA-Z0-9_]+$/,
      /^FloatingLabelBehavior\.[a-zA-Z0-9_]+$/,

      // Metot çağrıları
      /^MediaQuery\.of\(.+\)$/,
      /^Theme\.of\(.+\)$/,
      /^Navigator\.of\(.+\)$/,
      /^ScaffoldMessenger\.of\(.+\)$/,
      /^FocusScope\.of\(.+\)$/,
      /^Provider\.of\(.+\)$/,
      /^context\.watch\(.+\)$/,
      /^context\.read\(.+\)$/,
      /^Get\.to\(.+\)$/,
      /^Get\.toNamed\(.+\)$/,
      /^Get\.off\(.+\)$/,
      /^Get\.offNamed\(.+\)$/,

      // i18n ve localization
      /^AppLocalizations\.of\(.+\)$/,
      /^S\.of\(.+\)$/,
      /^S\.current\.[a-zA-Z0-9_]+$/,
      /^LocaleKeys\.[a-zA-Z0-9_]+\.tr\(\)$/,
      /^tr\(['"]+.+['"]$/,
    ];

    return systemPatterns.some((pattern) => pattern.test(text.trim()));
  }

  /**
   * Metnin doğal dil özelliklerine sahip olup olmadığını kontrol eder
   * @param text İncelenecek metin
   * @returns Doğal dil özellikleri varsa true, yoksa false
   */
  public static hasNaturalLanguageCharacteristics(text: string): boolean {
    const s = text.trim();

    // Doğal dil genellikle boşluk içerir
    if (s.includes(" ")) {
      return true;
    }

    // Doğal dil genellikle noktalama işaretleri içerir
    if (/[.,:;!?]/.test(s)) {
      return true;
    }

    // Büyük harfle başlayıp küçük harfle devam eden cümleler doğal dil olabilir
    if (s.length > 1 && /^[A-Z][a-z]+$/.test(s)) {
      return true;
    }

    return false;
  }

  /**
   * Metnin çeviri için uygun olup olmadığını kontrol eder
   * @param text İncelenecek metin
   * @returns Çeviri için uygunsa true, değilse false
   */
  public static isValidForTranslation(text: string): boolean {
    const s = text.trim();

    // Boş veya çok kısa metinleri yoksay
    if (s.length < 2) {
      return false;
    }

    // Dosya yollarını, URL'leri veya uzantıları yoksay
    if (
      /^[./\\]/.test(s) ||
      /\.(png|jpg|jpeg|gif|svg|pdf|ttf|mp3|mp4|html|js|css|dart|yaml|json)$/i.test(
        s
      )
    ) {
      return false;
    }

    // Sadece sayı olan metinleri yoksay
    if (/^\d+(\.\d+)?$/.test(s)) {
      return false;
    }

    // Hex değerlerini yoksay (renkler gibi)
    if (/^#[0-9a-fA-F]{3,8}$/.test(s) || /^0x[0-9a-fA-F]{1,8}$/.test(s)) {
      return false;
    }

    // Kod tanımlayıcılarını yoksay
    if (
      /^[a-z][a-zA-Z0-9]*([A-Z][a-zA-Z0-9]*)+$/.test(s) || // camelCase veya PascalCase
      /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(s) || // snake_case
      /^_[a-zA-Z0-9]+$/.test(s) // _privateVar
    ) {
      return false;
    }

    // Flutter'a özgü regex parametrelerini yoksay
    if (/^r'.*'$/.test(s) || /^r".*"$/.test(s)) {
      return false;
    }

    return true;
  }

  /**
   * Yaygın widget parametrelerini kontrol eder
   * @param text İncelenecek metin
   * @returns Parametre ismi ise true, değilse false
   */
  public static isCommonWidgetProperty(text: string): boolean {
    // Yaygın Flutter widget özellikleri
    const commonProperties = [
      "key",
      "child",
      "children",
      "builder",
      "onPressed",
      "onTap",
      "onChanged",
      "onSubmitted",
      "onSaved",
      "validator",
      "controller",
      "focusNode",
      "style",
      "decoration",
      "margin",
      "padding",
      "width",
      "height",
      "color",
      "backgroundColor",
      "foregroundColor",
      "textColor",
      "icon",
      "icons",
      "image",
      "alignment",
      "mainAxisAlignment",
      "crossAxisAlignment",
      "mainAxisSize",
      "textAlign",
      "textDirection",
      "overflow",
      "softWrap",
      "maxLines",
      "flex",
      "expanded",
      "flexible",
      "constrains",
      "borderRadius",
      "border",
      "shape",
      "elevation",
      "shadowColor",
      "itemCount",
      "itemBuilder",
      "separatorBuilder",
      "scrollDirection",
      "physics",
      "shrinkWrap",
      "primary",
      "secondary",
      "leading",
      "trailing",
      "title",
      "subtitle",
      "actions",
      "floatingActionButton",
      "bottomNavigationBar",
      "drawer",
      "endDrawer",
      "appBar",
      "body",
      "data",
      "index",
      "context",
    ];

    return commonProperties.includes(text.trim());
  }

  /**
   * Filtreleme desenleriyle eşleşip eşleşmediğini kontrol eder
   * @param text İncelenecek metin
   * @param patterns Regex desenleri
   * @returns Desenlerden biriyle eşleşirse true, değilse false
   */
  public static matchesFilteringPatterns(
    text: string,
    patterns: string[] = []
  ): boolean {
    return patterns.some((pattern) => {
      try {
        const regex = new RegExp(pattern);
        return regex.test(text.trim());
      } catch (e) {
        console.error(`Invalid regex pattern: ${pattern}`, e);
        return false;
      }
    });
  }

  /**
   * Verilen bir metni filtreleme kriterlerine göre kontrol eder
   * @param text İncelenecek metin
   * @param filteringPatterns patterns.json'dan alınan filtreleme desenleri
   * @param keywordsToIgnore patterns.json'dan alınan yoksayılacak anahtar kelimeler
   * @returns Metin çevrilmeli ise true, aksi halde false
   */
  public static shouldTranslate(
    text: string,
    filteringPatterns: string[] = [],
    keywordsToIgnore: string[] = []
  ): boolean {
    const s = text.trim();

    // Boş metinleri yoksay
    if (!s) {
      return false;
    }

    // Flutter sistem bileşenlerini yoksay
    if (this.isSystemComponent(s)) {
      return false;
    }

    // Filtreleme desenlerine göre yoksay
    if (this.matchesFilteringPatterns(s, filteringPatterns)) {
      return false;
    }

    // Yoksayılacak anahtar kelimelere göre yoksay
    if (keywordsToIgnore.includes(s)) {
      return false;
    }

    // Yaygın widget özelliklerini yoksay
    if (this.isCommonWidgetProperty(s)) {
      return false;
    }

    // Doğal dil özellikleri var ve çeviri için uygun ise çevir
    return (
      this.hasNaturalLanguageCharacteristics(s) && this.isValidForTranslation(s)
    );
  }
}
