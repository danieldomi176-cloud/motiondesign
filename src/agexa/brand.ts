import data from '../../content/agexa/campaign.json';
export type BrandConfig = Omit<typeof data,'logoFile'|'clientScreens'|'businessScreens'> & {logoFile:string|null;clientScreens:string[];businessScreens:string[]};
export const brand=data as BrandConfig;
export const ink='#08080D',purple='#7C3AED',violet='#A855F7',muted='#A1A1AA';
