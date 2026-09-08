import { NextResponse } from 'next/server'; import { getNews } from '@/lib/content'; export async function GET(){return NextResponse.json({items:await getNews()});}
