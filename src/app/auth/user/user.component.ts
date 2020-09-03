import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { FormGroup, Validators, FormControl } from '@angular/forms';

import { MatDialog } from '@angular/material/dialog';
import {
  ImageDialogComponent,
  PasswordDialogComponent,
} from './dialog/dialog.component';

/** Material Snackbar */
import { SnackbarService } from '../../error/snackbar.service';

import { AuthService } from '../auth.service';
import { UserService } from './user.service';

import {
  CurrentUser,
  DisplayCoUser,
  Notifications,
  UserSettingsUpdate,
} from '../auth-data.model';
import { NgForm } from '@angular/forms';

@Component({
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css'],
})
export class UserComponent implements OnInit, OnDestroy {
  isLoading = false;
  isLinear = true;
  basicFormGroup = new FormGroup({});
  displayPrefFormGroup = new FormGroup({});
  emailPrefFormGroup = new FormGroup({});

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

  /** This component can be used to show another user */
  currentUser: CurrentUser | null;
  displayCoUser: DisplayCoUser | null;
  displayCoUserCampgrounds: [] | null;
  displayCurrentUserCampgrounds: [] | null;
  showCoUser = false;

  constructor(
    private _authService: AuthService,
    private _userService: UserService,
    public _dialog: MatDialog,
    private _snackbarService: SnackbarService,
    private _router: Router
  ) {}

