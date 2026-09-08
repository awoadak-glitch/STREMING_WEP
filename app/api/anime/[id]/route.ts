import { NextResponse } from 'next/server'; import { getAnime } from '@/lib/content';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params; const item=await getAnime(id).catch(()=>null); return item?NextResponse.json(item):NextResponse.json({error:'not found'},{status:404});}
