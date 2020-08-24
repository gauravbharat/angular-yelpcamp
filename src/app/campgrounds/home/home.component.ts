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
  private campgroundsSubscription$: Subscription;
  private authStatusSub$: Subscription;

  private _newCampSub$: Subscription;
  private _editCampSub$: Subscription;
  private _deleteCampSub$: Subscription;

  isLoading = false;
  totalCampgrounds = 0;
  campgroundsPerPage = 4;
  currentPage = 1;
  pageSizeOptions = [4, 8, 16];

  /** Campground Search vars */
  search: string;
  searchMode = false;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private campgroundsService: CampgroundsService,
    private authService: AuthService,
    private _socketService: SocketService
  ) {}

  ngOnInit() {
    this.isLoading = true;

    /** Set flag on privileged access of select controls */
    this.authStatusSub$ = this.authService
      .getAuthStatusListener()
      .subscribe(
        (authStatus) =>
          (this.isUserAuthenticated = authStatus.isUserAuthenticated)
      );

    this.getCampgrounds();

    this.campgroundsSubscription$ = this.campgroundsService
      .getCampgroundsUpdateListener()
      .subscribe(
        (campgroundData: {
          campgrounds: Campground[];
          maxCampgrounds: number;
        }) => {
          // console.log(
          //   'getCampgroundsUpdateListener: inside listener on home page'
          // );

          this.isLoading = false;
          this.totalCampgrounds = campgroundData.maxCampgrounds;
          this.campgrounds = campgroundData.campgrounds;
        }
      );

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
    this.campgroundsSubscription$.unsubscribe();
    this.authStatusSub$.unsubscribe();

    this._newCampSub$?.unsubscribe();
    this._editCampSub$?.unsubscribe();
    this._deleteCampSub$?.unsubscribe();
  }

  getCampgrounds() {
    this.campgroundsService.getCampgrounds(
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
}
