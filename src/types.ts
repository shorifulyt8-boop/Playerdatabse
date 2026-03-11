export type PlayerCategory = 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
export type PlayerStatus = 'available' | 'sold' | 'unsold';

export interface Player {
  id: string;
  name: string;
  category: PlayerCategory;
  base_price: number;
  sold_price: number | null;
  status: PlayerStatus;
  team_id: string | null;
  image_url?: string;
}

export interface Team {
  id: string;
  name: string;
  owner: string;
  budget: number;
  remaining_budget: number;
  logo_url?: string;
  login_id?: string;
  password?: string;
}

export interface AuctionLog {
  id: string;
  player_id: string;
  team_id: string;
  price: number;
  created_at: string;
}
