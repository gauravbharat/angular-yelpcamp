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

/** Amenity list as received from server and campgrounds model */
export interface AmenityList {
  _id: string;
  name: string;
  group: string;
}

/** Amenity list specially for create/edit camps SELECT mat control */
export interface Amenity {
  _id: string;
  name: string;
}

export interface AmenityGroups {
  group: string;
  amenity: Amenity[];
}
/** Amenity list specially for create/edit camps - Ends */

export interface CountriesList {
  Continent_Code: string;
  Continent_Name: string;
  Country_Name: string;
  Country_Number: number;
  Three_Letter_Country_Code: string;
  Two_Letter_Country_Code: string;
  majorVersion: number;
  _id: string;
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
  country?: {
    id: string;
    Continent_Code: string;
    Continent_Name: string;
    Country_Name: string;
    Two_Letter_Country_Code: string;
  };
  bestSeason?: number[];
  hikingLevels?: number[];
  trekTechnicalGrades?: number[];
  fitnessLevels?: number[];
}
