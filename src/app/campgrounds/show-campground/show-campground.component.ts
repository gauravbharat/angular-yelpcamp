import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgForm } from '@angular/forms';
import * as moment from 'moment';
import { MatAccordion, MatExpansionPanel } from '@angular/material/expansion';

import { AuthService } from '../../auth/auth.service';
import { CampgroundsService } from '../campgrounds.service';
import { CommentsService } from '../comments.service';
import { SocketService } from '../../socket.service';

import { Campground } from '../campground.model';

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

  private _newCommentSub$: Subscription;
  private _editCommentSub$: Subscription;
  private _deleteCommentSub$: Subscription;

  constructor(
    private authService: AuthService,
    private campgroundsService: CampgroundsService,
    private route: ActivatedRoute,
    private commentsService: CommentsService,
    private _socketService: SocketService
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

        /** 24082020 - Gaurav - Earlier, on Init, I was getting the fetched data from the campground service
         * for the campground with pre-populated comments. This data came from the campgrounds list
         * stored on the service.
         *
         * Now, with the addition of websocket to listen for new comments, either the whole campgrounds list
         * needs to be updated or just the campground from the list needs a refresh of its stored comments array.
         * Either way, it needed a request to the server, and more complexity to the code for the OR part above.
         *
         * Better way was to -
         * 1. Fetch campgound data from server, on Init, and each time a new comment is notified
         * 2. Remove the populate('comments') for the campground list fetch, and keep is just for individual camp fetch
         */
        this._getCampgroundFromServer();
      }
    });

    /** 24082020 - Subscribe to new/edit/delete comment socket observables */
    this._newCommentSub$ = this._socketService.newCommentListener().subscribe(
      (response) => {
        if (response.campgroundId === this.campgroundId) {
          this._getCampgroundFromServer();
        }
      },
      (error) => {
        console.log('socketService newCommentListener error', error);
      }
    );

    this._editCommentSub$ = this._socketService.editCommentListener().subscribe(
      (response) => {
        if (response.campgroundId === this.campgroundId) {
          this._getCampgroundFromServer();
        }
      },
      (error) => {
        console.log('socketService editCommentListener error', error);
      }
    );

    this._deleteCommentSub$ = this._socketService
      .deleteCommentListener()
      .subscribe(
        (response) => {
          if (response.campgroundId === this.campgroundId) {
            this._getCampgroundFromServer();
          }
        },
        (error) => {
          console.log('socketService deleteCommentListener error', error);
        }
      );
  }

  ngOnDestroy() {
    // unsubscribe from services subscribed to in ngOnInit()
    this.authStatusSub$.unsubscribe();
    this.campListFromServiceSub$?.unsubscribe();
    this.getCampFromServerSub$?.unsubscribe();

    this._newCommentSub$?.unsubscribe();
    this._editCommentSub$?.unsubscribe();
    this._deleteCommentSub$?.unsubscribe();
  }

  onDelete(id: string) {
    this.campgroundsService.deleteCampground(id);
  }

  getLastEdited(editedDate: string): string {
    return moment(editedDate).fromNow();
  }

  onNewCommentSubmit(form: NgForm, mep: MatExpansionPanel): void {
    this.isLoading = true;
    /** Broadcast new comment */
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

          /** Notify new comment */
          this._socketService.sendMessage('new-comment', {
            campgroundId: this.campgroundId,
          });
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
            /** Notify edit comment */
            this._socketService.sendMessage('edit-comment', {
              campgroundId: this.campgroundId,
            });
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
          /** Notify delete comment */
          this._socketService.sendMessage('delete-comment', {
            campgroundId: this.campgroundId,
          });
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
