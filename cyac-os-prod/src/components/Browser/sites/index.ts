// sites/index.ts - Export all site components
import { siteData as factionsData } from './Factions/Factions';
import { siteData as propagandaData } from './Propaganda/Propaganda';
import { siteData as infostreamData } from './Infostream/Infostream';
import { siteData as darknetData } from './Darknet/Darknet';
import {JSX} from "react";

// Site data interface
interface SiteData {
    id: string;
    name: string;
    url: string;
    component: JSX.Element;
}

// Export all site data in an array
export const SITES: SiteData[] = [
    factionsData,
    propagandaData,
    infostreamData,
    darknetData
];

// Export individual site data
export { factionsData, propagandaData, infostreamData, darknetData };