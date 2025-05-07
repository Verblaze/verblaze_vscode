import * as vscode from "vscode";

/**
 * Kotlin metinleri için özel filtreleme sınıfı
 */
export class KotlinFilter {
  /**
   * Bir metnin Kotlin/Android sistem bileşeni olup olmadığını kontrol eder
   * @param text İncelenecek metin
   * @returns Metin bir sistem bileşeni ise true, değilse false
   */
  public static isSystemComponent(text: string): boolean {
    // Kotlin sistem bileşenleri için regex desenler
    const systemPatterns = [
      // Android View oluşturma ve kullanım desenleri
      /^TextView\(.+\)$/,
      /^EditText\(.+\)$/,
      /^Button\(.+\)$/,
      /^ImageView\(.+\)$/,
      /^ImageButton\(.+\)$/,
      /^LinearLayout\(.+\)$/,
      /^RelativeLayout\(.+\)$/,
      /^FrameLayout\(.+\)$/,
      /^ConstraintLayout\(.+\)$/,
      /^ListView\(.+\)$/,
      /^RecyclerView\(.+\)$/,
      /^GridView\(.+\)$/,
      /^ViewPager\(.+\)$/,
      /^TabLayout\(.+\)$/,
      /^Toolbar\(.+\)$/,
      /^ActionBar\(.+\)$/,
      /^BottomNavigationView\(.+\)$/,
      /^NavigationView\(.+\)$/,
      /^Spinner\(.+\)$/,
      /^CheckBox\(.+\)$/,
      /^RadioButton\(.+\)$/,
      /^Switch\(.+\)$/,
      /^SeekBar\(.+\)$/,
      /^ProgressBar\(.+\)$/,
      /^AlertDialog\(.+\)$/,

      // Jetpack Compose bileşenleri
      /^Text\(.+\)$/,
      /^Column\(.+\)$/,
      /^Row\(.+\)$/,
      /^Box\(.+\)$/,
      /^Surface\(.+\)$/,
      /^Card\(.+\)$/,
      /^Scaffold\(.+\)$/,
      /^TopAppBar\(.+\)$/,
      /^BottomAppBar\(.+\)$/,
      /^LazyColumn\(.+\)$/,
      /^LazyRow\(.+\)$/,
      /^LazyVerticalGrid\(.+\)$/,
      /^Button\(.+\)$/,
      /^IconButton\(.+\)$/,
      /^FloatingActionButton\(.+\)$/,
      /^Icon\(.+\)$/,
      /^Image\(.+\)$/,
      /^TextField\(.+\)$/,
      /^OutlinedTextField\(.+\)$/,
      /^Checkbox\(.+\)$/,
      /^RadioButton\(.+\)$/,
      /^Switch\(.+\)$/,
      /^Slider\(.+\)$/,
      /^CircularProgressIndicator\(.+\)$/,
      /^LinearProgressIndicator\(.+\)$/,
      /^Divider\(.+\)$/,
      /^Spacer\(.+\)$/,
      /^Dialog\(.+\)$/,
      /^ModalBottomSheet\(.+\)$/,
      /^Snackbar\(.+\)$/,
      /^DropdownMenu\(.+\)$/,

      // Kotlin/Android sistem özellikleri ve sabitler
      /^Gravity\.[A-Z_]+$/,
      /^View\.[A-Z_]+$/,
      /^Color\.[A-Z_]+$/,
      /^android\.R\.color\.[a-z_]+$/,
      /^android\.R\.string\.[a-z_]+$/,
      /^android\.R\.drawable\.[a-z_]+$/,
      /^android\.R\.layout\.[a-z_]+$/,
      /^android\.R\.id\.[a-z_]+$/,
      /^R\.color\.[a-z_]+$/,
      /^R\.string\.[a-z_]+$/,
      /^R\.drawable\.[a-z_]+$/,
      /^R\.layout\.[a-z_]+$/,
      /^R\.id\.[a-z_]+$/,
      /^R\.dimen\.[a-z_]+$/,
      /^R\.style\.[a-z_]+$/,
      /^R\.attr\.[a-z_]+$/,
      /^DrawerLayout\.LOCK_MODE_[A-Z_]+$/,
      /^ViewGroup\.LayoutParams\.[A-Z_]+$/,
      /^androidx\.[a-zA-Z.]+$/,
      /^MaterialTheme\.[a-zA-Z.]+$/,
      /^Modifier\.[a-zA-Z.]+$/,
      /^ContentScale\.[A-Z_]+$/,
      /^TextAlign\.[A-Z_]+$/,
      /^FontWeight\.[A-Z_]+$/,
      /^TextOverflow\.[A-Z_]+$/,
      /^SelectionMode\.[A-Z_]+$/,
      /^Shape\.[A-Z_]+$/,
      /^Intent\.[A-Z_]+$/,
      /^Activity\.[A-Z_]+$/,
      /^Bundle\.[A-Z_]+$/,

      // Kotlin/Android metot çağrıları
      /^findViewByid\(.+\)$/,
      /^findViewById\(.+\)$/,
      /^getString\(R\.string\.[a-z_]+\)$/,
      /^getColor\(R\.color\.[a-z_]+\)$/,
      /^getDrawable\(R\.drawable\.[a-z_]+\)$/,
      /^setContentView\(R\.layout\.[a-z_]+\)$/,
      /^getString\(context, R\.string\.[a-z_]+\)$/,
      /^stringResource\(R\.string\.[a-z_]+\)$/,
      /^stringResource\(id = R\.string\.[a-z_]+\)$/,
      /^colorResource\(R\.color\.[a-z_]+\)$/,
      /^colorResource\(id = R\.color\.[a-z_]+\)$/,
      /^painterResource\(R\.drawable\.[a-z_]+\)$/,
      /^painterResource\(id = R\.drawable\.[a-z_]+\)$/,
      /^LocalContext\.current\.getString\(R\.string\.[a-z_]+\)$/,
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
      /\.(png|jpg|jpeg|gif|svg|pdf|ttf|mp3|mp4|html|js|css|kt|java|xml|json|gradle)$/i.test(
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
    if (/^#[0-9a-fA-F]{3,8}$/.test(s)) {
      return false;
    }

    // Kod tanımlayıcılarını yoksay
    if (
      /^[a-z][a-zA-Z0-9]*([A-Z][a-zA-Z0-9]*)+$/.test(s) || // camelCase veya PascalCase
      /^[A-Z][a-zA-Z0-9]+$/.test(s) || // SCREAMING_SNAKE_CASE veya PascalCase
      /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(s) || // snake_case
      /^_[a-zA-Z0-9]+$/.test(s) // _privateVar
    ) {
      return false;
    }

    // Lambda ifadelerini yoksay
    if (/^\{.+\}$/.test(s)) {
      return false;
    }

    return true;
  }

  /**
   * Yaygın Kotlin özelliklerini ve parametrelerini kontrol eder
   * @param text İncelenecek metin
   * @returns Özellik veya parametre ismi ise true, değilse false
   */
  public static isCommonProperty(text: string): boolean {
    // Yaygın Kotlin ve Android özellikleri
    const commonProperties = [
      // View özellikleri
      "id",
      "layout_width",
      "layout_height",
      "layout_margin",
      "layout_padding",
      "background",
      "textColor",
      "textSize",
      "hint",
      "visibility",
      "enabled",
      "checked",
      "selected",
      "clickable",
      "focusable",
      "orientation",
      "gravity",
      "weight",
      "alpha",
      "elevation",
      "translationX",
      "translationY",
      "rotation",
      "scaleX",
      "scaleY",

      // Jetpack Compose özellikleri
      "modifier",
      "color",
      "backgroundColor",
      "contentColor",
      "fontSize",
      "fontWeight",
      "fontStyle",
      "textAlign",
      "lineHeight",
      "letterSpacing",
      "textDecoration",
      "width",
      "height",
      "size",
      "padding",
      "margin",
      "offset",
      "alignment",
      "verticalAlignment",
      "horizontalAlignment",
      "contentAlignment",
      "horizontalArrangement",
      "verticalArrangement",
      "shape",
      "border",
      "elevation",
      "alpha",
      "onClick",
      "onLongClick",
      "onFocusChanged",
      "enabled",
      "interactionSource",
      "indication",
      "selectionMode",
      "value",
      "onValueChange",
      "label",
      "placeholder",
      "readOnly",
      "isError",
      "visualTransformation",
      "keyboardOptions",
      "keyboardActions",
      "singleLine",
      "maxLines",
      "contentScale",
      "contentDescription",
      "painter",
      "imageVector",
      "bitmap",
      "tint",
      "scrollState",
      "lazyListState",
      "pagerState",
      "scaffoldState",
      "snackbarHostState",
      "drawBehind",
      "drawWithContent",

      // Genel parametre isimleri
      "context",
      "intent",
      "bundle",
      "activity",
      "fragment",
      "view",
      "layoutInflater",
      "viewGroup",
      "parent",
      "savedInstanceState",
      "position",
      "viewType",
      "holder",
      "adapter",
      "layoutManager",
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

    // Kotlin/Android sistem bileşenlerini yoksay
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

    // Yaygın özellikleri ve parametreleri yoksay
    if (this.isCommonProperty(s)) {
      return false;
    }

    // Doğal dil özellikleri var ve çeviri için uygun ise çevir
    return (
      this.hasNaturalLanguageCharacteristics(s) && this.isValidForTranslation(s)
    );
  }
}
