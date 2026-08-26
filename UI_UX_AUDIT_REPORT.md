# گزارش ممیزی یکپارچگی UI/UX پروژه Ice-Center

**تاریخ:** ۱۴۰۵/۰۶/۰۳ (2026-08-25)
**نوع:** ممیزی و گزارش (Audit-only) — هیچ کدی تغییر نکرده؛ تنها همین فایل نوشته شده است.
**دامنه:** پنل ادمین (`src/app/admin/**` + `src/components/admin/**`) و بخش فروشگاه (`src/app/(shop)/**` + `src/components/**` به‌جز ادمین).
**روش:** بررسی مستقیم کد با ارجاع به فایل و شماره خط — بدون ادعای کلی.
**هدف:** یکپارچگی با **بهترین الگوهای موجودِ خودِ پروژه** — نه بازطراحی.

> **نکته درباره‌ی مهارت‌های طراحی:** پلاگین‌های اختصاصیِ `design:design-system` / `design:design-critique` / `design:ux-copy` در این محیط در دسترس نبودند؛ بنابراین ممیزی صرفاً بر پایه‌ی کد و الگوهای داخلی پروژه انجام شده است.

> **معیار شدت:** `cosmetic` (ظاهری/جزئی) · `moderate` (متوسط، تجربه یا نگهداشت را آسیب می‌زند) · `structural` (ساختاری، منبعِ تکرارِ گسترده یا ناسازگاریِ سیستمی).

---

## ۱) یکپارچگی سیستم طراحی (Design System Consistency)

سیستم توکن رنگ و تایپوگرافی به‌خوبی در `src/app/globals.css:14-27` تعریف شده (توکن‌های برند: `midnight #081F37`، `sky-breeze #5FC9F3`، `ocean #2E79BA` = اکسنت اصلی، `royal #1E549F` = hover، `frost`, `steel #0A1424`, `ice-white #FCFEFF`). مشکل اصلی این محور، **دور زدنِ همین سیستم موجود** است.

### 🟠 DS1 — استفاده از هگزِ خام به‌جای توکنِ تعریف‌شده (moderate)
- **ناسازگاری:** رنگ‌هایی که دقیقاً توکن معادل دارند، به‌صورت هگزِ خام نوشته شده‌اند:
  - `src/components/cart/CartDrawer.tsx:179` → `bg-midnight hover:bg-[#0c2440]` (پایه با توکن، ولی hover هگزِ خام).
  - `src/components/ui/LoadingSpinner.tsx:10` → `bg-[#FCFEFF]/35` که همان `bg-ice-white/35` است.
  - `src/app/(shop)/page.tsx:160,230,591,600,609,644` → `[#0A1424]` (=`steel`)، `[#081F37]` (=`midnight`)، `[#1E549F]` (=`royal`) و نیز `[#102A43]`/`[#334E68]` (بدون توکن).
- **الگوی خوبِ موجود:** همان کلاس‌های توکن‌دار (`bg-midnight`, `text-ocean`, `bg-steel`) که در بیشتر کامپوننت‌ها به‌درستی به کار رفته‌اند.
- **شدت:** moderate — جایی که هگز با توکنِ موجود برابر است، باید توکن جایگزین شود؛ برای `[#102A43]`/`[#334E68]` یا توکن جدید تعریف شود یا به نزدیک‌ترین توکن نگاشت شود.

### 🟠 DS2 — رنگِ اکسنتِ ناوبری: `blue-600` خام به‌جای برندِ `ocean` (moderate)
- **ناسازگاری:** `src/components/layout/DesktopNav.tsx:38,47,55,63,71,79,90` از `hover:text-blue-600` (آبیِ خامِ Tailwind) استفاده می‌کند، در حالی‌که اکسنت برند `ocean` است. همین را `src/components/layout/MobileMenu.tsx:104,111` **درست** انجام داده: `hover:text-ocean` / `hover:text-midnight`. فرم‌های ادمین هم `focus:border-blue-600` دارند (نمونه در DS5).
- **الگوی خوبِ موجود:** `MobileMenu.tsx` (توکن برند در همان سیستم ناوبری).
- **شدت:** moderate — دو نیمه‌ی یک سیستم ناوبری با دو پالت متفاوت.

### 🔴 DS3 — نبودِ کامپوننت مشترک Badge؛ دست‌کم سه پیاده‌سازیِ واگرا (structural)
- **ناسازگاری:** «برچسب وضعیت» با سه سبکِ متفاوت و بدون هیچ کامپوننت مشترکی تکرار شده:
  - **سبک config-object (خوب):** `src/app/admin/dashboard/orders/OrdersClient.tsx:45-56`، `src/app/admin/dashboard/admins/AdminsClient.tsx:42-47` (`roleConfigs`)، `src/app/admin/dashboard/errors/ErrorsView.tsx:39-42` (`severityConfig`).
  - **سبک تابعِ getColor:** `src/app/admin/dashboard/blog/comments/CommentsTable.tsx:27-33`، `src/app/admin/dashboard/reviews/ReviewsTable.tsx:27-33`، `src/app/admin/dashboard/blog/page.tsx:32-38` (سه پیاده‌سازیِ تقریباً یکسان).
  - **سبک ternary درون‌خطی:** `src/app/admin/dashboard/products/ProductsTableClient.tsx:310-312` (برچسب موجودی سبز/نارنجی/قرمز).
