import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { CampgroundsService } from '../campgrounds.service';
import { Campground } from '../campground.model';
import { Subscription } from 'rxjs';

@Component({
  templateUrl: './show-campground.component.html',
  styleUrls: ['./show-campground.component.css'],
})
export class ShowCampgroundComponent implements OnInit, OnDestroy {
  isUserAuthenticated = false;
  isLoading = false;
  userId: string;
  private campgroundId: string;
  campground: Campground;

  private campListFromServiceSub$: Subscription;
  private getCampFromServerSub$: Subscription;
  private authStatusSub$: Subscription;

  constructor(
    private authService: AuthService,
    private campgroundsService: CampgroundsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.isLoading = true;

    this.authStatusSub$ = this.authService
      .getAuthStatusListener()
      .subscribe((authStatus) => {
        this.isUserAuthenticated = authStatus.isUserAuthenticated;
        this.userId = authStatus.userId;
      });

    // Get the campground id passed as paramter
    this.route.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has('campgroundId')) {
        this.campgroundId = paramMap.get('campgroundId');

        // console.log(this.campgroundId);

        this.campListFromServiceSub$ = this.campgroundsService.campgroundsList.subscribe(
          (campgroundsList) => {
            this.campground = campgroundsList.find(
              (campground) => campground._id === this.campgroundId
            );
            this.isLoading = false;
            // console.log('campground daata from service', this.campground);
          },
          (error) => {
            this.isLoading = false;
            console.log(
              `error getting campground records from campgrounds service object for id ${this.campgroundId}`,
              error
            );
          }
        );

        // If User refreshed the page or any other reason, fetch from database
        if (!this.campground) {
          this.getCampFromServerSub$ = this.campgroundsService
            .getCampground(this.campgroundId)
            .subscribe(
              (campgroundData) => {
                // console.log(campgroundData);
                this.campground = campgroundData;
                // console.log('campground daata from database', this.campground);
                this.isLoading = false;
              },
              (error) => {
                this.isLoading = false;
                // Some server error or campground may have been deleted (by some other admin user?)
                // route back to home page
                console.log(
                  `error getting campground from server for campground id ${this.campgroundId}`,
                  error
                );
                this.campgroundsService.redirectToCampgrounds();
              }
            );
        }
      }
    });
  }

  ngOnDestroy() {
    // unsubscribe from services subscribed to in ngOnInit()
    this.authStatusSub$.unsubscribe();
    this.campListFromServiceSub$?.unsubscribe();
    this.getCampFromServerSub$?.unsubscribe();
  }

  onDelete(id: string) {
    this.campgroundsService.deleteCampground(id);
  }
}
