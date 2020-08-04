import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { Campground } from '../campground.model';
import { CampgroundsService } from '../campgrounds.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  campgrounds: Campground[] = [];
  private campgroundsSubscription$: Subscription;

  isLoading = false;
  totalCampgrounds = 0;

  constructor(public campgroundsService: CampgroundsService) {}

  ngOnInit() {
    this.campgroundsService.getCampgrounds();

    this.campgroundsSubscription$ = this.campgroundsService
      .getCampgroundsUpdateListener()
      .subscribe(
        (campgroundData: {
          campgrounds: Campground[];
          maxCampgrounds: number;
        }) => {
          this.isLoading = false;
          this.totalCampgrounds = campgroundData.maxCampgrounds;
          this.campgrounds = campgroundData.campgrounds;
        }
      );
  }

  ngOnDestroy() {
    this.campgroundsSubscription$.unsubscribe();
  }
}
