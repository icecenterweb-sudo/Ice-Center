# گزارش فاز ۲ — استانداردسازی UI/UX

**پروژه:** Ice-Center
**تاریخ:** 2026-08-25
**مبنا:** `prompt.txt` (فازِ اجرا) + یافته‌های ممیزی‌شده در `UI_UX_AUDIT_REPORT.md`
**قانون:** بدونِ بازطراحیِ بصری — فقط یکدست‌سازی با الگوهای موجودِ خودِ پروژه

---

## ✅ نتیجه‌ی نهایی

| بررسی | نتیجه |
|---|---|
| `npx tsc --noEmit` | **EXIT 0** — بعد از هر ۴ تسک جداگانه اجرا شد |
| `npx eslint src tests` | **0 errors** · 4 warning (همه از قبل موجود) |
| `npm test` | **80 passed, 0 failed** |

---

## Task 1 — کامپوننت مشترک StatusBadge (رفع DS3)

**مشکل:** «برچسب وضعیت» حداقل ۳ سبکِ متفاوت داشت (config-object / تابع getColor / ternary درون‌خطی) بدون هیچ کامپوننت مشترکی.

**راه‌حل:** فایل جدید `src/components/ui/StatusBadge.tsx`
- استایلِ کانونیک عیناً از `OrdersClient.tsx` کپی شده: `inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border` + `bg-{tone}-50 text-{tone}-700 border-{tone}-100`
- پراپ‌ها: `label` · `tone` (۱۳ کلیدِ رنگی) · `icon?` (اختیاری، برای فروشگاه) · `className?` (escape hatch)
- ⚠️ نکته‌ی فنی مهم: کلاس‌های هر tone **به‌صورت literal** داخل map نوشته شده‌اند نه با interpolation (`bg-${tone}-50`) — وگرنه Tailwind آن‌ها را در build نمی‌گیرد.
- طبق دستورِ تسک، فقط کامپوننت ساخته شد؛ مهاجرتِ همه‌ی badgeهای پروژه خارج از scope بود.

---

## Task 2 — منبعِ واحدِ وضعیت سفارش (رفع DS4)

**مشکل:** همان enum سفارش در ۵ فایل جداگانه رنگ/برچسب داشت و با هم می‌جنگیدند:
- `PAID`: emerald در ادمین vs blue در بقیه
- `PROCESSING`: indigo در ادمین vs purple در فروشگاه
- `SHIPPED`: purple در ادمین vs indigo در فروشگاه

**راه‌حل:** فایل جدید `src/lib/order-status.ts`
- `ORDER_STATUS_META` برای **هر ۱۲ وضعیت** (label فارسی + tone متمایز + آیکون lucide)
- `getOrderStatusMeta(status)` برای lookup امن از رشته‌های آزاد
- پالتِ نهایی (هر status = یک رنگ، بدون تکرار hue):
  PENDING=yellow · AWAITING_CONFIRMATION=cyan · PAID=emerald · PROCESSING=indigo · PREPARING=blue · READY_FOR_DELIVERY=sky · SHIPPED=purple · HANDED_TO_CARRIER=violet · DELIVERED=green · RETURNED=rose · CANCELLED=red · NEEDS_CONTACT=orange

**۵ مصرف‌کننده مهاجرت داده شدند** (منطقِ فیلتر/انتقالِ وضعیت دست نخورد):
1. `src/app/admin/dashboard/orders/OrdersClient.tsx` — statusMap حذف؛ select/فیلتر/badge از META
2. `src/app/admin/dashboard/orders/[id]/OrderDetailClient.tsx` — statusOptions از META مشتق شد؛ هدر → StatusBadge؛ متنِ ConfirmDialog از META
3. `src/app/admin/dashboard/users/[id]/CustomerProfileView.tsx` — statusLabels حذف → META + StatusBadge
4. `src/app/(shop)/profile/orders/page.tsx` — statusConfig حذف → META + StatusBadge
5. `src/app/(shop)/profile/orders/[id]/page.tsx` — همانند بالا

---

## Task 3 — گروه‌بندی سایدبار ادمین (رفع IA1)

**مشکل:** ۱۴ آیتمِ تخت بدون سرفصل.

