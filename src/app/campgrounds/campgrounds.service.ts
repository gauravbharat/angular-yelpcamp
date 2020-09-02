import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

//Observables and operators
import { Subject, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { SocketService } from '../socket.service';

import {
  Campground,
  AmenityList,
  CampStaticData,
  BestSeasonsModel,
  HikingLevels,
  FitnessLevels,
  TrekTechnicalGrades,
} from './campground.model';
import { environment } from '../../environments/environment';

const BACKEND_URL = `${environment.apiUrl}/campgrounds`;

@Injectable({ providedIn: 'root' })
export class CampgroundsService {
  private campgrounds: Campground[] = [];
  private campStaticData: CampStaticData;

  /** Using Subject observable to multicast campgrounds fetched */
  private campgroundsUpdated = new Subject<{
    campgrounds: Campground[];
    maxCampgrounds: number;
  }>();

  // 07082020 - Show Campgrounds
  // Trying to get data stored in service instead of fetching from
  private campgroundsListSource: BehaviorSubject<
    Campground[]
  > = new BehaviorSubject<Campground[]>([]);
  campgroundsList = this.campgroundsListSource.asObservable();

  constructor(
    private _http: HttpClient,
    private _router: Router,
    private _socketService: SocketService
  ) {}

  getAllStaticData() {
    /** Get the list of all campground static data from the database */
    return this._http.get<{ message: string; campStaticData: CampStaticData }>(
      `${BACKEND_URL}/static`
    );
  }

  getCampgrounds(
    campgroundsPerPage: number,
    currentPage: number,
    search: string
  ) {
    // console.log('campground service getCampgrounds');

    const queryParms = `?pagesize=${campgroundsPerPage}&page=${currentPage}${
      search ? `&search=${search}` : ''
    }`;

    // console.log(queryParms);

    this._http
      .get<{ message: string; campgrounds: any; maxCampgrounds: number }>(
        `${BACKEND_URL}${queryParms}`
      )
      .pipe(
        map((campgroundsData) => {
          // console.log(campgroundsData);
          return {
            mappedCampgrounds: campgroundsData?.campgrounds.map(
              (campground) => {
                return {
                  _id: campground._id,
                  name: campground.name,
                  price: +campground.price,
                  image: campground.image,
                  location: campground?.location,
                  description: campground?.description,
                  comments: campground?.comments,
                  author: {
                    id: campground?.author?.id,
                    username: campground?.author?.username,
                  },
                  amenities: campground?.amenities,
                  bestSeasons: campground?.bestSeasons,
                  hikingLevel: campground?.hikingLevel,
                  fitnessLevel: campground?.fitnessLevel,
                  trekTechnicalGrade: campground?.trekTechnicalGrade,
                };
              }
            ),
            maxCampgrounds: campgroundsData?.maxCampgrounds,
          };
        })
      )
      .subscribe((transformedData) => {
        if (!transformedData.mappedCampgrounds) {
          transformedData.mappedCampgrounds = [];
        }
        if (!transformedData.maxCampgrounds) {
          transformedData.maxCampgrounds = 0;
        }
        // console.log(transformedData.mappedCampgrounds);
        // console.log(transformedData.maxCampgrounds);
        this.campgrounds = transformedData.mappedCampgrounds;
        this.campgroundsUpdated.next({
          campgrounds: [...this.campgrounds],
          maxCampgrounds: transformedData.maxCampgrounds,
        });

        this.campgroundsListSource.next([...this.campgrounds]); // 07082020 - Show Campgrounds
      });
  }

  getCampground(campgroundId: string) {
    // console.log('campground service getCampground by ID');

    /** Instead of getting the edit-campground record from the array, fetch it from database.
     * NOW, the campground-create component expects a post synchronously from this asynchornous call
     * So, pass the subscription instead to campground-create and get the campground values there */

    return this._http.get<{
      _id: string;
      name: string;
      price: number;
      description: string;
      location: string;
      image: string;
      amenities: AmenityList[] | null | undefined;
      comments: string[];
      bestSeasons: BestSeasonsModel;
      hikingLevel: HikingLevels;
      fitnessLevel: FitnessLevels;
      trekTechnicalGrade: TrekTechnicalGrades;
    }>(`${BACKEND_URL}/${campgroundId}`);
  }

  getCampgroundStats() {
    return this._http.get<{
      campgroundsCount: number;
      usersCount: number;
      contributorsCount: number;
    }>(`${BACKEND_URL}/stats`);
  }

  getUserCountry() {
    return this._http.get<any>(`${environment.ipUrl}`);
  }

  getCampgroundsUpdateListener() {
    // Return the multicast observable for subscribers to subsribe and listen to
    return this.campgroundsUpdated.asObservable();
  }

  /** 05/08/2020 - CREATE CAMPGROUND */
  createCampground(
    name: string,
    price: number,
    description: string,
    location: string,
    image: File,
    amenities: string[] | null | undefined,
    bestSeasons: BestSeasonsModel,
    hikingLevel: HikingLevels,
    fitnessLevel: FitnessLevels,
    trekTechnicalGrade: TrekTechnicalGrades
  ) {
    // Instead of sending json object 'post', send form data to include image file
    // FormData is a JavaScript object
    const newCampData = new FormData();
    newCampData.append('name', name);
    newCampData.append('price', String(price));
    newCampData.append('description', description);
    newCampData.append('location', location);
    newCampData.append('image', image, name.substring(0, 6));
    amenities && newCampData.append('amenities', JSON.stringify(amenities));
    bestSeasons &&
      newCampData.append('bestSeasons', JSON.stringify(bestSeasons));

    hikingLevel &&
      newCampData.append('hikingLevel', JSON.stringify(hikingLevel));
    fitnessLevel &&
      newCampData.append('fitnessLevel', JSON.stringify(fitnessLevel));
    trekTechnicalGrade &&
      newCampData.append(
        'trekTechnicalGrade',
        JSON.stringify(trekTechnicalGrade)
      );

    return this._http.post<{ campgroundId: string; campground: Campground }>(
      `${BACKEND_URL}/create`,
      newCampData
    );
  }

  /** 05/08/2020 - EDIT/UPDATE CAMPGROUND */
  updateCampground(
    _id: string,
    name: string,
    price: number,
    description: string,
    location: string,
    image: File | string,
    amenities: string[] | null | undefined,
    bestSeasons: BestSeasonsModel,
    hikingLevel: HikingLevels,
    fitnessLevel: FitnessLevels,
    trekTechnicalGrade: TrekTechnicalGrades
  ) {
    let editCampData: Campground | FormData;

    /** If user have update the image, send FormData object
     * else a normal object of type I/F Campground.
     * Stringify amenities array and parse in server */
    if (typeof image === 'object') {
      editCampData = new FormData();
      editCampData.append('_id', _id);
      editCampData.append('name', name);
      editCampData.append('price', String(price));
      editCampData.append('description', description);
      editCampData.append('location', location);
      editCampData.append('image', image, name.substring(0, 6));
      amenities && editCampData.append('amenities', JSON.stringify(amenities));
      bestSeasons &&
        editCampData.append('bestSeasons', JSON.stringify(bestSeasons));
      hikingLevel &&
        editCampData.append('hikingLevel', JSON.stringify(hikingLevel));
      fitnessLevel &&
        editCampData.append('fitnessLevel', JSON.stringify(fitnessLevel));
      trekTechnicalGrade &&
        editCampData.append(
          'trekTechnicalGrade',
          JSON.stringify(trekTechnicalGrade)
        );
    } else {
      editCampData = {
        _id,
        name,
        price,
        description,
        location,
        image,
        amenities,
        bestSeasons,
        hikingLevel,
        fitnessLevel,
        trekTechnicalGrade,
      };
    }

    return this._http.put(`${BACKEND_URL}/edit/${_id}`, editCampData);
  }

  // 06082020 - Delete campground
  deleteCampground(campgroundId: string) {
    return this._http.delete(`${BACKEND_URL}/${campgroundId}`).subscribe(
      (result) => {
        /** Notifiy delete campground */
        this._socketService.sendMessage('delete-campground', {
          campgroundId,
        });

        this.redirectToCampgrounds();
        // console.log('Campground deleted!');
      },
      (error) => {
        console.log('Error deleting campground', error);
      }
    );
  }

  redirectToCampgrounds() {
    this._router.navigate(['/campgrounds']);
  }
}
