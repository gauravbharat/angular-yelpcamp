import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import * as moment from 'moment';

import { MatAccordion, MatExpansionPanel } from '@angular/material/expansion';

import { AuthService } from '../../auth/auth.service';
import { CampgroundsService } from '../campgrounds.service';
import { CommentsService } from '../comments.service';
import { Campground } from '../campground.model';
import { Subscription } from 'rxjs';
import { NgForm } from '@angular/forms';

@Component({
  templateUrl: './show-campground.component.html',
  styleUrls: ['./show-campground.component.css'],
})
export class ShowCampgroundComponent implements OnInit, OnDestroy {
  isUserAuthenticated = false;
  isLoading = false;
  userId: string;
  username: string;
  userAvatar: string;
  private campgroundId: string;
  campground: Campground;

  addCommentOpenState = false;
  newComment: string;

  accordionExpanded = false;
  @ViewChild(MatAccordion) accordion: MatAccordion;

  private campListFromServiceSub$: Subscription;
  private getCampFromServerSub$: Subscription;
  private authStatusSub$: Subscription;

  constructor(
    private authService: AuthService,
    private campgroundsService: CampgroundsService,
    private route: ActivatedRoute,
    private commentsService: CommentsService
  ) {}

  ngOnInit() {
    this.isLoading = true;

    this.authStatusSub$ = this.authService
      .getAuthStatusListener()
      .subscribe((authStatus) => {
        this.isUserAuthenticated = authStatus.isUserAuthenticated;
        this.userId = authStatus.userId;
        this.username = authStatus.username;
        this.userAvatar = authStatus.userAvatar;
      });

    // Get the campground id passed as paramter
    this.route.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has('campgroundId')) {
        this.campgroundId = paramMap.get('campgroundId');

        // console.log(this.campgroundId);

        this._getCampgroundFromService();

        // If User refreshed the page or any other reason, fetch from database
        if (!this.campground) {
          this._getCampgroundFromServer();
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

  getLastEdited(editedDate: string): string {
    return moment(editedDate).fromNow();
  }

  onNewCommentSubmit(form: NgForm, mep: MatExpansionPanel): void {
    this.isLoading = true;
    this.commentsService
      .createComment(
        this.campground._id,
        this.newComment,
        this.userId,
        this.username,
        this.userAvatar
      )
      .subscribe(
        (response) => {
          // console.log('create comment', response);
          this.newComment = '';
          this.addCommentOpenState = false;
          form.resetForm();
          mep.close();
          this._getCampgroundFromServer();
        },
        (error) => {
          console.log('create comment', error);
        }
      );
  }

  toggleEditButton(elementRef: ElementRef): void {
    const currentButtonLabel = elementRef.nativeElement.innerText;
    const currentInnerHTML = elementRef.nativeElement.innerHTML;

    if (currentButtonLabel === 'edit_task') {
      elementRef.nativeElement.innerHTML = currentInnerHTML.replace(
        'edit_task',
        'save_task'
      );
    } else {
      elementRef.nativeElement.innerHTML = currentInnerHTML.replace(
        'save_task',
        'edit_task'
      );
    }
  }

  onCommentEdit(elementRef: ElementRef, commentId: string, text: string): void {
    const currentButtonLabel = elementRef.nativeElement.innerText;
    this.toggleEditButton(elementRef);

    if (commentId && text && currentButtonLabel === 'save_task') {
      this.isLoading = true;
      this.commentsService
        .editComment(commentId, this.campgroundId, this.userId, text)
        .subscribe(
          (result) => {
            console.log('comment edit successfully', result);
            // Although the UI is latest with the user updated comment
            // Fetch the campground record to refresh for any new comments from others users
            this._getCampgroundFromServer();
          },
          (error) => {
            console.log('edit comment', error);
          }
        );
    }
  }

  onCommentDelete(commentId: string): void {
    this.isLoading = true;
    this.commentsService
      .deleteComment(commentId, this.campgroundId, this.userId)
      .subscribe(
        (result) => {
          this._getCampgroundFromServer();
        },
        (error) => {
          console.log('delete comment', error);
        }
      );
  }

  trackByMethod(index: number, el: any): number {
    return el._id;
  }

  onAccordionToggle(expand: boolean): void {
    this.accordionExpanded = expand;
    if (expand) {
      this.accordion.openAll();
    } else {
      this.accordion.closeAll();
    }
  }

  private _getCampgroundFromService() {
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
  }

  private _getCampgroundFromServer() {
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
