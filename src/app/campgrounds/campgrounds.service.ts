import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

//Observables and operators
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { Campground } from './campground.model';
import { environment } from '../../environments/environment';

const BACKEND_URL = `${environment.apiUrl}/campgrounds`;

@Injectable({ providedIn: 'root' })
export class CampgroundsService {
  private campgrounds: Campground[] = [];

  /** Using Subject observable to multicast campgrounds fetched */
  private campgroundsUpdated = new Subject<{
    campgrounds: Campground[];
    maxCampgrounds: number;
  }>();

  constructor(private http: HttpClient, private router: Router) {}

  getCampgrounds(
    campgroundsPerPage: number,
    currentPage: number,
    search: string
  ) {
    const queryParms = `?pagesize=${campgroundsPerPage}&page=${currentPage}${
      search ? `&search=${search}` : ''
    }`;

    // console.log(queryParms);

    this.http
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
                  comments: campground?.comments,
                  author: {
                    id: null, //campground?.author.id,
                    username: null, //campground?.author.username,
                  },
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
      });
  }

  getCampground(campgroundId: string) {
    /** Instead of getting the edit-campground record from the array, fetch it from database.
     * NOW, the campground-create component expects a post synchronously from this asynchornous call
     * So, pass the subscription instead to campground-create and get the campground values there */

    return this.http.get<{
      _id: string;
      name: string;
      price: number;
      description: string;
      location: string;
      image: string;
    }>(`${BACKEND_URL}/${campgroundId}`);
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
    image: File
  ) {
    // Instead of sending json object 'post', send form data to include image file
    // FormData is a JavaScript object
    const newCampData = new FormData();
    newCampData.append('name', name);
    newCampData.append('price', String(price));
    newCampData.append('description', description);
    newCampData.append('location', location);
    newCampData.append('image', image, name.substring(0, 6));

    return this.http.post<{ campgroundId: string; campground: Campground }>(
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
    image: File | string
  ) {
    let editCampData: Campground | FormData;

    /** If user have update the image, send FormData object
     * else a normal object of type I/F Campground */
    if (typeof image === 'object') {
      editCampData = new FormData();
      editCampData.append('_id', _id);
      editCampData.append('name', name);
      editCampData.append('price', String(price));
      editCampData.append('description', description);
      editCampData.append('location', location);
      editCampData.append('image', image, name.substring(0, 6));
    } else {
      editCampData = {
        _id,
        name,
        price,
        description,
        location,
        image,
      };
    }

    return this.http.put(`${BACKEND_URL}/edit/${_id}`, editCampData);
  }

  // 06082020 - Delete campground
  deleteCampground(campgroundId: string) {
    return this.http.delete(`${BACKEND_URL}/${campgroundId}`);
  }

  redirectToCampgrounds() {
    this.router.navigate(['/campgrounds']);
  }
}
