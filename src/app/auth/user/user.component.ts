import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { MatDialog } from '@angular/material/dialog';
import {
  ImageDialogComponent,
  PasswordDialogComponent,
} from './dialog/dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarComponent } from '../../error/snackbar.component';
import { configSuccess } from '../../error/snackbar.config';

import { AuthService } from '../auth.service';
import { UserService } from './user.service';

import { CurrentUser, DisplayCoUser } from '../auth-data.model';
import { NgForm } from '@angular/forms';

@Component({
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css'],
})
export class UserComponent implements OnInit, OnDestroy {
  isLoading = false;
  private _showOnInitTab: string;
  private _tabIndex = {
    USER_SETTINGS: 0,
    USER_CAMPGROUNDS: 1,
    USER_NOTIFICATIONS: 2,
  };
  selectIndex: number;

  private _authStatusSub$: Subscription;
  private _userRouteChangedSub$: Subscription;
  private _userUpdateSub$: Subscription;
  isUserAuthenticated = false;
  currentUserId: string;
  currentUsername: string;

  // User update fields
  firstname: string;
  lastname: string;
  email: string;
  enableUpdateButton = false;

  /** This component can be used to show another user */
  currentUser: CurrentUser | null;
  displayCoUser: DisplayCoUser | null;
  displayCoUserCampgrounds: [] | null;
  displayCurrentUserCampgrounds: [] | null;
  showCoUser = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    public dialog: MatDialog,
    private _snackbar: MatSnackBar
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this._authStatusSub$ = this.authService
      .getAuthStatusListener()
      .subscribe((authStatus) => {
        this.isUserAuthenticated = authStatus.isUserAuthenticated;
        this.currentUserId = authStatus.userId;
        this.currentUsername = authStatus.username;
      });

    this._userRouteChangedSub$ = this.userService
      .getUserRouterChangeListener()
      .subscribe((routeStatus) => {
        this._showOnInitTab = routeStatus.showTab;
        this.showCoUser = routeStatus.showCoUser;
        this.selectIndex = this._tabIndex[this._showOnInitTab];

        if (this.showCoUser) {
          this.userService.getCoUserData().subscribe(
            (response) => {
              // console.log(response);
              this.displayCoUser = response.coUserData;
              this.displayCoUserCampgrounds = response.userCampgrounds;
              this.isLoading = false;
            },
            (error) => {
              this.displayCoUser = null;
              // console.log('error: displaying co-user details', error);
              this.isLoading = false;
              this.authService.redirectToCampgrounds();
            }
          );
        } else {
          // Deferred loading of user data interfacet CurrentUser
          // Only when viewing current user page
          if (this.isUserAuthenticated) {
            this._userUpdateSub$ = this.authService
              .getUserUpdatesListener()
              .subscribe((userData) => {
                // console.log('currentUSer updated');
                this.currentUser = userData.updatedUser;
                this.firstname = this.currentUser?.firstname;
                this.lastname = this.currentUser?.lastname;
                this.email = this.currentUser?.email;
                this.isLoading = false;
              });

            this.userService.getUserActivity(this.currentUserId).subscribe(
              (response) => {
                this.displayCurrentUserCampgrounds = response.userCampgrounds;
                this.isLoading = false;
              },
              (error) => {
                console.log('error getting user activity', error);
              }
            );
          } else {
            this.currentUserId = null;
            this.currentUsername = null;
            this.currentUser = null;
            this.displayCoUser = null;
            this.firstname = null;
            this.lastname = null;
            this.email = null;
            this.displayCoUserCampgrounds = [];
            this.displayCurrentUserCampgrounds = [];
            this.userService.redirectToHomePage();
            this.isLoading = false;
          }
        }
      });
  }

  ngOnDestroy() {
    this?._authStatusSub$?.unsubscribe();
    this?._userRouteChangedSub$?.unsubscribe();
    this?._userUpdateSub$?.unsubscribe();
  }

  toggleUserFollow(isFollow: boolean): void {
    if (this.showCoUser && this.displayCoUser && this.currentUserId) {
      this.isLoading = true;
      this.userService
        .toggleFollowUser(
          this.displayCoUser.coUserId,
          this.currentUserId,
          isFollow
        )
        .subscribe(
          (result) => {
            this._snackbar.openFromComponent(SnackBarComponent, {
              data: isFollow
                ? `You are now following ${this.currentUsername}!`
                : `You unfollowed ${this.currentUsername}!`,
              ...configSuccess,
            });

            /** Instead of fetching user again for the follower array update,
             * modify the local array of displayed co-user */
            isFollow && this.displayCoUser.followers.push(this.currentUserId);
            !isFollow &&
              (this.displayCoUser.followers = this.displayCoUser.followers.filter(
                (id) => id !== this.currentUserId
              ));
            this.isLoading = false;
          },
          (error) => {
            console.log('user follow error', error);
            this.isLoading = false;
          }
        );
    }
  }

  isCurrentUserFollower(): boolean {
    if (this.displayCoUser) {
      return this.displayCoUser?.followers?.includes(this.currentUserId);
    } else {
      return false;
    }
  }

  /** IMPORTANT NODE: UPDATE USER DATA AT AUTH LEVEL,
   * TO REFLECT CHANGE EVERYWHERE INCLUDING HEADER COMPONENT */
  async updateUserData(form: NgForm) {
    if (!form.valid) return;
    if (
      form.value.firstname.trim() === '' ||
      form.value.lastname.trim() === '' ||
      form.value.email.trim() === ''
    ) {
      return;
    }

    if (
      form.value.firstname === this.currentUser.firstname &&
      form.value.lastname === this.currentUser.lastname &&
      form.value.email === this.currentUser.email
    ) {
      return;
    }

    this.isLoading = true;
    try {
      const result = await this.authService.updateUserData(
        this.currentUserId,
        form.value.firstname,
        form.value.lastname,
        form.value.email
      );

      this._snackbar.openFromComponent(SnackBarComponent, {
        data: result,
        ...configSuccess,
      });

      this.isLoading = false;
    } catch (error) {
      // console.log('error updating user', error);
      // error updating user data, http interceptor shall snackbar
      this.isLoading = false;
    }
  }

  onUpdateUserAvatar() {
    const changeAvatarDialogRef = this.dialog.open(ImageDialogComponent, {
      width: '250px',
      data: { message: '' },
    });

    changeAvatarDialogRef.afterClosed().subscribe(async (newAvatarLink) => {
      if (newAvatarLink) {
        this.isLoading = true;
        // console.log('avatar update initiated');
        this.authService
          .updateUserAvatar(this.currentUserId, newAvatarLink)
          .then((result) => {
            this.isLoading = false;
          })
          .catch((error) => {
            // error updating avatar, http interceptor shall snackbar
            this.isLoading = false;
          });
      }
    });
  }

  onChangePassword() {
    const changePasswordDialogRef = this.dialog.open(PasswordDialogComponent, {
      width: '250px',
      data: { userId: this.currentUserId },
    });

    changePasswordDialogRef.afterClosed().subscribe(async (result) => {
      result?.isPasswordUpdated &&
        this._snackbar.openFromComponent(SnackBarComponent, {
          data: result.message,
          ...configSuccess,
        });
    });
  }

  // https://relevantmagazine.com/wp-content/uploads/2017/05/rambop.jpg
  // 'https://nofilmschool.com/sites/default/files/styles/structured_4x3/public/rambo_0.jpg?itok=7wp3VTDy'
}