- **الگوی خوبِ موجود:** سبک config-object (`roleConfigs`/`severityConfig`) — باید یک `<StatusBadge status>`/`<Badge variant>` مشترک استخراج شود.
- **شدت:** structural — منبعِ تکرار در بیش از ۱۲ فایل.

### 🔴 DS4 — یک مجموعه‌ی «وضعیت سفارش»، با رنگ‌های متفاوت در ۵ نما (structural) — یافته‌ی شاخص
- **ناسازگاری:** نگاشتِ رنگِ وضعیت‌های یکسانِ سفارش در پنج جا بازتعریف شده و با هم نمی‌خوانند:

  | فایل | سبک | نمونه تعارض |
  |---|---|---|
  | `admin/.../orders/OrdersClient.tsx:45-56` | `-50/-700` + border | `PAID`=emerald، `PROCESSING`=indigo، `SHIPPED`=purple |
  | `admin/.../orders/[id]/OrderDetailClient.tsx:28-39` | `-100/-800`، بدون border | `PAID`=blue، `PROCESSING`=indigo |
  | `admin/.../users/[id]/CustomerProfileView.tsx:89-94` | `-100/-700` | `PAID`=blue، `PROCESSING`=purple |
  | `(shop)/profile/orders/page.tsx:29-34` | `-100/-700` + آیکون | `PROCESSING`=purple، `SHIPPED`=indigo |
  | `(shop)/profile/orders/[id]/page.tsx:41-46` | `-100/-700` + آیکون | **یکسان با فهرست فروشگاه ✓** |

- **تعارض‌های عینی:** `PROCESSING` در فروشگاه **بنفش** ولی در ادمین **نیلی (indigo)**؛ `SHIPPED` در فروشگاه **نیلی** ولی در ادمین **بنفش**؛ `PAID` در `OrdersClient` **زمرد (emerald)** ولی در همه‌جای دیگر **آبی**.
- **الگوی خوبِ موجود:** دو نگاشتِ سمتِ فروشگاه **با هم سازگارند**، آیکون دارند و از `-100/-700` استفاده می‌کنند → همین را به یک منبعِ واحدِ مشترک (مثلاً `src/lib/order-status.ts`) تبدیل کنید و هم ادمین هم فروشگاه از آن مصرف کنند.
- **شدت:** structural — یک مفهومِ واحد با پنج حقیقتِ متفاوت.

### 🟠 DS5 — تکرارِ استایلِ اینپوت (~۱۳ بار) به‌جای کامپوننت مشترک (moderate)
- **ناسازگاری:** در `src/app/admin/dashboard/settings/SettingsClient.tsx:197,209,224,247,285,297,309,323,335,348,375,387,403` یک رشته‌ی کلاسِ یکسان کپی‌ شده: `w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 ... focus:border-blue-600 focus:bg-white ...`. ضمناً `focus:border-blue-600` غیربرند است (باید `ocean`).
- **الگوی خوبِ موجود:** استخراج یک `<TextInput>`/کلاسِ مشترک؛ هم‌راستا کردن رنگِ focus با `ocean`.
- **شدت:** moderate — نگهداشت + رنگِ غیربرند.

### 🟠 DS6 — دیالوگ تأیید: کامپوننت مشترک وجود دارد و ۸ بار استفاده شده، اما ۴ جریان مودالِ دستی می‌سازند (moderate→structural)
- **ناسازگاری:** `src/components/admin/ConfirmDialog.tsx` استانداردِ عملیِ حذف است و در ۸ جا مصرف می‌شود (`ErrorsView`, `OrderDetailClient`, `DeleteOfferButton`, `EditPostForm`, `BannersListClient`, `DeletePostButton`, `CommentActions`, `SlidesListClient`). اما این چهار جریان مودالِ قرمزِ تقریباً یکسان را **دستی** بازسازی کرده‌اند:
  - `src/components/.../DeleteProductButton.tsx:64,88`
  - `src/components/.../DeleteCategoryButton.tsx:63,87`
  - `src/components/.../DeleteSubcategoryButton.tsx:54,78`
  - `src/app/admin/dashboard/products/[id]/edit/VariantManager.tsx:499,523`
- **الگوی خوبِ موجود:** `ConfirmDialog` (که هم‌اکنون اکثریت است و حتی حین اجرای اکشن، بستن با Escape را می‌بندد).
- **شدت:** moderate→structural — استانداردْ موجود است؛ صرفاً چند فایل عقب مانده‌اند.

### 🟠 DS7 — دیالوگِ نیتیوِ مرورگر به‌جای سیستمِ مودالِ خودِ پروژه (moderate)
- **ناسازگاری:** `src/components/.../BlogEditor.tsx:127` از `window.prompt(...)` برای دریافت ورودی استفاده می‌کند — یک دیالوگِ بی‌استایل و انگلیسیِ مرورگر که با سیستم مودالِ فارسیِ پروژه ناهمخوان است. (نکته‌ی مثبت: `window.confirm` در کل پروژه حذف و به `ConfirmDialog` مهاجرت شده؛ تنها `window.prompt` باقی مانده.)
- **الگوی خوبِ موجود:** مودال‌های داخلی پروژه.
- **شدت:** moderate.

