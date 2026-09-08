import { NextRequest, NextResponse } from 'next/server';
import { safeSearch } from '@/lib/algolia';
import { normalizeAnime } from '@/lib/normalize';
const allowed=new Set(['series','series_name_asc','series_name_desc','series_year_desc','series_year_asc','all','all_animation','series_date_created','series_fav_count_desc','best_mal_ranked','most_watched_animations']);
export async function GET(req:NextRequest){const q=req.nextUrl.searchParams.get('q')||''; const requested=req.nextUrl.searchParams.get('index')||'series'; const index=allowed.has(requested)?requested:'series'; const page=Math.max(0,Number(req.nextUrl.searchParams.get('page')||0)); const result=await safeSearch(index,q,{hitsPerPage:36,page}); return NextResponse.json({...result,items:result.hits.map(normalizeAnime)});}
