import {
  Component,
  OnInit,
  Input,
  Output,
  AfterViewChecked,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';

import { MapService } from './map.service';

@Component({
  selector: 'ay-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @Input()
  mapLocation: string;

  constructor(private _mapService: MapService) {}

  /** Used AfterViewInit and ngOnDestroy() because after moving away from the 'Show Campground' page,
   * which displays the map,
   * there was a random error in MapService mapboxgl.Map settings for the
   * container: 'map' property. It did not find the container named 'map'
   */
  ngAfterViewInit() {
    this._mapService.buildMap(this.mapLocation);
  }

  ngOnDestroy() {
    delete this._mapService;
  }
}
