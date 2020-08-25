import { Injectable } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MapService {
  private _map: mapboxgl.Map;
  private _style = 'mapbox://styles/mapbox/streets-v11';
  private _zoom = 10;

  constructor(private _http: HttpClient) {}

  buildMap(mapLocation: string) {
    const searchLocation = mapLocation?.trim();

    this._http
      .get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${searchLocation}.json?limit=1&access_token=${environment.mapbox.accessToken}`
      )
      .subscribe(
        (result: any) => {
          if (result?.features[0]?.center.length > 0) {
            this._map = new mapboxgl.Map({
              accessToken: environment.mapbox.accessToken,
              container: 'map',
              style: this._style,
              zoom: this._zoom,
              center: [
                result?.features[0]?.center[0],
                result?.features[0]?.center[1],
              ],
            });

            this._map.addControl(new mapboxgl.NavigationControl());
          }

          // console.log(result);
        },
        (error) => {
          console.log('error getting map service', error);
        }
      );
  }
}
