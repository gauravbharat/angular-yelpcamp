import { Component, OnInit, Input, Output } from '@angular/core';

import { MapService } from './map.service';

@Component({
  selector: 'ay-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  @Input()
  mapLocation: string;

  constructor(private _mapService: MapService) {}

  ngOnInit() {
    this._mapService.buildMap(this.mapLocation);
  }
}
