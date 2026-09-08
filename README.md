# Anime Witcher Web

نسخة Web مبنية من تحليل تطبيق **Anime Witcher 1.3.8** مع نقل بنية جلب المحتوى والعرض إلى Next.js/Vercel بدلاً من مجرد إعادة تصميم الواجهة.

## ما تم نقله من التطبيق

- الصفحة الرئيسية RTL وHero carousel.
- أقسام: أكمل المشاهدة، حلقات جديدة، الأكثر شهرة هذا الموسم، أفضل الأنميات عالميًا، الأنميشن الأكثر مشاهدة، آخر الأعمال المضافة، آخر الأخبار.
- قائمة جانبية مطابقة لأقسام التطبيق: الأنمي، الأنميشن، المواسم، الإحصائيات، القادم، قائمتي، المفضلة، السجل، الشخصيات، جدول الحلقات، الأخبار، الإعدادات.
- صفحة تفاصيل العمل: cover/poster، الاسم، النوع، الموسم، السنة، الوسوم، القصة، التقييم، المشاهدات، MAL/IMDb، trailer.
- صفحة الحلقات مع filler والعنوان المترجم والصورة المصغرة.
- صفحة المشاهدة والسيرفرات والجودات + HTML5/HLS player.
- البحث والترتيب بنفس فهارس Algolia الأساسية.
- المفضلة وسجل المشاهدة محليًا للويب.

## نفس Backend الذي يستخدمه APK

### Firestore

المشروع: `animewitcher-1c66d`

المسارات التي تم استنتاجها من كود التطبيق:

- `Settings/constants`
- `Settings/search_service`
- `anime_list/{animeId}`
- `anime_list/{animeId}/details/anime_info`
- `anime_list/{animeId}/details/anime_trailer`
- `anime_list/{animeId}/episodes`
- `anime_list/{animeId}/episodes_summery/summery`
- `anime_list/{animeId}/episodes/{episodeId}/servers`
- `anime_list/{animeId}/episodes/{episodeId}/servers2`
- `users/{uid}/...` (بنية التطبيق الأصلية موثقة، ولا يتم كشف صلاحيات المستخدم من السيرفر العام)

### Algolia

الموقع لا يثبت Search Key حساسًا في JavaScript. يقوم Backend بقراءة `search_settings` من `Settings/constants` كما يفعل التطبيق ثم يستخدم الفهارس:

- `series`
- `series_fav_count_desc`
- `series_date_created`
- `recent`
- `news`
- `most_watched_animations`
- `best_mal_ranked`
- `all`
- `all_animation`
- `series_name_asc` / `series_name_desc`
- `series_year_asc` / `series_year_desc`
- `characters`

## السيرفرات والمشغل

تم نقل فكرة `ServersActivity` إلى Route خلفي. الروابط لا تُحل في المتصفح مباشرة. الأنواع المعروفة من APK تشمل `ST`, `VT`, `KF`, `MF`, `WC`, `AR`، مع استخراج ST/Streamtape وVT/Vidtube وخيار URL extraction للأنواع الأخرى. يدعم المشغل MP4 وHLS (`.m3u8`).

أي Bunny token key يبقى Server-side؛ لا يوضع في كود العميل.

## التشغيل

```bash
npm install
npm run dev
```

ثم افتح `http://localhost:3000`.

## Vercel

المشروع جاهز لـ Vercel مباشرة. يمكن ضبط القيم في Environment Variables عند الحاجة باستخدام `.env.example`.
