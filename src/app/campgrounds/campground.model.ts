export interface Campground {
  _id: string;
  name: string;
  price: number;
  image: string;
  location: string;
  latitude?: number;
  longitude?: number;
  description: string;
  author?: {
    id: string;
    username: string;
  };
  created?: Date;
  comments?: string[];
  amenities?: AmenityList[] | string[];
}

export interface AmenityList {
  _id: string;
  name: string;
}
