import { NextResponse } from 'next/server'; import { getCharacters } from '@/lib/content'; export async function GET(){return NextResponse.json({items:await getCharacters()});}