### 🔵 DS8 — اکسنتِ اکشنِ ادمین (نارنجی) در برابر اکسنتِ فروشگاه (ocean) — احتمالاً عمدی
- **ناسازگاری:** دکمه‌ی اصلی فروشگاه `src/components/cart/AddToCartButton.tsx:85,112` از `bg-ocean hover:bg-royal` (کانونیک) استفاده می‌کند، اما اکشن‌های اصلیِ ادمین نارنجی‌اند (`src/app/admin/dashboard/products/[id]/page.tsx:57` → `bg-orange-500 hover:bg-orange-600`). چون نارنجی/کهربایی در چند نقطه‌ی ادمین (لینک «پنل مدیریت»، «خرید اقساطی») تکرار شده، **احتمالاً یک تفکیکِ عمدیِ پالتِ ادمین/فروشگاه است**.
- **شدت:** cosmetic — **نامشخص، نیازمند تأیید.** اگر عمدی است، بهتر است به‌صورت یک توکنِ رسمیِ «اکسنتِ ادمین» درآید تا نارنجی‌ها هم یکدست شوند (اکنون در کنارش `blue-600` و `slate` هم دیده می‌شود).

---

## ۲) معماری اطلاعات (Information Architecture)

### 🔴 IA1 — سایدبار ادمین یک فهرستِ تختِ ۱۴ آیتمی بدون گروه‌بندی است (structural)
- **ناسازگاری:** `src/components/admin/Sidebar.tsx:29-44` تمام ۱۴ آیتم را بدون هیچ سرفصل یا گروهی پشت‌سرهم می‌چیند. پیمایش بصری و یافتنِ سریعِ بخش‌ها دشوار می‌شود.
- **الگوی خوبِ موجود (داخلِ خودِ پروژه):** `src/components/layout/MobileMenu.tsx:87-89,147-149` لینک‌ها را زیر سرفصل‌های برچسب‌دارِ `<h4>` گروه‌بندی می‌کند («دسته‌بندی محصولات» / «لینک‌های عمومی»). همین الگوی سرفصل‌دار را می‌توان به سایدبار ادمین آورد (مثلاً گروه‌های محتوا / فروش / پیکربندی / سیستم).
- **ارتباط با نکته‌ی مستثناشده:** تاپ‌لِوِل بودنِ «نظرات محصولات» در برابر تودرتو بودنِ «نظرات بلاگ» (که خودتان اشاره کردید) دقیقاً **نمونه‌ای از همین نبودِ گروه‌بندی** است؛ با گروه‌بندیِ دامنه‌محور، جای این دو به‌طور طبیعی روشن می‌شود. (اینجا فقط به‌عنوان انگیزه‌ی گروه‌بندی ارجاع داده شد، نه یافته‌ی مستقل.)
- **شدت:** structural.

### 🟠 IA2 — ترتیبِ سایدبار، اقلامِ عملیاتی و پیکربندی را در هم می‌آمیزد (moderate)
- **ناسازگاری:** در `src/components/admin/Sidebar.tsx:37-41`، «ظاهر» و «تنظیمات عمومی» **بالاتر از** «کاربران»، «سفارشات» و «پشتیبانی آنلاین» قرار گرفته‌اند. بخش‌های روزمره و عملیاتی (سفارش/کاربر/پشتیبانی) زیرِ تنظیماتِ کم‌مصرف افتاده‌اند.
- **الگوی خوبِ موجود:** قرار دادنِ اقلامِ پرمصرفِ عملیاتی در بالا و پیکربندی در پایین (یا در گروهِ جدا طبق IA1).
- **شدت:** moderate.

### 🟠 IA3 — ناوبریِ دسکتاپ و موبایلِ فروشگاه، دو تاکسونومیِ متفاوت نشان می‌دهند (moderate→structural)
- **ناسازگاری:** کاربری که بین دسکتاپ و موبایل جابه‌جا می‌شود، مجموعه‌ی متفاوتی از گزینه‌های سطح‌اول می‌بیند:
  - `src/components/layout/DesktopNav.tsx:34-94`: میان‌بُرهای دسته (بستنی‌ساز/یخ‌ساز/فریزر) + «خرید سازمانی» + «گارانتی و خدمات» + «تماس با ما». **بدونِ** بلاگ/درباره‌ما.
  - `src/components/layout/MobileMenu.tsx:147-218`: دسته‌های پویا از دیتابیس + «صفحه اصلی» + «بلاگ تخصصی» + «درباره ما» + «تماس با ما». **بدونِ** «خرید سازمانی»/«گارانتی».
- **الگوی خوبِ موجود:** یک مجموعه‌ی کانونیکِ واحد برای ناوبریِ اصلی که هر دو نما از آن مشتق شوند.
- **شدت:** moderate→structural.

