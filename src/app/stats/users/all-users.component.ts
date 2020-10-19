import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';

import { StatsService } from '../stats.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  templateUrl: './all-users.component.html',
  styleUrls: ['./all-users.component.css'],
})
export class AllUsersComponent implements OnInit, OnDestroy {
  isLoading = false;
  dataSource: MatTableDataSource<any>;

  isUserAuthenticated = false;
  currentUserId: string;
  private _authStatusSub$: Subscription;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private _statsService: StatsService,
    private _authService: AuthService
  ) {}

  ngOnInit() {
    this.isLoading = true;

    this._authStatusSub$ = this._authService
      .getAuthStatusListener()
      .subscribe((authStatus) => {
        (this.isUserAuthenticated = authStatus.isUserAuthenticated),
          (this.currentUserId = authStatus.userId);
      });

    this._statsService.getAllUsers().subscribe(
      async (response) => {
        this.dataSource = await new MatTableDataSource(response.allUsers);

        this.dataSource.paginator = await this.paginator;
        this.dataSource.sort = await this.sort;

        this.isLoading = false;
      },
      (error) => {
        this.isLoading = false;
        console.log(error);
      }
    );
  }

  ngOnDestroy() {
    this._authStatusSub$.unsubscribe();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
