import * as vscode from "vscode";

/**
 * Swift metinleri için özel filtreleme sınıfı
 * string_extractors.py'daki Swift filtrelerine benzer şekilde çalışır
 */
export class SwiftFilter {
  /**
   * Bir metnin Swift sistem bileşeni olup olmadığını kontrol eder
   * @param text İncelenecek metin
   * @returns Metin bir sistem bileşeni ise true, değilse false
   */
  public static isSystemComponent(text: string): boolean {
    // Swift sistem bileşenleri için regex desenler
    const systemPatterns = [
      // SF Symbols ve sistem image isimleri
      /^Image\(systemName:.+\)$/,
      /^UIImage\(systemName:.+\)$/,
      /^SF[A-Za-z]*\(systemName:.+\)$/,
      /^systemName:.+$/,
      /^named:.+$/,

      // SwiftUI genel kontrol desenleri
      /^TextField\(".+", text:.+\)$/,
      /^SecureField\(".+", text:.+\)$/,
      /^DatePicker\(".+", selection:.+\)$/,
      /^Picker\(".+", selection:.+\)$/,
      /^Toggle\(".+", isOn:.+\)$/,
      /^Button\(".+"\).+$/,
      /^NavigationLink\(".+",.+\)$/,
      /^Menu\(".+"\).+$/,
      /^TabItem\(".+", .+\)$/,
      /^ToolbarItem\(.+\)$/,
      /^Label\(".+", .+\)$/,

      // SwiftUI görünüm değiştiricileri
      /^\.navigationTitle\(".+"\)$/,
      /^\.navigationBarTitle\(".+"\)$/,
      /^\.tabItem\(.+\)$/,
      /^\.alert\(".+", isPresented:.+\)$/,

      // Diğer sistem sembolleri
      /^Symbol\(.+\)$/,
      /^Icon\(.+\)$/,
      /^NSLocalizedString\(.+\)$/,
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
      /\.(png|jpg|jpeg|gif|svg|pdf|ttf|mp3|mp4|html|js|css)$/i.test(s)
    ) {
      return false;
    }

    // Sadece sayı olan metinleri yoksay
    if (/^\d+(\.\d+)?$/.test(s)) {
      return false;
    }

    // Hex değerlerini yoksay (renkler gibi)
    if (/^#[0-9a-fA-F]{3,8}$/.test(s)) {
      return false;
    }

    // Kod tanımlayıcılarını yoksay
    if (
      /^[a-z][a-zA-Z0-9]*([A-Z][a-zA-Z0-9]*)+$/.test(s) ||
      /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(s)
    ) {
      return false;
    }

    return true;
  }

  /**
   * UI bileşeni parametre isimlerini kontrol eder
   * @param text İncelenecek metin
   * @returns Parametre ismi ise true, değilse false
   */
  public static isCommonParameterName(text: string): boolean {
    // Yaygın UI bileşeni parametre isimleri
    const commonParamNames = [
      "id",
      "alignment",
      "spacing",
      "padding",
      "offset",
      "opacity",
      "cornerRadius",
      "lineLimit",
      "width",
      "height",
      "leading",
      "trailing",
      "top",
      "bottom",
      "center",
      "font",
      "foregroundColor",
      "backgroundColor",
      "accentColor",
      "tint",
      "shadow",
      "border",
      "frame",
      "position",
      "scale",
      "rotation",
      "onAppear",
      "onDisappear",
      "onChange",
      "onTapGesture",
      "onLongPressGesture",
    ];

    return commonParamNames.includes(text.trim());
  }

  /**
   * Filtreleme desenleriyle eşleşip eşleşmediğini kontrol eder
   * @param text İncelenecek metin
   * @param patterns Regex desenleri
   * @returns Desenlerden biriyle eşleşirse true, değilse false
   */
  public static matchesFilteringPatterns(
    text: string,
    patterns: string[]
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

    // Swift sistem bileşenlerini yoksay
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

    // Yaygın parametre isimlerini yoksay
    if (this.isCommonParameterName(s)) {
      return false;
    }

    // Doğal dil özellikleri var ve çeviri için uygun ise çevir
    return (
      this.hasNaturalLanguageCharacteristics(s) && this.isValidForTranslation(s)
    );
  }
}