---

## ۳) متن و لحن (UX Copy)

### 🟡 UX1 — یک واژه، دو املا: «بروزرسانی» در برابر «به‌روزرسانی» (cosmetic→moderate)
- **ناسازگاری:** هر دو املای «update» در پروژه به کار رفته — حتی **درونِ یک فایل**: `src/app/admin/dashboard/DashboardView.tsx:60` («بروزرسانی یادداشت سفارش») در برابر `:269` («به‌روزرسانی»). موارد «بروزرسانی» (بدون نیم‌فاصله): `src/context/CartContext.tsx:260`, `src/app/(shop)/profile/edit/page.tsx:68,72`, `.../reviews/ReviewActions.tsx:31`, `.../support/SupportClient.tsx:184`, `.../offers/[id]/edit/EditOfferClient.tsx:236,240`, `.../VariantManager.tsx:120`, `.../products/[id]/page.tsx:161`.
- **الگوی خوبِ موجود:** یک املا را انتخاب کنید (املای استاندارد «به‌روزرسانی» با نیم‌فاصله است، اما یکدستی مهم‌تر از انتخاب است).
- **شدت:** cosmetic→moderate (حرفه‌ای بودنِ متن).

### 🟡 UX2 — پیام‌های خطای عمومی، عبارت‌های گوناگون دارند (cosmetic→moderate)
- **ناسازگاری:** برای یک مفهوم (خطای نامشخص) چند عبارت:
  - «خطایی رخ داد.» → `ProductsTableClient.tsx:161`, `AdminsClient.tsx:110`, `OrdersClient.tsx:126`
  - «مشکلی پیش آمد» → `(shop)/auth/page.tsx:86`, `AuthModal.tsx:104`
  - «خطایی رخ داده است» → `src/app/error.tsx:26`
  - «خطا در بارگذاری صفحه» → `src/app/(shop)/error.tsx:25`
  - «خطا در بروزرسانی» → `CartContext.tsx:260`
- **الگوی خوبِ موجود:** یک مجموعه‌ی کوچکِ کانونیک از پیام‌ها (ترجیحاً در یک فایلِ ثابت مشترک) و استفاده از همان‌ها.
- **شدت:** cosmetic→moderate.

### 🟡 UX3 — آمیختنِ اصطلاح‌های حالتِ خالی (cosmetic)
- **ناسازگاری:** الگوی غالب و **سازگارِ** «... یافت نشد» به‌درستی همه‌جا هست (نقطه‌ی قوت)، اما در کنارش «هنوز ... نکرده‌اید» (فروشگاه، `(shop)/profile/orders`) و حتی استفاده از متنِ بارگذاری به‌جای حالتِ خالی در `src/components/layout/MobileMenu.tsx:91` («در حال بارگذاری...») دیده می‌شود.
- **الگوی خوبِ موجود:** همان «... یافت نشد» غالب.
- **شدت:** cosmetic.

> **نکته‌ی مثبت:** واژگانِ کنش‌ها عمدتاً یکدست است — «ذخیره تغییرات» به‌طور سازگار در `profile/edit/page.tsx:177`, `SettingsClient.tsx:129`, `EditOfferClient.tsx:593`, `VariantManager.tsx:438` و «انصراف» برای لغو به کار رفته‌اند.

---

## ۴) واکنش‌گرایی و دسترسی‌پذیری (سطحِ کد)

> این محور فقط از روی کد بررسی شده؛ تأییدِ نهاییِ برخی موارد (تله‌ی فوکوس، ترتیبِ تبِ صفحه‌خوان) نیازمند آزمونِ مرورگری است و در جای خود علامت خورده.

### 🟠 A11Y1 — هیچ مودالی `role="dialog"`/`aria-modal` ندارد (moderate)
- **ناسازگاری:** جست‌وجوی کل پروژه برای `role="dialog"` و `aria-modal` **هیچ نتیجه‌ای** ندارد. یعنی `ConfirmDialog`, `AuthModal`, `InstallmentModal`, `MediaGalleryModal`، مودال‌های `VariantManager` و مودال‌های حذفِ دستی، هیچ‌کدام معنایِ «دیالوگ» را به صفحه‌خوان اعلام نمی‌کنند.
- **الگوی خوبِ موجود:** الگوی داخلی وجود ندارد؛ توصیه: ابتدا به کامپوننتِ پرمصرفِ `src/components/admin/ConfirmDialog.tsx` سه ویژگیِ `role="dialog"` + `aria-modal="true"` + تله‌ی فوکوس افزوده شود، سپس بازاستفاده گردد.
- **شدت:** moderate.

### 🟠 A11Y2 — مدیریتِ Escape ناسازگار است (moderate)
- **ناسازگاری:** `src/components/auth/AuthModal.tsx:77-85` و `src/components/admin/ConfirmDialog.tsx:45-49` و `src/app/admin/dashboard/DashboardView.tsx:127` بستن با Escape را دارند (خوب)؛ اما مودال‌های `InstallmentModal`/`MediaGalleryModal` و مودال‌های حذفِ دستیِ DS6 چنین مدیریتی ندارند.
- **الگوی خوبِ موجود:** `ConfirmDialog` (که حتی حین اجرای اکشن، بستنِ ناخواسته را مهار می‌کند — جزئیاتِ خوب).
- **شدت:** moderate.

