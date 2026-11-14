export interface Section {
  id: number;
  title: string;
  subtitle: string;
  order: number;
  image_path: string;
  button_text?: string | null;
  button_url?: string | null;
}