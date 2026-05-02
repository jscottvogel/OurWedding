import { type Schema } from '../../amplify/data/resource';

export type WebsiteConfig = Schema['WebsiteConfig']['type'];
export type WebsiteStory = Schema['WebsiteStory']['type'];
export type WebsiteTravel = Schema['WebsiteTravel']['type'];
export type WebsitePartyMember = Schema['WebsitePartyMember']['type'];
export type WebsiteRegistry = Schema['WebsiteRegistry']['type'];
export type WebsiteFaq = Schema['WebsiteFaq']['type'];
export type WebsiteGuestbook = Schema['WebsiteGuestbook']['type'];

export type ThemePreset = {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  headingFont: string;
  bodyFont: string;
};