### 🟠 A11Y3 — دکمه‌های فقط-آیکونِ ادمین بدونِ `aria-label`؛ فروشگاه به‌خوبی برچسب دارد (moderate)
- **ناسازگاری:** تمام `aria-label`های موجود در بخشِ فروشگاه/لِی‌اوت‌اند: `Header.tsx:214,317,364` (سبد/منو)، `Footer.tsx:107,112` (شبکه‌های اجتماعی)، `SearchBar.tsx:211,225`, `MobileMenu.tsx:79,112`, `MobileSearchOverlay.tsx:41`, `OfferCarousel.tsx:267,275,383,392`, `CategoriesClient.tsx:365,373`, `ConfirmDialog.tsx:86`. اما دکمه‌های آیکونیِ ردیف‌های جدولِ ادمین (ویرایش/حذف/مشاهده در `ProductsTableClient`, `OrdersClient`, `ReviewsTable`, `CommentsTable`, `UsersTable` و…) هیچ `aria-label` ندارند.
- **الگوی خوبِ موجود:** `Header.tsx:214` (`aria-label="سبد خرید"`) و `ConfirmDialog.tsx:86` (`aria-label="بستن"`).
- **شدت:** moderate.

### 🟠 A11Y4 — عنصرِ کلیک‌پذیرِ `<div onClick>` به‌جای `<button>` (moderate)
- **ناسازگاری:** `src/app/admin/dashboard/errors/ErrorsView.tsx:224,231,241,248,255` (کارت‌های فیلترِ شدت) و `src/app/admin/dashboard/DashboardView.tsx:506-567` عناصرِ تعاملی را روی `<div onClick>` سوار کرده‌اند که با کیبورد قابل فوکوس/فعال‌سازی نیست. (کلیکِ backdropِ مودال‌ها بی‌خطر است و یافته نیست.)
- **الگوی خوبِ موجود:** استفاده از `<button>` مثل اکثرِ نقاطِ پروژه.
- **شدت:** moderate.

### 🟠 RESP1 — بیشترِ مسیرهای ادمین فاقدِ `loading.tsx`اند؛ فروشگاه دارد (moderate)
- **ناسازگاری:** فروشگاه در بیشتر مسیرها `loading.tsx` دارد: `(shop)/loading`, `(shop)/categories/loading`, `(shop)/products/[slug]/loading`, `(shop)/blog/loading`, `(shop)/categories/[slug]/loading`, `(shop)/blog/[slug]/loading`. اما ادمین فقط `admin/dashboard/loading.tsx` و `admin/dashboard/orders/[id]/loading.tsx` دارد؛ باقیِ مسیرهای ادمین یا به fallbackِ درون‌خطیِ Suspense تکیه دارند (نمونه‌ی خوب: `products/[id]/page.tsx:176`) یا هیچ.
- **الگوی خوبِ موجود:** یا `loading.tsx`های سمتِ فروشگاه، یا همان الگوی Suspense-fallbackِ درون‌خطیِ ادمین — اما **یکدست**.
- **شدت:** moderate — **ممکن است تا حدی عمدی باشد** (صفحاتِ سرورِ ادمین با Suspense)؛ صرفاً یکدستیِ حسِ‌سرعت پیشنهاد می‌شود.

### 🔵 RESP2 — سه `<img>` خام (به‌جای `next/image`) — احتمالاً موجه
- **بررسی:** تنها سه `<img>` خام وجود دارد: `src/components/admin/MultiImageUpload.tsx:182,208` و `src/components/admin/ImageUpload.tsx:130` — همگی **پیش‌نمایشِ محلیِ فایلِ تازه‌آپلودشده** (Object/Blob URL) هستند که `next/image` برایشان کاربرد ندارد. پذیرفتنی و **احتمالاً درست**. (نقطه‌ی مثبت: پذیرشِ تقریباً سراسریِ `next/image` در بقیه‌ی پروژه.)
- **شدت:** cosmetic/none — فقط برای اطلاع که بررسی شد.

---

## نقاط قوتِ تأییدشده (برای تعادلِ گزارش)

- سیستم توکنِ رنگ/تایپوگرافیِ منسجم در `src/app/globals.css` (مشکل، دور زدنِ آن است نه نبودش).
- مهاجرتِ کاملِ `window.confirm` به `ConfirmDialog` (تنها یک کامنت باقی مانده).
- پذیرشِ تقریباً سراسریِ `next/image`.
- یکدستیِ حالتِ خالیِ «... یافت نشد» و واژگانِ کنشِ «ذخیره تغییرات»/«انصراف».
- `MobileMenu.tsx` به‌عنوان الگوی مرجعِ داخلی: گروه‌بندیِ سرفصل‌دار + توکنِ برند + هدفِ لمسیِ `min-h-[48px]` + `aria-label`.
- نگاشتِ وضعیتِ سفارشِ سمتِ فروشگاه (با آیکون و سازگار با خودش) که می‌تواند منبعِ واحدِ DS4 شود.

