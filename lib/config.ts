export const APP_NAME = 'Anime Witcher';
export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'animewitcher-1c66d';
// This is a Firebase client key shipped in the Android APK, not a service-account secret.
export const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || 'AIzaSyAcbWRwfFNnCpoydDXlEALWnM_TYVcJOMU';

export const COLLECTIONS = {
  anime: 'anime_list',
  movies: 'anime_list_movies',
  recent: 'recent',
  seasons: 'seasons',
  episodes: 'episodes',
  servers: 'servers',
  details: 'details',
  users: 'users',
  characters: 'characters_list',
  reports: 'reports',
  settings: 'Settings',
} as const;

export const SETTINGS = {
  constants: 'Settings/constants',
  search: 'Settings/search_service',
} as const;

export const HOME_INDEXES = {
  recent: 'recent',
  popularSeason: 'series_fav_count_desc',
  bestMal: 'best_mal_ranked',
  animations: 'most_watched_animations',
  latest: 'series_date_created',
  news: 'news',
} as const;

export const QUALITY_ORDER = ['1080p', '720p', '480p', '360p', '240p', 'اخري', 'متعدد', 'سيرفر احتياطي'];
