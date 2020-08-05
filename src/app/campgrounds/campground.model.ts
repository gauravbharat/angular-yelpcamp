interface ICommentsArray {
  [index: number]: string;
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
  comments?: ICommentsArray;
}
