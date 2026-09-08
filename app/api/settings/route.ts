import { NextResponse } from 'next/server';
import { getDocument } from '@/lib/firestore';
export async function GET(){ try{const d=await getDocument('Settings/constants'); if(!d)return NextResponse.json({}, {status:404}); const {search_settings,bu_auth_key,...safe}=d; return NextResponse.json({...safe,search_settings:search_settings?{is_configured:true}:undefined,bu_auth_enabled:Boolean(d.bu_auth_enabled)});}catch(e:any){return NextResponse.json({error:e?.message},{status:502});} }
