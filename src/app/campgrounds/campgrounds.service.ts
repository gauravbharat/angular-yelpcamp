import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

/** 13102020 - Gaurav - GraphQL API changes */
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';

//Observables and operators
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { SocketService } from '../socket.service';

import {
  Campground,
  CampStaticData,
  BestSeasonsModel,
  HikingLevels,
  FitnessLevels,
  TrekTechnicalGrades,
  CountryData,
  CampLevelsData,
  RatingCountUsers,
} from './campground.model';
import { environment } from '../../environments/environment';

const BACKEND_URL = `${environment.apiUrl}/campgrounds`;

@Injectable({ providedIn: 'root' })
export class CampgroundsService {
  campgroundDataPayload: Observable<any>;
  hikesDataPayload: Observable<any>;
  allStaticDataPayload: Observable<any>;

  private campgrounds: Campground[] = [];
  private campStaticData: CampStaticData;

  /** Using Subject observable to multicast campgrounds fetched */
  private campgroundsUpdated = new Subject<{
    campgrounds: Campground[];
    maxCampgrounds: number;
    campgroundsCount: number;
    usersCount: number;
    contributorsCount: number;
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
    private _socketService: SocketService,
    private _apollo: Apollo
  ) {}

  getAllStaticData() {
    /** Get the list of all campground static data from the database */
    if (environment.useApi === 'GRAPHQL') {
      const getStaticData = gql`
        {
          campStaticData {
            countriesList {
              _id
              Two_Letter_Country_Code
              Country_Name
              Continent_Code
              Continent_Name
            }
            amenitiesList {
              _id
              name
              group
            }
            seasons {
              id
              indianName
              englishName
            }
            hikingLevels {
              level
              levelName
              levelDesc
            }
            trekTechnicalGrades {
              level
              levelName
              levelDesc
            }
            fitnessLevels {
              level
              levelName
              levelDesc
            }
          }
        }
      `;

      this.allStaticDataPayload = this._apollo
        .watchQuery({
          query: getStaticData,
        })
        .valueChanges.pipe(map(({ data }) => data));

      return this.allStaticDataPayload;
    } else {
      return this._http.get<{
        message: string;
        campStaticData: CampStaticData;
      }>(`${BACKEND_URL}/static`);
    }
  }

  getCampLevelsData() {
    /** Get the list of campground levels static data from the database */
    if (environment.useApi === 'GRAPHQL') {
      const getHikesData = gql`
        {
          campLevelsData {
            seasons {
              id
              indianName
              englishName
            }
            hikingLevels {
              level
              levelName
              levelDesc
            }
            trekTechnicalGrades {
              level
              levelName
              levelDesc
            }
            fitnessLevels {
              level
              levelName
              levelDesc
            }
          }
        }
      `;

      this.hikesDataPayload = this._apollo
        .watchQuery({
          query: getHikesData,
        })
        .valueChanges.pipe(map(({ data }) => data));

      return this.hikesDataPayload;
    } else {
      return this._http.get<{
        message: string;
        campLevelsData: CampLevelsData;
      }>(`${BACKEND_URL}/camp-levels`);
    }
  }

  getUserCampgroundRating(campgroundId: string) {
    return this._http.get<{ message: string; rating: number }>(
      `${BACKEND_URL}/rating/${campgroundId}`
    );
  }

  getCampgrounds(
    campgroundsPerPage: number,
    currentPage: number,
    search: string
  ) {
    /** 13102020 - Gaurav - GraphQL API changes */
    if (environment.useApi === 'GRAPHQL') {
      const getAllCampgrounds = gql`
        query allCampgrounds($pagination: PaginationParams!, $query: String) {
          campgrounds(pagination: $pagination, query: $query) {
            maxCampgrounds
            campgroundsCount
            usersCount
            contributorsCount
            campgrounds {
              _id
              name
              rating
              image
            }
          }
        }
      `;

      this._apollo
        .watchQuery<{
          campgrounds: {
            campgrounds: any;
            maxCampgrounds: number;
            campgroundsCount: number;
            usersCount: number;
            contributorsCount: number;
          };
        }>({
          query: getAllCampgrounds,
          variables: {
            pagination: {
              limit: campgroundsPerPage,
              skip: campgroundsPerPage * (currentPage - 1),
            },
            query: search,
          },
        })
        .valueChanges.pipe(
          map(
            ({
              data: {
                campgrounds: {
                  campgrounds,
                  maxCampgrounds,
                  campgroundsCount,
                  usersCount,
                  contributorsCount,
                },
              },
            }) => {
              return {
                mappedCampgrounds: campgrounds.map((campground) => {
                  return {
                    ...campground,
                    campRatingDisplay: this._getCampRatingDisplay(
                      campground.rating
                    ),
                  };
                }),
                maxCampgrounds,
                campgroundsCount,
                usersCount,
                contributorsCount,
              };
            }
          )
        )
        .subscribe((transformedData) => {
          this.campgrounds = transformedData.mappedCampgrounds;
          this.campgroundsUpdated.next({
            campgrounds: [...this.campgrounds],
            maxCampgrounds: transformedData.maxCampgrounds,
            campgroundsCount: transformedData.campgroundsCount,
            usersCount: transformedData.usersCount,
            contributorsCount: transformedData.contributorsCount,
          });
        });
    }
    // REST API
    else {
      const queryParms = `?pagesize=${campgroundsPerPage}&page=${currentPage}${
        search ? `&search=${search}` : ''
      }`;

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
                    country: campground?.country,
                    bestSeasons: campground?.bestSeasons,
                    hikingLevel: campground?.hikingLevel,
                    fitnessLevel: campground?.fitnessLevel,
                    trekTechnicalGrade: campground?.trekTechnicalGrade,
                    rating: campground?.rating,
                    campRatingDisplay: this._getCampRatingDisplay(
                      campground?.rating
                    ),
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
            campgroundsCount: 0,
            usersCount: 0,
            contributorsCount: 0,
          });

