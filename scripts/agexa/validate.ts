import type {BrandConfig} from '../../src/agexa/brand';
/** Prevents a conceptual campaign from silently claiming to show official product pixels. */
export function validateAgexa(config:BrandConfig,assetExists:(file:string)=>boolean):string[]{
 const errors:string[]=[];
 const isSafe=(file:string)=>!file.startsWith('/')&&!file.split(/[\\/]/).includes('..')&&!/^[a-z]+:/i.test(file);
 const files=[config.logoFile,...config.clientScreens,...config.businessScreens].filter((f):f is string=>Boolean(f));
 for(const file of files){if(!isSafe(file))errors.push(`Recurso fora de public/: ${file}`);else if(!assetExists(file))errors.push(`Recurso em falta: ${file}`);}
 if(config.assetsVerified&&(!config.clientScreens.length||!config.businessScreens.length))errors.push('Não é possível declarar telas oficiais verificadas sem capturas do cliente e do painel empresarial.');
 if(config.logoIsOriginal&&!config.logoFile)errors.push('Não é possível declarar logótipo original sem ficheiro.');
 const digits=config.whatsapp.replace(/\D/g,'');
 if(!/^258\d{9}$/.test(digits)||config.whatsappUrl!==`https://wa.me/${digits}`)errors.push('Número e link WhatsApp não correspondem a um contacto moçambicano válido.');
 try{const url=new URL(config.websiteUrl);if(url.protocol!=='https:'||config.website!==url.host+url.pathname.replace(/\/$/,''))errors.push('Website apresentado e endereço HTTPS não correspondem.');}catch{errors.push('Website inválido.');}
 return errors;
}
