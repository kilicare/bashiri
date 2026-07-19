import { apiClient } from "./client";

export interface HeroSlide {
  id: string;
  type: "TOP_PICK" | "DERBY" | "TRACK_RECORD" | "PRO" | "FAN_OF_MATCH" | "DID_YOU_KNOW" | "CUSTOM";
  title: string;
  subtitle: string;
  image_url: string;
  cta_label: string;
  route: string;
  accent_color: string;
}

export function getHeroSlides() {
  return apiClient<{ slides: HeroSlide[] }>("/hero/slides/");
}
