import * as vscode from "vscode";
import { ReactFilter } from "./react_filter";

/**
 * Next.js metinleri için özel filtreleme sınıfı
 * React filtresi temel alınır ve Next.js'e özgü ek kontroller eklenir
 */
export class NextjsFilter extends ReactFilter {
  /**
   * Bir metnin Next.js sistem bileşeni olup olmadığını kontrol eder
   * @param text İncelenecek metin
   * @returns Metin bir sistem bileşeni ise true, değilse false
   */
  public static isSystemComponent(text: string): boolean {
    // Önce üst sınıfın kontrolünü çalıştır (React sistem bileşenleri)
    if (super.isSystemComponent(text)) {
      return true;
    }

    // Next.js'e özgü bileşenler ve desenleri için regex
    const nextjsPatterns = [
      // Next.js bileşenleri
      /^<Head>.*<\/Head>$/,
      /^<Link href=.*>.*<\/Link>$/,
      /^<Image src=.*\/>$/,
      /^<Script.*>.*<\/Script>$/,
      /^<NextScript>.*<\/NextScript>$/,
      /^<NextHead>.*<\/NextHead>$/,
      /^<Document>.*<\/Document>$/,
      /^<Main>.*<\/Main>$/,
      /^<App>.*<\/App>$/,
      /^<ErrorBoundary>.*<\/ErrorBoundary>$/,
      /^<DefaultSeo.*\/>$/,
      /^<Seo.*\/>$/,
      /^<Header>.*<\/Header>$/,
      /^<Footer>.*<\/Footer>$/,
      /^<Layout>.*<\/Layout>$/,
      /^<Sidebar>.*<\/Sidebar>$/,
      /^<Navigation>.*<\/Navigation>$/,
      /^<Provider>.*<\/Provider>$/,

      // Next.js API çağrıları
      /^getStaticProps\(.+\)$/,
      /^getStaticPaths\(.+\)$/,
      /^getServerSideProps\(.+\)$/,
      /^useRouter\(\)$/,
      /^router\.query\.[a-zA-Z0-9_]+$/,
      /^router\.push\(.+\)$/,
      /^router\.replace\(.+\)$/,
      /^router\.prefetch\(.+\)$/,
      /^router\.back\(\)$/,
      /^router\.reload\(\)$/,
      /^router\.events\.[a-zA-Z0-9_]+$/,
      /^NextResponse\.[a-zA-Z0-9_]+\(.+\)$/,
      /^NextRequest\.[a-zA-Z0-9_]+\(.+\)$/,
      /^NextApiRequest\.[a-zA-Z0-9_]+\(.+\)$/,
      /^NextApiResponse\.[a-zA-Z0-9_]+\(.+\)$/,

      // Next.js özellikleri
      /^href=/,
      /^as=/,
      /^prefetch=/,
      /^shallow=/,
      /^scroll=/,
      /^getLayout=/,
      /^priority=/,
      /^quality=/,
      /^loading=/,
      /^lazyBoundary=/,
      /^lazyRoot=/,
      /^unoptimized=/,
      /^locale=/,
      /^fallback=/,
      /^sizes=/,
      /^domains=/,
      /^deviceSizes=/,
      /^imageSizes=/,
      /^path=/,
      /^dangerouslyAllowSVG=/,
      /^contentSecurityPolicy=/,
      /^disableStaticImages=/,

      // Next.js config
      /^next\.config\.js$/,
      /^next\.config\.[a-zA-Z0-9_]+$/,
      /^next\/[a-zA-Z0-9/]+$/,
      /^module\.exports\s*=\s*/,
      /^withPlugins\(.+\)$/,
      /^withTM\(.+\)$/,
      /^withBundleAnalyzer\(.+\)$/,
      /^withMDX\(.+\)$/,
      /^withCSS\(.+\)$/,
      /^withSass\(.+\)$/,
      /^withLess\(.+\)$/,
      /^withStylus\(.+\)$/,
      /^withImages\(.+\)$/,
      /^withFonts\(.+\)$/,
      /^withPWA\(.+\)$/,
      /^withOffline\(.+\)$/,
      /^withTypescript\(.+\)$/,
      /^withEslint\(.+\)$/,

      // Next.js dosya sistemine dayalı yönlendirme
      /^pages\/[a-zA-Z0-9/]+$/,
      /^app\/[a-zA-Z0-9/]+$/,
      /^api\/[a-zA-Z0-9/]+$/,
      /^public\/[a-zA-Z0-9/]+$/,
      /^styles\/[a-zA-Z0-9/]+$/,
      /^components\/[a-zA-Z0-9/]+$/,
      /^layout\.jsx?$/,
      /^layout\.tsx?$/,
      /^page\.jsx?$/,
      /^page\.tsx?$/,
      /^loading\.jsx?$/,
      /^loading\.tsx?$/,
      /^error\.jsx?$/,
      /^error\.tsx?$/,
      /^not-found\.jsx?$/,
      /^not-found\.tsx?$/,
      /^\[.*\]\.jsx?$/,
      /^\[.*\]\.tsx?$/,
      /^\[\[.*\]\]\.jsx?$/,
      /^\[\[.*\]\]\.tsx?$/,

      // App Router özellikleri
      /^"use client"$/,
      /^"use server"$/,
      /^usePathname\(\)$/,
      /^useParams\(\)$/,
      /^useSearchParams\(\)$/,
      /^generateStaticParams\(\)$/,
      /^generateMetadata\(\)$/,
    ];

    return nextjsPatterns.some((pattern) => pattern.test(text.trim()));
  }

