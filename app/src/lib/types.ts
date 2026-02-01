export interface SlideImage {
  src: string;
  title: string;
  caption: string;
}

export interface Slide {
  slide_id: string;
  title: string;
  subtitle: string;
  section: string;
  challenge: string;
  built: string;
  built_items?: string[];
  impact: string[];
  tech_stack: string[];
  images: SlideImage[];
}

export interface ContactInfo {
  email: string;
  phone: string;
  location: string;
}

export interface PathEvent {
  year: string;
  event: string;
}

export interface Intro {
  name: string;
  tagline: string;
  contact: ContactInfo;
  summary: string;
  bio: string;
  path: PathEvent[];
}

export interface ClosingContact {
  name: string;
  email: string;
  phone: string;
  location: string;
}

export interface Closing {
  headline: string;
  bullets: string[];
  contact: ClosingContact;
}

export interface PortfolioData {
  slug: string;
  visit_id: string;
  intro: Intro;
  slides: Slide[];
  closing: Closing;
}
