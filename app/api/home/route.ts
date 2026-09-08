import { NextResponse } from 'next/server';
import { getHomeData } from '@/lib/content';
export async function GET(){ try{return NextResponse.json(await getHomeData());}catch(e:any){return NextResponse.json({error:e?.message||'home failed'},{status:502});} }
