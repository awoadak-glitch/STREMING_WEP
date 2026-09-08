import { getCharacters } from '@/lib/content';
import { getImage } from '@/lib/normalize';
import { asArabic } from '@/lib/firestore';
export const revalidate=120;
export default async function CharactersPage(){const items=await getCharacters().catch(()=>[]);return <><header className="page-header"><h1>الشخصيات</h1><p>شخصيات Anime Witcher مرتبة من نفس فهرس التطبيق.</p></header><div className="catalog-grid">{items.map((x:any,i:number)=>{const img=getImage(x.main_picture||x.picture||x.image);return <article className="character-card" key={x.objectID||i}>{img?<img src={img} alt=""/>:<div className="poster-placeholder" style={{aspectRatio:'1/1.25'}}>AW</div>}<div><strong>{asArabic(x.name,'شخصية')}</strong><span>{x.likes?`♥ ${x.likes}`:'Anime Witcher'}</span></div></article>})}</div>{!items.length&&<div className="status-message">تعذر جلب الشخصيات.</div>}</>}
