import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/** 13102020 - Gaurav - GraphQL API changes */
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';

import { environment } from '../../environments/environment';
const BACKEND_URL = `${environment.apiUrl}`;

@Injectable()
export class StatsService {
  data: Observable<any>;

  constructor(private _http: HttpClient, private _apollo: Apollo) {}

  getAllCampgrounds(){
    /** 13102020 - Gaurav - GraphQL API changes */
    if(environment.useApi === 'GRAPHQL') {
      /** The valueChanges observable gave errors to the subscriber inside the component as - 
       * ERROR in src/app/stats/campgrounds/all-camps.component.ts:41:7 - error TS2345: Argument of type '(response: any) => Promise<void>' is not assignable to parameter of type 'null'.
       * 
       * Got valueChanges observable inside an rxjs one instead and returned it to the subscriber */
      this.data =  this._apollo
      .watchQuery({
        query: gql`
          {
            allCampgrounds {
              _id
              name
              price
              rating
              countryCode
              continentName
            }
          }
        `}
      ).valueChanges.pipe(map(({data}) => data));
      return this.data;

    } else {  
      return this._http.get<{ message: string; allCampgrounds: any }>(
        `${BACKEND_URL}/campgrounds/allCampgrounds`
      );
    }  
  }

  getAllUsers() {
    return this._http.get<{ message: string; allUsers: any }>(
      `${BACKEND_URL}/users/allUsers`
    );
  }
}