          this.campgroundsListSource.next([...this.campgrounds]); // 07082020 - Show Campgrounds
        });
    }
  }

  private _getCampRatingDisplay(rating: number) {
    let campRating = [
      { rating: 1, icon: 'star_outline' },
      { rating: 2, icon: 'star_outline' },
      { rating: 3, icon: 'star_outline' },
      { rating: 4, icon: 'star_outline' },
      { rating: 5, icon: 'star_outline' },
    ];

    if (rating && rating > 0) {
      for (let i = 0.5; i <= rating; i += 0.5) {
        if (i > 5) break; //expect rating between 1 - 5

        // if current iteration is whole integer, set full star
        if (Number.isInteger(i)) {
          campRating[i - 1].icon = 'star';
        }

        // if current iteration is a decimal and to end of this loop, set half star
        if (!Number.isInteger(i) && i == rating) {
          campRating[Math.ceil(i - 1)].icon = 'star_half';
        }
      }
    }

    return campRating;
  }

  getCampground(campgroundId: string, isEditMode: boolean = false) {
    // 13102020 - Gaurav - GraphQL API changes
    if (environment.useApi === 'GRAPHQL') {
      const getCampgroundData = gql`
        query getCampground($campgroundId: ID!, $isEditMode: Boolean = false) {
          campground(_id: $campgroundId, isEditMode: $isEditMode) {
            ratingData @skip(if: $isEditMode) {
              ratingsCount
              ratedBy
            }
            campground {
              _id
              name
              price
              image
              location
              description
              rating @skip(if: $isEditMode)
              bestSeasons {
                vasanta
                grishma
                varsha
                sharat
                hemant
                shishira
              }
              country {
                _id
                Two_Letter_Country_Code
                Country_Name
                Continent_Name
              }
              fitnessLevel {
                level
                levelName
                levelDesc
              }
              hikingLevel {
                level
                levelName
                levelDesc
              }
              trekTechnicalGrade {
                level
                levelName
                levelDesc
              }
              author {
                _id
                username
              }
              amenities {
                _id
                name
                group
              }
              updatedAt
              comments @skip(if: $isEditMode) {
                _id
                text
                updatedAt
                isEdited
                author {
                  _id
                  username
                  avatar
                }
                likes {
                  _id
                  username
                  avatar
                }
              }
            }
          }
        }
      `;

      this.campgroundDataPayload = this._apollo
        .watchQuery<{
          campground: {
            campground: any;
            ratingData: any;
          };
        }>({
          query: getCampgroundData,
          variables: {
            campgroundId,
            isEditMode,
          },
        })
        .valueChanges.pipe(
          map(
            ({
              data: {
                campground: { campground, ratingData },
              },
            }) => {
              return {
                campground: {
                  ...campground,
                  author: {
                    ...campground.author,
                    id: campground?.author?._id,
                  },
                  country: {
                    ...campground.country,
                    id: campground?.country?._id,
                  },
                  comments: isEditMode
                    ? null
                    : campground.comments.map((comment) => {
                        return {
                          ...comment,
                          author: {
                            ...comment.author,
                            id: comment.author._id,
                          },
                          likes: comment.likes.map((like) => {
                            return {
                              ...like,
                              id: like._id,
                            };
                          }),
                        };
                      }),
                },
                ratingData: isEditMode ? null : ratingData,
              };
            }
          )
        );

      // this.campgroundDataPayload.subscribe((result) => {
      //   console.log('campgroundDataPayload from camp service', result);
      // });
      return this.campgroundDataPayload;
    } else {
      /** Instead of getting the edit-campground record from the array, fetch it from database.
       * NOW, the campground-create component expects a post synchronously from this asynchornous call
       * So, pass the subscription instead to campground-create and get the campground values there */

      return this._http.get<{
        campground: any;
        ratingData: RatingCountUsers;
      }>(`${BACKEND_URL}/${campgroundId}`);
    }
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
    country: CountryData,
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
    country && newCampData.append('country', JSON.stringify(country));
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
    country: CountryData,
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
      country && editCampData.append('country', JSON.stringify(country));
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
        country,
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

  updateCampgroundRating(campgroundId: string, rating: number) {
    return this._http.post<{ message: string }>(`${BACKEND_URL}/rating`, {
      campgroundId,
      rating,
    });
  }

  redirectToCampgrounds() {
    this._router.navigate(['/campgrounds']);
  }
}
