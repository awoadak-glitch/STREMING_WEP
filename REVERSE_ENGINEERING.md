# APK → Web mapping notes

هذا الملف يوثق الأجزاء التي تم استخراجها من Anime Witcher 1.3.8 لاستخدامها كمرجع عند تطوير نسخة الويب.

## Constants

`FireStoreHelper` يعرّف: `anime_list`, `anime_list_movies`, `recent`, `seasons`, `episodes`, `servers`, `details`, `anime_trailer`, `anime_info`, `reports`, `Settings`, `search_service`, `constants`, `users`, `fav_anime`, `user_anime`, `last_watched`.

## Splash settings

`SplashActivity` يقرأ `Settings/constants`، ومنه: `ads_provider`, `load_mode`, `version_code`, `current_season`, `update_message`, `alert_message`, `servers`, `key_search`, `is_search_active`, `load_servers_type`, `search_settings`, `seasons`, وBunny auth settings.

`search_settings`: `api_key`, `app_id`, `browse_api_key`.

## Home

الترتيب في `fragment_home.xml`:

1. Hero carousel
2. اكمل المشاهدة
3. حلقات جديدة
4. الأكثر شهرة هذا الموسم
5. افضل الأنميات عالميا
6. الانميشن الاكثر مشاهدة
7. اخر الأعمال المضافة
8. اخر الاخبار

## Anime model

حقول مهمة: `average_rate`, `cover_uri`, `details`, `dubbed`, `duration`, `imdb_id`, `mal_id`, `name`, `nextEpTimeInSec`, `note`, `poster`, `poster_uri`, `rating`, `related_anime_ids`, `season`, `show_time`, `story`, `tags`, `type`, `views`, `youtube_video_id`.

## Episode model

`bunny_video_id`, `comments_closed`, `doc_id`, `duration`, `filler`, `has_servers`, `mega_video_id`, `name`, `order`, `qualities`, `subs_List`, `temp_video_uri`, `thumb_uri`, `title_translated`, `type`, `watched`.

## Server resolution

- ST: markers `word1/word2/...` → token → `https://streamtape.com/get_video?id=<token>&dl=1`.
- VT: marker extraction → path under `https://vidtube.one` ثم مرحلة resolution أخرى.
- KF/MF/WC: HTML URL extraction with `https://` and `amp;` cleanup.
- AR: quality choices 480/720/1080 and Arabic quality names.
- App quality order: 1080p, 720p, 480p, 360p, 240p, اخرى, متعدد, سيرفر احتياطي.

## Android-only behavior replaced on Web

`anime_witcher://play?...` وMX Player intents تم استبدالهما بمشغل HTML5/HLS داخل الموقع. Android download folder/notification behavior تم استبداله برابط تنزيل/فتح مباشر من المتصفح.
