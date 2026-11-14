// src/types/news.ts
export interface NewsItem {
	/** uuid primary key in the “news” table */
	id: string;
	/** title of the news */
	title: string;
	/** main text/body */
	content: string;
	/** the STORAGE path (e.g. "news/nowosci_3.png") */
	image_url: string;
	/** optional button label */
	button_text?: string | null;
	/** optional button link */
	button_url?: string | null;
	/** optional publication date in YYYY-MM-DD */
	date?: string | null;
	/** automatically managed by Supabase */
	created_at?: string;
  }
  