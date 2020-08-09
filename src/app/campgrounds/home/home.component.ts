import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';

import { MatPaginator } from '@angular/material/paginator';

import { AuthService } from '../../auth/auth.service';
import { Campground } from '../campground.model';
import { CampgroundsService } from '../campgrounds.service';
import { PageEvent } from '@angular/material/paginator';

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
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isLoading = true;

    /** Set flag on privileged access of select controls */
    this.authStatusSub$ = this.authService
      .getAuthStatusListener()
      .subscribe((authStatus) => (this.isUserAuthenticated = authStatus));

    this.getCampgrounds();

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
    this.authStatusSub$.unsubscribe();
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