  /**
   * Metnin çeviri için uygun olup olmadığını kontrol eder
   * @param text İncelenecek metin
   * @returns Çeviri için uygunsa true, değilse false
   */
  public static isValidForTranslation(text: string): boolean {
    // Önce üst sınıfın kontrolünü çalıştır (React çeviri kuralları)
    if (!super.isValidForTranslation(text)) {
      return false;
    }

    const s = text.trim();

    // Next.js'e özgü dosya yapılarını yoksay
    if (
      /^pages\//i.test(s) ||
      /^app\//i.test(s) ||
      /^api\//i.test(s) ||
      /^public\//i.test(s) ||
      /^styles\//i.test(s) ||
      /^lib\//i.test(s) ||
      /^utils\//i.test(s) ||
      /^hooks\//i.test(s) ||
      /^server\//i.test(s) ||
      /^middleware\./i.test(s)
    ) {
      return false;
    }

    // Next.js/Vercel konfigürasyon ifadelerini yoksay
    if (
      /^vercel\.json$/i.test(s) ||
      /^\.vercelignore$/i.test(s) ||
      /^next\.config\.js$/i.test(s) ||
      /^next-env\.d\.ts$/i.test(s) ||
      /^next-i18next\.config\.js$/i.test(s) ||
      /^next-sitemap\.config\.js$/i.test(s)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Next.js'e özgü öznitelik ve özellikleri kontrol eder
   * @param text İncelenecek metin
   * @returns Özellik ismi ise true, değilse false
   */
  public static isNextjsAttribute(text: string): boolean {
    // React'ın genel özelliklerine ek olarak, Next.js'e özgü olanlar
    const nextjsAttributes = [
      // Next.js bileşen özellikleri
      "href",
      "as",
      "replace",
      "scroll",
      "shallow",
      "passHref",
      "prefetch",
      "locale",
      "legacyBehavior",
      "priority",
      "quality",
      "loading",
      "placeholder",
      "blurDataURL",
      "unoptimized",
      "lazyBoundary",
      "lazyRoot",
      "sizes",
      "locale",
      "fallback",
      "basePath",
      "domains",
      "deviceSizes",
      "imageSizes",
      "path",
      "dangerouslyAllowSVG",
      "contentSecurityPolicy",
      "disableStaticImages",
      "strategy",
      "onLoad",
      "onReady",
      "onError",
      "afterInteractive",
      "beforeInteractive",
      "lazyOnload",

      // App Router özel özellikleri
      "suspense",
      "preferedRegion",
      "fetchCache",
      "revalidate",
      "dynamic",
      "fetchKey",
      "generateStaticParams",
      "generateMetadata",
      "segment",
      "params",
      "searchParams",

      // Getters / lifecycle hooks
      "getStaticProps",
      "getStaticPaths",
      "getServerSideProps",
      "getInitialProps",

      // Routing özellikleri
      "router",
      "pathname",
      "query",
      "asPath",
      "basePath",
      "locale",
      "isReady",
      "isFallback",
      "isPreview",
      "events",

      // Config özellikleri
      "rewrites",
      "redirects",
      "headers",
      "compress",
      "poweredByHeader",
      "generateEtags",
      "distDir",
      "assetPrefix",
      "trailingSlash",
      "i18n",
      "locales",
      "defaultLocale",
      "localeDetection",
      "env",
      "publicRuntimeConfig",
      "serverRuntimeConfig",
      "webpack",
      "experimental",
    ];

    // Önce React özelliklerini kontrol et
    if (super.isCommonAttribute(text)) {
      return true;
    }

    // Next.js'e özgü özellikleri kontrol et
    return nextjsAttributes.includes(text.trim());
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

    // Next.js ve React sistem bileşenlerini ve ifadelerini yoksay
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

    // Next.js ve React özniteliklerini yoksay
    if (this.isNextjsAttribute(s)) {
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
