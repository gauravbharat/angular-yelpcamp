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
  comments?: Comments[] | string[];
  amenities?: AmenityList[] | string[];
}

interface Comments {
  author?: {
    avatar: string;
    id: string;
    username: string;
  };
  created: string;
  edited: string;
  isEdited: boolean;
  text: string;
  _id: string;
}

export interface AmenityList {
  _id: string;
  name: string;
}
