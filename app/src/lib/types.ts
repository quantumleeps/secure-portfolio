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
  date?: string;
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

export interface PortfolioNote {
  text: string;
  repo: string;
  note: string;
}

export interface Intro {
  name: string;
  tagline: string;
  avatar?: string;
  contact: ContactInfo;
  headline_stats: string[];
  positioning: string;
  portfolio_note: PortfolioNote;
  confidentiality: string;
}

export interface PortfolioData {
  slug: string;
  visit_id: string;
  intro: Intro;
  slides: Slide[];
}
