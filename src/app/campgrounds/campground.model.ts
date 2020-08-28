interface Likes {
  id: string;
  username: string;
  avatar: string;
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
  likes?: Likes[];
}

export interface AmenityList {
  _id: string;
  name: string;
}

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
  comments?: any[] | Comments[];
  amenities?: AmenityList[] | string[];
}
