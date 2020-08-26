import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { PageEvent, MatPaginator } from '@angular/material/paginator';

import { AuthService } from '../../auth/auth.service';
import { CampgroundsService } from '../campgrounds.service';
import { SocketService } from '../../socket.service';

import { Campground } from '../campground.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  isUserAuthenticated = false;
  campgrounds: Campground[] = [];
  private _campgroundsSubscription$: Subscription;
  private _authStatusSub$: Subscription;

  private _newCampSub$: Subscription;
  private _editCampSub$: Subscription;
  private _deleteCampSub$: Subscription;

  campgroundsCount: number;
  usersCount: number;
  contributorsCount: number;
  userCountryCode: string;

  isLoading = false;
  totalCampgrounds = 0;
  campgroundsPerPage = 4;
  currentPage = 1;
  pageSizeOptions = [4, 8, 16];
  hideStatsDashboard = false;

  /** Campground Search vars */
  search: string;
  searchMode = false;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private _campgroundsService: CampgroundsService,
    private _authService: AuthService,
    private _socketService: SocketService
  ) {}

  ngOnInit() {
    this.isLoading = true;

    /** Set flag on privileged access of select controls */
    this._authStatusSub$ = this._authService
      .getAuthStatusListener()
      .subscribe((authStatus) => {
        this.isUserAuthenticated = authStatus.isUserAuthenticated;
        this.hideStatsDashboard = authStatus.hideStatsDashboard;
      });

    this.getCampgrounds();

    this._campgroundsSubscription$ = this._campgroundsService
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

    /** Get dashboards stats */
    this._campgroundsService.getCampgroundStats().subscribe(
      (data) => {
        this.campgroundsCount = data.campgroundsCount;
        this.usersCount = data.usersCount;
        this.contributorsCount = data.contributorsCount;
      },
      (error) => {
        // do nothing, shall be intercepted
      }
    );

    this.userCountryCode = 'IN';

    // /** Get user country to show colour accordingly, defaults to IN */
    // this._campgroundsService.getUserCountry().subscribe((data) => {
    //   this.userCountryCode = data?.country ? data.country : 'IN';
    // });

    /** 24082020 - Subscribe to new/edit/delete campground socket observables */
    this._newCampSub$ = this._socketService.newCampListener().subscribe(
      (response) => {
        //Refresh campgrounds only when the new campground is not currently displayed
        if (
          !this.campgrounds ||
          this.campgrounds.findIndex(
            (campground) => campground._id === response.campgroundId
          ) === -1
        ) {
          this.getCampgrounds();
        }
      },
      (error) => {
        console.log('socketService newCampListener error', error);
      }
    );

    this._editCampSub$ = this._socketService.editCampListener().subscribe(
      (response) => {
        this.getCampgrounds();
      },
      (error) => {
        console.log('socketService newCampListener error', error);
      }
    );

    this._deleteCampSub$ = this._socketService.deleteCampListener().subscribe(
      (response) => {
        //Refresh campgrounds only if the deleted campground is currently displayed
        if (
          this.campgrounds &&
          this.campgrounds.findIndex(
            (campground) => campground._id === response.campgroundId
          ) !== -1
        ) {
          this.getCampgrounds();
        }
      },
      (error) => {
        console.log('socketService newCampListener error', error);
      }
    );
  }

  ngOnDestroy() {
    this._campgroundsSubscription$.unsubscribe();
    this._authStatusSub$.unsubscribe();

    this._newCampSub$?.unsubscribe();
    this._editCampSub$?.unsubscribe();
    this._deleteCampSub$?.unsubscribe();
  }

  getCampgrounds() {
    this._campgroundsService.getCampgrounds(
      this.campgroundsPerPage,
      this.currentPage,
      this.search
    );
  }

  /** On change Pagination */
  onChangedPage(pageData: PageEvent) {
    this.isLoading = true;

    if (!this.searchMode) {
      this.search = null;
    }

    // Increment for backend since it starts from 1 there and here from 0
    this.currentPage = pageData.pageIndex + 1;
    this.campgroundsPerPage = pageData.pageSize;
    this.getCampgrounds();
  }

  /** Search campground related methods */
  onSearchCampground() {
    if (this.search && this.search.trim().length > 0) {
      this.searchMode = true;

      /** if currentPage is 2 or more,
       * 1. Force page index to 0, to avoid weird page navigation
       * 2. set it to 1, to let database search for all available
       records from 2nd page as well and show them per items on page */
      this.paginator?.firstPage();
      this.currentPage = 1;

      this.getCampgrounds();
    } else if (this.searchMode) {
      this.searchMode = false;
      this.search = null;
      this.getCampgrounds();
    }
  }

  onClearSearch() {
    this.searchMode = false;
    this.search = null;

    this.getCampgrounds();
  }

  getFlagColor() {
    switch (this.userCountryCode) {
      case 'US':
      case 'FR':
      case 'UK':
        return {
          top: { 'background-color': 'blue', color: 'white' },
          middle: { 'background-color': 'white', color: 'black' },
          bottom: { 'background-color': 'red', color: 'white' },
        };
      case 'NL':
        return {
          top: { 'background-color': 'red', color: 'white' },
          middle: { 'background-color': 'white', color: 'black' },
          bottom: { 'background-color': 'blue', color: 'white' },
        };
      case 'RU':
        return {
          top: { 'background-color': 'white', color: 'black' },
          middle: { 'background-color': 'blue', color: 'white' },
          bottom: { 'background-color': 'red', color: 'white' },
        };
      case 'BG':
        return {
          top: { 'background-color': 'white', color: 'black' },
          middle: { 'background-color': 'green', color: 'white' },
          bottom: { 'background-color': 'red', color: 'white' },
        };
      case 'CG':
        return {
          top: { 'background-color': 'green', color: 'white' },
          middle: { 'background-color': 'yellow', color: 'black' },
          bottom: { 'background-color': 'red', color: 'white' },
        };
      case 'GN':
        return {
          top: { 'background-color': 'red', color: 'white' },
          middle: { 'background-color': 'yellow', color: 'black' },
          bottom: { 'background-color': 'green', color: 'white' },
        };
      case 'HU':
        return {
          top: { 'background-color': 'red', color: 'white' },
          middle: { 'background-color': 'white', color: 'black' },
          bottom: { 'background-color': 'green', color: 'white' },
        };
      case 'IE':
        return {
          top: { 'background-color': 'green', color: 'white' },
          middle: { 'background-color': 'white', color: 'black' },
          bottom: { 'background-color': 'orange', color: 'white' },
        };
      case 'IT':
        return {
          top: { 'background-color': 'green', color: 'white' },
          middle: { 'background-color': 'white', color: 'black' },
          bottom: { 'background-color': 'red', color: 'white' },
        };
      case 'RO':
        return {
          top: { 'background-color': 'blue', color: 'white' },
          middle: { 'background-color': 'yellow', color: 'black' },
          bottom: { 'background-color': 'red', color: 'white' },
        };
      case 'DE':
        return {
          top: { 'background-color': 'black', color: 'white' },
          middle: { 'background-color': 'red', color: 'white' },
          bottom: { 'background-color': 'yellow', color: 'black' },
        };
      case 'CH':
        return {
          top: { 'background-color': 'red', color: 'white' },
          middle: { 'background-color': 'white', color: 'black' },
          bottom: { 'background-color': 'red', color: 'white' },
        };
      case 'JP':
        return {
          top: { 'background-color': 'white', color: 'black' },
          middle: { 'background-color': 'red', color: 'white' },
          bottom: { 'background-color': 'white', color: 'black' },
        };
      default:
        return {
          top: { 'background-color': 'orange', color: 'white' },
          middle: { 'background-color': 'white', color: 'black' },
          bottom: { 'background-color': 'green', color: 'white' },
        };
    }
  }
}