---

## جمع‌بندیِ اولویت‌دار

| # | یافته | محور | شدت |
|---|-------|------|------|
| DS4 | یک مجموعه وضعیت سفارش با ۵ نگاشتِ رنگِ متفاوت | Design System | **structural** |
| DS3 | نبودِ Badge مشترک؛ ۳ پیاده‌سازیِ واگرا | Design System | **structural** |
| IA1 | سایدبار ادمینِ تختِ ۱۴ آیتمی بدون گروه‌بندی | Information Arch. | **structural** |
| DS6 | مودالِ حذفِ دستی به‌جای `ConfirmDialog`ِ موجود (۴ فایل) | Design System | moderate→struct. |
| IA3 | تاکسونومیِ متفاوتِ ناوبریِ دسکتاپ/موبایل | Information Arch. | moderate→struct. |
| DS1 | هگزِ خام به‌جای توکن | Design System | moderate |
| DS2 | `blue-600` خام به‌جای برندِ `ocean` در ناوبری | Design System | moderate |
| DS5 | تکرارِ ~۱۳ باره‌ی استایلِ اینپوت | Design System | moderate |
| DS7 | `window.prompt` نیتیو در `BlogEditor` | Design System | moderate |
| IA2 | ترتیبِ سایدبار: عملیاتی زیرِ پیکربندی | Information Arch. | moderate |
| A11Y1 | نبودِ `role="dialog"`/`aria-modal` در همه‌ی مودال‌ها | Access. (admin+shop) | moderate |
| A11Y2 | مدیریتِ Escape ناسازگار | Access. (admin+shop) | moderate |
| A11Y3 | دکمه‌های آیکونیِ ادمین بدونِ `aria-label` | Access. (admin) | moderate |
| A11Y4 | `<div onClick>` به‌جای `<button>` | Access. (admin) | moderate |
| RESP1 | نبودِ `loading.tsx` در بیشترِ مسیرهای ادمین | Responsiveness | moderate |
| UX1 | «بروزرسانی» vs «به‌روزرسانی» | UX Copy | cosmetic→moderate |
| UX2 | عبارت‌های گوناگونِ خطای عمومی | UX Copy | cosmetic→moderate |
| UX3 | آمیختنِ اصطلاح‌های حالتِ خالی | UX Copy | cosmetic |
| DS8 | نارنجیِ ادمین vs `ocean`ِ فروشگاه (احتمالاً عمدی) | Design System | cosmetic (نامشخص) |
| RESP2 | ۳ `<img>` خام (پیش‌نمایشِ آپلود — احتمالاً موجه) | Responsiveness | cosmetic/none |

**ترتیبِ پیشنهادیِ رفع:** DS4 → DS3 → IA1 → DS6 → IA3 → (DS1/DS2/DS5) → A11Y1..4 → بقیه.

**مواردِ نیازمندِ تصمیمِ شما (نامشخص که عمدی است یا نه):** DS8 (پالتِ اکسنتِ ادمین)، RESP1 (سیاستِ `loading.tsx` ادمین در برابر Suspense درون‌خطی)، RESP2 (که بررسی شد و به‌احتمال زیاد درست است).

---

# Independent Review — Added by Claude (ox-alpha)

**تاریخ:** 2026-08-25 · **نوع:** ممیزیِ مستقلِ دوم (فقط‌خواندنی) · **روش:** بازخوانیِ کاملِ گزارشِ بالا + بررسیِ مستقیمِ کد با شمارش‌های واقعی (grep/count) روی همان دامنه. هیچ کدی تغییر نکرده؛ فقط همین بخش به انتهای فایل اضافه شده است.
**هدف:** یافته‌هایی که در گزارشِ بالا **نیامده**، به‌همراه چند تکمیل/تأیید بر یافته‌های موجود. از تکرارِ مواردِ پوشش‌داده‌شده پرهیز شده است.

> **نکته‌ی مثبتی که گزارشِ بالا ذکر نکرده:** قابلیتِ مشاهده‌ی فوکوسِ کیبورد از همین حالا سراسری و برنددار است — `src/app/globals.css:30-33` یک `*:focus-visible { outline: 2px solid var(--color-ocean) }` سراسری دارد (WCAG 2.4.7). بنابراین شکافِ دسترسی‌پذیریِ پروژه در «دیدِ فوکوس» نیست؛ در معناشناسی/برچسب است (همان‌طور که A11Y1/A11Y3 درست گفته‌اند).

## یافته‌های جدید (پوشش‌داده‌نشده در گزارشِ بالا)

