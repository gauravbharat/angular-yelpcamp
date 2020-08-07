import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { CampgroundsService } from '../campgrounds.service';

@Component({
  templateUrl: './show-campground.component.html',
  styleUrls: ['./show-campground.component.css'],
})
export class ShowCampgroundComponent implements OnInit {
  private campgroundId: string;

  constructor(
    private campgroundsService: CampgroundsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get the campground id passed as paramter
    this.route.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has('campgroundId')) {
        this.campgroundId = paramMap.get('campgroundId');

        console.log(this.campgroundId);

        // this.campgroundsService.getCampground(this.campgroundId).subscribe(
        //   (campgroundData) => {

        //   }
        // )
      }
    });
  }
}
