import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  constructor(private http: HttpClient) {}

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
                    id: campground?.author.id,
                    username: campground?.author.username,
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

  getCampgroundsUpdateListener() {
    // Return the multicast observable for subscribers to subsribe and listen to
    return this.campgroundsUpdated.asObservable();
  }
}