### 🟠 NEW-1 (DS9) — کلاسِ `dir-ltr` مرده است؛ هیچ‌جا تعریف نشده (moderate)
- **مشکل:** کلاسِ `dir-ltr` در ۸ نقطه برای راست‌به‌چپ‌نبودنِ ورودی‌های شماره/تلفن استفاده شده اما **در هیچ‌جایی تعریف ندارد**: `src/app/globals.css` هیچ قاعده یا `@utility` با این نام ندارد (بررسی شد؛ صفر نتیجه)، فایلِ `tailwind.config.*` هم وجود ندارد، و این الگوی معتبرِ Tailwind نیست.
- **موارد مصرف:** `(shop)/auth/page.tsx:191,217` (ورودی موبایل!)، `(shop)/checkout/page.tsx:203,529,642`، `(shop)/contact/page.tsx:128`، `CategoryClient.tsx:672`، `AnalyticsDashboard.tsx:514`.
- **پیامد:** ورودی‌های شماره‌تلفن عملاً RTL می‌مانند و متن/نقطه‌گذاری داخلشان جابه‌جا دیده می‌شود.
- **رفعِ پیشنهادی:** افزودن یک utility واقعی (مثلاً در globals.css: `.dir-ltr { direction: ltr; text-align: left; }`) یا جایگزینی با `dir="ltr"` روی خودِ عنصر.
- **شدت:** moderate.

### 🟠 NEW-2 (A11Y5) — قفلِ اسکرولِ پس‌زمینه فقط در برخی مودال‌ها هست (moderate)
- **مصرف‌کنندگانِ درست:** `src/components/auth/AuthModal.tsx:82-86`، `MobileCategoriesPanel.tsx:36-43`، `MobileSearchOverlay.tsx:16-21`.
- **بدونِ قفل:** `src/components/admin/ConfirmDialog.tsx` (استانداردِ ۸گانه)، `src/components/modals/InstallmentModal.tsx`، `MediaGalleryModal`، مودال‌های حذفِ دستی (DS6) و مودال‌های `VariantManager` — با باز بودنِ مودال، صفحه‌ی زیرین اسکرول می‌شود.
- **الگوی خوبِ موجود:** همان سه فایلِ اول (الگوی effect-based روی `document.body.style.overflow`).
- **شدت:** moderate.

### 🟠 NEW-3 (IA4) — دکمه/لینکِ «بازگشت» در صفحاتِ جزئیاتِ ادمین یکدست نیست (moderate)
- **دارایِ بازگشتِ صریح:** `blog/comments/page.tsx` (ArrowLeft در هدر)، فرم‌های ایجاد/ویرایش (`NewPostForm.tsx:149`، `EditPostForm.tsx:176`، `CategoryForm.tsx:73`، `EditCategoryForm.tsx:86`، `SubcategoryForm.tsx:84`، `BannersListClient.tsx:111`، `SlidesListClient.tsx:106`).
- **فاقدِ بازگشت:** `admin/dashboard/reviews/page.tsx` (صفر تطابق)، `admin/dashboard/orders/[id]/page.tsx`، `admin/dashboard/users/[id]/page.tsx` — کاربر فقط از طریق سایدبار برمی‌گردد.
- **الگوی خوبِ موجود:** همان الگوی ArrowLeft+لینکِ والدِ `blog/comments/page.tsx:42-46`.
- **شدت:** moderate.

### 🟡 NEW-4 (IA5) — عنوانِ تبِ مرورگر در ادمین تقریباً همیشه ثابت است (cosmetic→moderate)
- **مشکل:** از ~۳۵ فایلِ `page.tsx` ادمین فقط ۲ مورد `export const metadata` دارند (`settings/page.tsx`، `support/page.tsx`). سمتِ فروشگاه ۸ صفحه متادیتا دارد. نتیجه: همه‌ی تب‌های ادمین عنوانِ عمومیِ ریشه را نشان می‌دهند و بین تب‌ها قابل تفکیک نیستند.
- **الگوی خوبِ موجود:** همان دو صفحه‌ی مذکور + الگوی `generateMetadata` سمتِ فروشگاه.
- **شدت:** cosmetic→moderate.

### 🟡 NEW-5 (LOAD1) — سه نوع نشانگرِ «در حال بارگذاری» رقابت می‌کنند (cosmetic)
- `<LoadingSpinner>` مشترک فقط **۳** بار مصرف شده؛ در مقابل `Loader2`/`animate-spin` درون‌خطی **۹۷** بار در کل پروژه. نتیجه: اندازه/رنگ/رفتارِ اسپینر از صفحه‌ای به صفحه‌ی دیگر فرق می‌کند.
- **الگوی خوبِ موجود:** خودِ `src/components/ui/LoadingSpinner.tsx` — باید یا همه‌جا مصرف شود یا رسماً بازنشسته شود.
- **شدت:** cosmetic.

### 🔵 NEW-6 (A11Y6) — هدفِ لمسیِ دکمه‌های آیکونیِ جدول‌های ادمین کوچک است (cosmetic→moderate)
- نمونه‌ها: `ReviewsTable.tsx:159` و مشابه در `ProductsTableClient/OrdersClient/UsersTable`: `p-2` + آیکون `w-4` ⇒ حدود ۳۲px.
- **الگوی خوبِ داخلی:** `MobileMenu.tsx:100,155,169` (`min-h-[48px]`) که گزارشِ بالا هم آن را الگو دانسته — اما فقط برای موبایلِ فروشگاه؛ جدول‌های ادمین (که روی تبلت/لمسی هم استفاده می‌شوند) زیرِ حداقلِ ۴۴–۴۸px هستند. (A11Y3 فقط «برچسب» را پوشش داده؛ «اندازه» جدید است.)
- **شدت:** cosmetic→moderate.

