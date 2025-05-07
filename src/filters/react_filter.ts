import * as vscode from "vscode";

/**
 * React metinleri için özel filtreleme sınıfı
 */
export class ReactFilter {
  /**
   * Bir metnin React sistem bileşeni olup olmadığını kontrol eder
   * @param text İncelenecek metin
   * @returns Metin bir sistem bileşeni ise true, değilse false
   */
  public static isSystemComponent(text: string): boolean {
    // React bileşenleri ve JSX desenleri için regex
    const systemPatterns = [
      // React bileşenleri
      /^<[A-Z][a-zA-Z0-9]*.*\/>$/,
      /^<[A-Z][a-zA-Z0-9]*>.*<\/[A-Z][a-zA-Z0-9]*>$/,
      /^React\.createElement\(.+\)$/,
      /^React\.cloneElement\(.+\)$/,
      /^React\.Component\(.+\)$/,
      /^React\.PureComponent\(.+\)$/,
      /^React\.memo\(.+\)$/,
      /^React\.forwardRef\(.+\)$/,
      /^React\.lazy\(.+\)$/,
      /^React\.Suspense\(.+\)$/,
      /^React\.Fragment\(.+\)$/,
      /^React\.createContext\(.+\)$/,
      /^React\.useRef\(.+\)$/,
      /^React\.useEffect\(.+\)$/,
      /^React\.useLayoutEffect\(.+\)$/,
      /^React\.useState\(.+\)$/,
      /^React\.useReducer\(.+\)$/,
      /^React\.useMemo\(.+\)$/,
      /^React\.useCallback\(.+\)$/,
      /^React\.useContext\(.+\)$/,
      /^React\.useImperativeHandle\(.+\)$/,
      /^React\.useDebugValue\(.+\)$/,

      // React ekosistem bileşenleri
      /^ReactDOM\.render\(.+\)$/,
      /^ReactDOM\.hydrate\(.+\)$/,
      /^ReactDOM\.createPortal\(.+\)$/,
      /^ReactDOM\.findDOMNode\(.+\)$/,
      /^ReactDOM\.unmountComponentAtNode\(.+\)$/,

      // Hooks çağrıları
      /^use[A-Z][a-zA-Z0-9]*\(.+\)$/,

      // JSX özellikleri
      /^className=/,
      /^style=/,
      /^key=/,
      /^ref=/,
      /^dangerouslySetInnerHTML=/,
      /^htmlFor=/,
      /^onClick=/,
      /^onChange=/,
      /^onSubmit=/,
      /^onBlur=/,
      /^onFocus=/,
      /^onKeyDown=/,
      /^onKeyUp=/,
      /^onKeyPress=/,
      /^onMouseDown=/,
      /^onMouseUp=/,
      /^onMouseOver=/,
      /^onMouseOut=/,
      /^onMouseEnter=/,
      /^onMouseLeave=/,
      /^onTouchStart=/,
      /^onTouchEnd=/,
      /^onTouchMove=/,
      /^onTouchCancel=/,

      // Form özellikleri
      /^value=/,
      /^defaultValue=/,
      /^checked=/,
      /^defaultChecked=/,

      // Component lifecyle
      /^componentDidMount\(\)$/,
      /^componentDidUpdate\(.+\)$/,
      /^componentWillUnmount\(\)$/,
      /^shouldComponentUpdate\(.+\)$/,
      /^getSnapshotBeforeUpdate\(.+\)$/,
      /^getDerivedStateFromProps\(.+\)$/,
      /^getDerivedStateFromError\(.+\)$/,
      /^componentDidCatch\(.+\)$/,
      /^render\(\)$/,
      /^constructor\(.+\)$/,

      // HTML/JSX tag içerikleri
      /^<.*>$/,
      /^{.*}$/,

      // Prop drilling
      /^props\.[a-zA-Z0-9_]+$/,
      /^this\.props\.[a-zA-Z0-9_]+$/,
      /^state\.[a-zA-Z0-9_]+$/,
      /^this\.state\.[a-zA-Z0-9_]+$/,
      /^{props\.[a-zA-Z0-9_]+}$/,
      /^{this\.props\.[a-zA-Z0-9_]+}$/,
      /^{state\.[a-zA-Z0-9_]+}$/,
      /^{this\.state\.[a-zA-Z0-9_]+}$/,

      // Context consumer
      /^<[A-Z][a-zA-Z0-9]*\.Consumer>.*<\/[A-Z][a-zA-Z0-9]*\.Consumer>$/,
      /^<[A-Z][a-zA-Z0-9]*\.Provider value=.*>.*<\/[A-Z][a-zA-Z0-9]*\.Provider>$/,

      // React-Router
      /^<Route path=/,
      /^<Switch>/,
      /^<Link to=/,
      /^<NavLink to=/,
      /^<Redirect to=/,
      /^<BrowserRouter>/,
      /^<HashRouter>/,
      /^<MemoryRouter>/,
      /^<StaticRouter>/,
      /^<Prompt>/,

      // Third-party library bileşenleri
      /^<FormattedMessage /,
      /^<I18n>/,
      /^<Trans>/,
      /^<Provider>/,
      /^<connect\(.+\)>$/,
      /^useSelector\(.+\)$/,
      /^useDispatch\(.+\)$/,
      /^useStore\(.+\)$/,
      /^mapStateToProps\(.+\)$/,
      /^mapDispatchToProps\(.+\)$/,
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
      /\.(png|jpg|jpeg|gif|svg|pdf|ttf|mp3|mp4|html|js|jsx|ts|tsx|css|scss|less|json|md)$/i.test(
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
      /^[a-z][a-zA-Z0-9]*([A-Z][a-zA-Z0-9]*)+$/.test(s) || // camelCase
      /^[A-Z][a-zA-Z0-9]+$/.test(s) || // PascalCase
      /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(s) || // kebab-case
      /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(s) // snake_case
    ) {
      return false;
    }

    // JavaScript ve JSX/TSX sözdizimini yoksay
    if (
      /^\{.*\}$/.test(s) || // JSX expressions
      /^<.*>$/.test(s) || // JSX tags
      /^function\s*\(.*\)/.test(s) || // function declarations
      /^\(.*\)\s*=>/.test(s) || // arrow functions
      /^import\s/.test(s) || // import statements
      /^export\s/.test(s) || // export statements
      /^const\s/.test(s) || // const declarations
      /^let\s/.test(s) || // let declarations
      /^var\s/.test(s) || // var declarations
      /^return\s/.test(s) // return statements
    ) {
      return false;
    }

    return true;
  }

  /**
   * React ve JSX öznitelik ve özellikleri
   * @param text İncelenecek metin
   * @returns Özellik ismi ise true, değilse false
   */
  public static isCommonAttribute(text: string): boolean {
    // React/JSX yaygın öznitelik ve özellikleri
    const commonAttributes = [
      // HTML öznitelikleri
      "id",
      "className",
      "style",
      "title",
      "lang",
      "dir",
      "accessKey",
      "tabIndex",
      "hidden",
      "draggable",
      "spellCheck",
      "translate",
      "contentEditable",

      // Form öznitelikleri
      "action",
      "method",
      "name",
      "value",
      "placeholder",
      "defaultValue",
      "required",
      "disabled",
      "readOnly",
      "autoFocus",
      "autoComplete",
      "checked",
      "defaultChecked",
      "maxLength",
      "minLength",
      "pattern",
      "type",
      "accept",
      "multiple",
      "min",
      "max",
      "step",

      // React özellikleri
      "key",
      "ref",
      "dangerouslySetInnerHTML",
      "suppressContentEditableWarning",
      "suppressHydrationWarning",
      "itemProp",
      "itemScope",
      "itemType",
      "itemRef",
      "itemID",

      // Erişilebilirlik özellikleri
      "aria-label",
      "aria-labelledby",
      "aria-describedby",
      "aria-details",
      "aria-hidden",
      "aria-live",
      "aria-atomic",
      "aria-busy",
      "aria-current",
      "aria-disabled",
      "aria-expanded",
      "aria-haspopup",
      "aria-pressed",
      "aria-selected",
      "aria-sort",
      "aria-valuemin",
      "aria-valuemax",
      "aria-valuenow",
      "aria-valuetext",
      "aria-controls",
      "aria-owns",
      "aria-flowto",
      "aria-activedescendant",
      "aria-colcount",
      "aria-colindex",
      "aria-colspan",
      "aria-rowcount",
      "aria-rowindex",
      "aria-rowspan",
      "aria-posinset",
      "aria-setsize",
      "aria-autocomplete",
      "aria-checked",
      "aria-errormessage",
      "aria-invalid",
      "aria-keyshortcuts",
      "aria-level",
      "aria-modal",
      "aria-multiline",
      "aria-multiselectable",
      "aria-orientation",
      "aria-placeholder",
      "aria-readonly",
      "aria-required",
      "aria-roledescription",

      // Olay işleyicileri
      "onClick",
      "onDoubleClick",
      "onChange",
      "onInput",
      "onSubmit",
      "onFocus",
      "onBlur",
      "onKeyDown",
      "onKeyPress",
      "onKeyUp",
      "onMouseDown",
      "onMouseUp",
      "onMouseMove",
      "onMouseOver",
      "onMouseOut",
      "onMouseEnter",
      "onMouseLeave",
      "onWheel",
      "onScroll",
      "onTouchStart",
      "onTouchMove",
      "onTouchEnd",
      "onTouchCancel",
      "onDrag",
      "onDragEnd",
      "onDragEnter",
      "onDragExit",
      "onDragLeave",
      "onDragOver",
      "onDragStart",
      "onDrop",

      // React component state ve props
      "props",
      "state",
      "setState",
      "forceUpdate",
      "context",
      "childContextTypes",
      "defaultProps",
      "displayName",
      "propTypes",

      // Genel parametre isimleri
      "children",
      "component",
      "render",
      "data",
      "items",
      "options",
      "label",
      "icon",
      "color",
      "size",
      "variant",
      "theme",
      "loading",
      "error",
      "success",
      "warning",
      "info",
    ];

    return commonAttributes.includes(text.trim());
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
   * JSX/TSX içeriğinde bir içerik olup olmadığını kontrol eder
   * @param text İncelenecek metin
   * @returns JSX içeriği ise true, değilse false
   */
  public static isJSXContent(text: string): boolean {
    const s = text.trim();

    // JSX ifadesi içeriyor mu?
    if (/<[a-zA-Z][\s\S]*>|<\/[a-zA-Z][\s\S]*>/.test(s)) {
      return true;
    }

    // JSX fragment içeriyor mu?
    if (/<>[\s\S]*<\/>/.test(s)) {
      return true;
    }

    // Kapalı JSX tag içeriyor mu?
    if (/<[a-zA-Z][\s\S]*\/>/.test(s)) {
      return true;
    }

    // JavaScript ifadesi içeriyor mu?
    if (/\{[\s\S]*\}/.test(s)) {
      return true;
    }

    return false;
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

    // React/JSX sistem bileşenlerini ve ifadelerini yoksay
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

    // Yaygın JSX özniteliklerini yoksay
    if (this.isCommonAttribute(s)) {
      return false;
    }

    // JSX içeriği ise yoksay
    if (this.isJSXContent(s)) {
      return false;
    }

    // Doğal dil özellikleri var ve çeviri için uygun ise çevir
    return (
      this.hasNaturalLanguageCharacteristics(s) && this.isValidForTranslation(s)
    );
  }
}
