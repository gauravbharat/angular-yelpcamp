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

export interface Seasons {
  id: number;
  indianName: string;
  englishName: string;
}

interface LevelsSkeleton {
  level: number;
  levelName: string;
  levelDesc: string;
}

export interface FitnessLevels extends LevelsSkeleton {}
export interface HikingLevels extends LevelsSkeleton {}
export interface TrekTechnicalGrades extends LevelsSkeleton {}

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

export interface CampLevelsData {
  seasons: Seasons[];
  hikingLevels: HikingLevels[];
  trekTechnicalGrades: TrekTechnicalGrades[];
  fitnessLevels: FitnessLevels[];
}

export interface CampStaticData {
  amenitiesList: AmenityList[];
  countriesList: CountriesList[];
  seasons: Seasons[];
  hikingLevels: HikingLevels[];
  trekTechnicalGrades: TrekTechnicalGrades[];
  fitnessLevels: FitnessLevels[];
}

export interface BestSeasonsModel {
  vasanta: boolean;
  grishma: boolean;
  varsha: boolean;
  sharat: boolean;
  hemant: boolean;
  shishira: boolean;
}

export interface CountryData {
  id: string;
  Continent_Name: string;
  Country_Name: string;
  Two_Letter_Country_Code: string;
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
  country?: CountryData;
  bestSeasons?: BestSeasonsModel;
  hikingLevel?: LevelsSkeleton;
  trekTechnicalGrade?: LevelsSkeleton;
  fitnessLevel?: LevelsSkeleton;
}