### 🔵 NEW-7 (DS10) — مقیاسِ گوشه‌ها (radius) بدونِ قانون است (cosmetic)
- شمارشِ واقعی در کل `src`: `rounded-xl`×۴۷۷، `rounded-lg`×۲۹۷، `rounded-2xl`×۲۵۶، `rounded-full`×۲۲۲، `rounded-3xl`×۳۹، `rounded-[…]`×۶. یک «کارت» گاهی `rounded-xl` است و گاهی `rounded-2xl` و در هیرو `md:rounded-[24px]` (`HeroCarousel.tsx:36`).
- **پیشنهاد:** تعریفِ سه نقشِ معنایی (input=lg، card=2xl، pill=full) در توکن/کامپوننت؛ نه تغییرِ انبوهِ کلاس‌ها.
- **شدت:** cosmetic.

### 🔵 NEW-8 (DS11) — نردبانِ z-index بی‌سند است (cosmetic)
- شمارش: `z-10`×۳۶، `z-20`×۷، `z-40`×۶ (از جمله Header/Sidebar ادمین)، `z-50`×۳۱ (مودال‌ها). امروز تداخلی ندیدم، ولی نبودِ قرارداد (مثلاً sticky=30، dropdown=40، overlay=50) ریسکِ پوشیده‌شدنِ dropdown توسط هدرهای چسبان را در آینده بالا می‌برد. صرفاً ثبتِ قرارداد، نه بازسازی.
- **شدت:** cosmetic.

## تکمیل / اختلافِ نظر با گزارشِ فعلی

- **DS5 (تشدید + اصلاحِ مسیرِ رفع):** علاوه بر تکرارِ ~۱۳باره در `SettingsClient.tsx` (الان هم ۱۳ موردِ `focus:border-blue-600` باقی است — شمارش شد)، پروژه از قبل یک استانداردِ نیمه‌پذیرفته دارد: `src/lib/form-classes.ts` با `fieldClass(base, hasError)` که در **۱۸ فایل** مصرف شده. پس (الف) شدت را به‌سوی structural ارتقا می‌دهم چون حتی استانداردِ موجودِ خودِ پروژه دور زده شده، و (ب) رفع باید بر پایه‌ی همین `form-classes` باشد نه ساختِ سیستمِ سوم.
- **DS8 (تأییدِ فرضیه):** با احتمالِ عمدی بودنِ تفکیکِ پالت موافقم؛ نارنجیِ اکشن در چند نقطه‌ی ادمین تکرار شده و پیشنهادِ تبدیلِ آن به توکنِ رسمی («اکسنتِ ادمین») درست است.
- **RESP2 (تأیید):** بررسی مجدد انجام شد؛ هر سه `<img>` خام پیش‌نمایشِ Object-URL هستند و `next/image` برایشان مناسب نیست. تأیید می‌شود.
- **UX3 (تذکرِ جزئی):** موردِ «در حال بارگذاری…» در `MobileMenu.tsx:91` وضعیتِ **بارگذاری** است نه حالتِ خالی؛ ترکیب‌بندیِ مثال کمی نامنصفانه است، هرچند نتیجه‌ی کلی (یکدست‌سازی) درست است.
- **A11Y3 (تکمیل):** فهرستِ فروشگاه کامل بود؛ تنها افزودنی اینکه دکمه‌های آیکونیِ `ReviewsTable.tsx` (صفحه‌ی تازه‌ساخته‌شده) هم در همان گروه قرار می‌گیرند.

## جمع‌بندیِ بخشِ مستقل

| # | یافته | محور | شدت |
|---|---|---|---|
| NEW-1 | `dir-ltr` کلاسِ مرده (۸ مصرف، صفر تعریف) | Design System | **moderate** |
| NEW-2 | قفلِ اسکرولِ مودال ناسازگار | Access. | moderate |
| NEW-3 | بازگشتِ صریح در صفحاتِ جزئیاتِ ادمین ناسازگار | Information Arch. | moderate |
| NEW-4 | عنوانِ تب در ادمین ثابت (۲ از ~۳۵) | Information Arch. | cosmetic→moderate |
| NEW-5 | سه نوع اسپینرِ موازی | Consistency | cosmetic |
| NEW-6 | هدفِ لمسیِ ~۳۲px در جدول‌های ادمین | Access. | cosmetic→moderate |
| NEW-7 | مقیاسِ radius بی‌قانون (۴۷۷/۲۹۷/۲۵۶/…) | Design System | cosmetic |
| NEW-8 | نردبانِ z-index بی‌سند | Design System | cosmetic |

**ترتیبِ پیشنهادیِ رفعِ بخشِ مستقل:** NEW-1 → NEW-2 → NEW-3 → NEW-6 → NEW-4 → بقیه (cosmetic).

**هیچ کدی در این ممیزی تغییر نکرد؛ فقط همین بخش به فایل اضافه شد.**