**راه‌حل:** در `src/components/admin/Sidebar.tsx`
- آرایه به ۵ گروه برچسب‌دار تبدیل شد:
  - **عملیات روزمره:** داشبورد، سفارشات، کاربران، پشتیبانی
  - **فروشگاه:** محصولات، نظرات محصولات، پیشنهادها، دسته‌بندی‌ها
  - **محتوا:** بلاگ
  - **بازاریابی و ظاهر:** ظاهر
  - **سیستم:** آنالیتیکس، تنظیمات، خطاها، مدیریت دسترسی‌ها
- استایلِ سرفصل از الگوی `MobileMenu.tsx` گرفته شد (`text-xs font-bold mb-2 px-2`) با تطبیقِ رنگ برای پس‌زمینه تیره (`text-slate-500`)
- ✅ فیلتر نقاط (`canAccessSection`) دقیقاً مثل قبل per-item اجرا می‌شود؛ گروهِ خالی اصلاً رندر نمی‌شود
- ✅ href/icon/section هیچ آیتمی تغییر نکرد
- ✅ رفتارِ collapse (حالتِ جمع‌شده سرفصل‌ها را مخفی می‌کند و فقط آیکون‌ها می‌مانند) و overlay موبایل دست‌نخورده
- 🎁 اصلاحِ جانبیِ همسو با IA2: ترتیبِ عملیاتی-first اعمال شد (سفارشات/کاربران بالاتر از تنظیمات)

---

## Task 4 — احیای کلاس مرده `dir-ltr` (رفع NEW-1)

**مشکل:** کلاس در چندین فرم (تلفن/کدپستی) استفاده شده بود ولی هیچ‌جا تعریف نداشت — ورودی‌ها عملاً LTR نمی‌شدند.

**راه‌حل:** تعریف واقعی در `src/app/globals.css` (کنار `.font-yekan`، مطابق سبکِ همان فایل):
```css
.dir-ltr {
  direction: ltr;
  text-align: left;
  unicode-bidi: isolate;
}
```
هیچ‌کدام از ۸ سایتِ مصرف‌کننده تغییر نکردند — حالا کلاسِ قبلاً اعمال‌شده واقعاً کار می‌کند.

---

## 📋 فهرست کامل فایل‌های تغییریافته

**جدید (۲):**
- `src/components/ui/StatusBadge.tsx`
- `src/lib/order-status.ts`

**ویرایش‌شده (۸):**
- `src/app/admin/dashboard/orders/OrdersClient.tsx`
- `src/app/admin/dashboard/orders/[id]/OrderDetailClient.tsx`
- `src/app/admin/dashboard/users/[id]/CustomerProfileView.tsx`
- `src/app/(shop)/profile/orders/page.tsx`
- `src/app/(shop)/profile/orders/[id]/page.tsx`
- `src/components/admin/Sidebar.tsx`
- `src/app/globals.css`

*(جمعاً ۹ فایل — دقیقاً محدوده‌ی تسک‌ها، بدون فایل اضافه)*

---

## 🔍 ناهماهنگی‌های prompt با کدِ واقعی (طبق درخواست، صریح ذکر شد)

1. **`dir-ltr` در ۱۱ فایل نبود** — grep واقعی ۸ فایل پیدا کرد؛ سه موردِ ادعاشده (`AuthModal.tsx`, `UserButton.tsx`, `ProductInfo.tsx`) هیچ مصرفی نداشتند. تعریفِ سراسری هر حالِ آینده را هم پوشش می‌دهد.
2. **`LocalShipping` در lucide-react نصب‌شده وجود ندارد** — برای HANDED_TO_CARRIER از `Warehouse` استفاده شد.
3. Task 2 می‌گفت فایل‌های فروشگاه «فقط ۶ وضعیت» دارند — درست؛ برچسب‌های کانونیک از نسخه‌ی کاملِ ادمین گرفته شد (مثلاً «تحویل شده» به‌جای «تحویل داده شده»).
4. جزئیاتِ کوچک: `OrderDetailClient` هدرِ badge را `rounded-full` نشان می‌داد؛ حالا مثل بقیه `rounded-lg` کانونیک است (خواسته‌ی خودِ یکدست‌سازی).

## 🚫 خارج از scope (دست نخورد)
- مهاجرتِ سایر badgeها (role/error/severity/stock/comment/review) به StatusBadge
- سایر یافته‌های ممیزی (DS1/DS2/DS5…، A11Y*، NEW-2..8)
- هرگونه بازطراحی بصری