  ngOnInit() {
    this.isLoading = true;

    this._authStatusSub$ = this._authService
      .getAuthStatusListener()
      .subscribe((authStatus) => {
        this.isUserAuthenticated = authStatus.isUserAuthenticated;
        this.currentUserId = authStatus.userId;
        this.currentUsername = authStatus.username;
      });

    this._userRouteChangedSub$ = this._userService
      .getUserRouterChangeListener()
      .subscribe((routeStatus) => {
        this._showOnInitTab = routeStatus.showTab;
        this.showCoUser = routeStatus.showCoUser;
        this.selectIndex = this._tabIndex[this._showOnInitTab];

        if (this.showCoUser) {
          this._userService.getCoUserData().subscribe(
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
              this._authService.redirectToCampgrounds();
            }
          );
        } else {
          // Deferred loading of user data interfacet CurrentUser
          // Only when viewing current user page
          if (this.isUserAuthenticated) {
            this._userUpdateSub$ = this._authService
              .getUserUpdatesListener()
              .subscribe((userData) => {
                this.currentUser = userData.updatedUser;

                /** All User Settings: Form Group Init */
                this.basicFormGroup = new FormGroup({
                  username: new FormControl(
                    this.currentUser?.username,
                    Validators.required
                  ),
                  firstname: new FormControl(
                    this.currentUser?.firstname,
                    Validators.required
                  ),
                  lastname: new FormControl(
                    this.currentUser?.lastname,
                    Validators.required
                  ),
                  email: new FormControl(this.currentUser?.email, {
                    validators: [Validators.required, Validators.email],
                  }),
                });

                this.basicFormGroup.controls.username.disable();

                // Display Preferences Form
                this.displayPrefFormGroup = new FormGroup({
                  hideStatsDashboard: new FormControl(
                    this.currentUser?.hideStatsDashboard,
                    Validators.required
                  ),
                  newCampgroundAlert: new FormControl(
                    this.currentUser?.enableNotifications.newCampground,
                    Validators.required
                  ),
                  newCommentAlert: new FormControl(
                    this.currentUser?.enableNotifications.newComment,
                    Validators.required
                  ),
                  newFollowerAlert: new FormControl(
                    this.currentUser?.enableNotifications.newFollower,
                    Validators.required
                  ),
                  newCommentLike: new FormControl(
                    this.currentUser?.enableNotifications.newCommentLike,
                    Validators.required
                  ),
                });

                // Email Preferences Form
                this.emailPrefFormGroup = new FormGroup({
                  systemEmail: new FormControl(
                    this.currentUser?.enableNotificationEmails.system,
                    Validators.required
                  ),
                  newCampgroundEmail: new FormControl(
                    this.currentUser?.enableNotificationEmails.newCampground,
                    Validators.required
                  ),
                  newCommentEmail: new FormControl(
                    this.currentUser?.enableNotificationEmails.newComment,
                    Validators.required
                  ),
                  newFollowerEmail: new FormControl(
                    this.currentUser?.enableNotificationEmails.newFollower,
                    Validators.required
                  ),
                });

                this.emailPrefFormGroup.controls.systemEmail.disable();

                /** User Settings: Form Group Init - Ends */

                this.isLoading = false;
                // console.log('user component', this.currentUser);
              });

            this._userService.getUserActivity(this.currentUserId).subscribe(
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
            this.displayCoUserCampgrounds = [];
            this.displayCurrentUserCampgrounds = [];
            this._userService.redirectToHomePage();
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
      this._userService
        .toggleFollowUser(
          this.displayCoUser.coUserId,
          this.currentUserId,
          isFollow
        )
        .subscribe(
          (result) => {
            this._snackbarService.showSuccess(
              isFollow
                ? `You are now following ${this.displayCoUser.username}!`
                : `You unfollowed ${this.displayCoUser.username}!`
            );

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
  async updateUserData() {
    if (
      !this.basicFormGroup.valid ||
      !this.displayPrefFormGroup.valid ||
      !this.emailPrefFormGroup.valid
    )
      return;

    this.isLoading = true;

    try {
      const userData: UserSettingsUpdate = {
        userId: this.currentUserId,
        firstname: this.basicFormGroup.value.firstname,
        lastname: this.basicFormGroup.value.lastname,
        email: this.basicFormGroup.value.email,
        hideStatsDashboard: this.displayPrefFormGroup.value.hideStatsDashboard,
        enableNotifications: {
          newCampground: this.displayPrefFormGroup.value.newCampgroundAlert,
          newComment: this.displayPrefFormGroup.value.newCommentAlert,
          newFollower: this.displayPrefFormGroup.value.newFollowerAlert,
          newCommentLike: this.displayPrefFormGroup.value.newCommentLike,
        },
        enableNotificationEmails: {
          newCampground: this.emailPrefFormGroup.value.newCampgroundEmail,
          newComment: this.emailPrefFormGroup.value.newCommentEmail,
          newFollower: this.emailPrefFormGroup.value.newFollowerEmail,
        },
      };

      const result = await this._authService.updateUserData(userData);
      this._snackbarService.showSuccess(result);

      this.isLoading = false;
    } catch (error) {
      // console.log('error updating user', error);
      // error updating user data, http interceptor shall snackbar
      this.isLoading = false;
    }
  }

  onUpdateUserAvatar() {
    const changeAvatarDialogRef = this._dialog.open(ImageDialogComponent, {
      width: '250px',
      data: { message: '' },
    });

    changeAvatarDialogRef.afterClosed().subscribe(async (newAvatarLink) => {
      if (newAvatarLink) {
        this.isLoading = true;
        // console.log('avatar update initiated');
        this._authService
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
    const changePasswordDialogRef = this._dialog.open(PasswordDialogComponent, {
      width: '250px',
      data: { userId: this.currentUserId },
    });

    changePasswordDialogRef.afterClosed().subscribe(async (result) => {
      result?.isPasswordUpdated &&
        this._snackbarService.showSuccess(result.message);
    });
  }

  onNotificationClick(notification: Notifications): void {
    /** When user clicks on the notification -
     * 1. update the read flag
     * 2. navigate user to notification type related source
     */
    if (notification) {
      switch (notification.notificationType) {
        case 0: //new campground
        case 1: //new campground comment
          !notification.isRead &&
            this._authService.updateNotification([notification._id], true);
          this._router.navigate([
            '/campgrounds/show/',
            notification.campgroundId,
          ]);
          break;

        case 3: // new follower
          !notification.isRead &&
            this._authService.updateNotification([notification._id], true);
          this._router.navigate(['/user/other', notification.follower.id]);
          break;

        default:
          //unknown, unhandled
          return;
      }
    }
  }

  onNotificationRead(notificationId: string, isSetRead: boolean): void {
    this._authService.updateNotification([notificationId], isSetRead);
  }

  onNotificationDelete(notificationId: string): void {
    this._authService.deleteNotification([notificationId]);
  }

  // https://relevantmagazine.com/wp-content/uploads/2017/05/rambop.jpg
  // 'https://nofilmschool.com/sites/default/files/styles/structured_4x3/public/rambo_0.jpg?itok=7wp3VTDy'
}
