import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ViewChildren,
  QueryList,
  AfterViewChecked,
} from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgForm } from '@angular/forms';
import * as moment from 'moment';
import * as Filter from 'bad-words';
import { MatAccordion, MatExpansionPanel } from '@angular/material/expansion';

import { AuthService } from '../../auth/auth.service';
import { CampgroundsService } from '../campgrounds.service';
import { CommentsService } from '../comments.service';
import { SocketService, ChatMessage } from '../../socket.service';

/** Material Dialog */
import { MatDialog } from '@angular/material/dialog';
import {
  InfoDialogComponent,
  RatingDialogComponent,
} from '../dialog/dialog.component';

/** Material Snackbar */
import { SnackbarService } from '../../error/snackbar.service';

import { environment } from '../../../environments/environment';

import {
  Campground,
  CampLevelsData,
  RatingCountUsers,
  CampRatingDisplay,
} from '../campground.model';

interface ChatMessageList {
  chatId: number;
  chatMessage: ChatMessage;
  messageType: number;
  postDate: Date;
}

@Component({
  templateUrl: './show-campground.component.html',
  styleUrls: ['./show-campground.component.css'],
})
export class ShowCampgroundComponent
  implements OnInit, OnDestroy, AfterViewChecked {
  isGraphQLAPI = environment.useApi === 'GRAPHQL';
  isUserAuthenticated = false;
  isLoading = false;
  isCommentTriggered = false;
  userId: string;
  username: string;
  userAvatar: string;
  private campgroundId: string;
  campground: Campground;
  bestSeasonsText: string;
  countryNameRearranged = '';
  campLevelsData: CampLevelsData;
  campRating: CampRatingDisplay[];
  ratingData: RatingCountUsers;

  addCommentOpenState = false;
  newComment: string;

  private _filter = new Filter();

  /** Live chat feature variables */
  campChatOpenState = false;
  isUserJoinedChatRoom = false;
  newChatText: string;
  readonly messageType = {
    NEW_USER_JOINED: 1,
    NEW_CHAT_MESSAGE: 2,
    USER_LEFT_CHAT: 3,
  };
  chatMessageList: ChatMessageList[] = [];
  private _scrollToChat = false;
  @ViewChild('mepCampChat') mepCampChat: MatExpansionPanel;
  @ViewChild('chatDisplay') chatDisplayDiv: ElementRef;
  @ViewChildren('chatList') chatLi: QueryList<ElementRef>;

  accordionExpanded = false;
  @ViewChild(MatAccordion) accordion: MatAccordion;

  private campListFromServiceSub$: Subscription;
  private getCampFromServerSub$: Subscription;
  private authStatusSub$: Subscription;

  private _newCommentSub$: Subscription;
  private _editCommentSub$: Subscription;
  private _deleteCommentSub$: Subscription;

  private _newChatComment$: Subscription;
  private _newChatUserJoined$: Subscription;
  private _chatUserLeft$: Subscription;
  private _socketDisconnect$: Subscription;

  constructor(
    private _authService: AuthService,
    private _campgroundsService: CampgroundsService,
    private _route: ActivatedRoute,
    private _commentsService: CommentsService,
    private _socketService: SocketService,
    private _snackbarService: SnackbarService,
    private _dialog: MatDialog
  ) {}

  ngOnInit() {
    this.isLoading = true;

    /** Profanity Filter on campground comments. Add some local cuss words to filter */
    const newBadWords = [
      'madarchod',
      'bhenchod',
      'benchod',
      'gandu',
      'bhosdike',
      'bosedike',
    ];
    this._filter.addWords(...newBadWords);

    this.authStatusSub$ = this._authService
      .getAuthStatusListener()
      .subscribe((authStatus) => {
        this.isUserAuthenticated = authStatus.isUserAuthenticated;
        this.userId = authStatus.userId;
        this.username = authStatus.username;
        this.userAvatar = authStatus.userAvatar;
      });

    this._campgroundsService.getCampLevelsData().subscribe(
      (
        r:
          | { message: string; campLevelsData: CampLevelsData }
          | { campLevelsData: CampLevelsData }
      ) => {
        this.campLevelsData = r.campLevelsData;
      },
      (error) => {}
    );

    // Get the campground id passed as paramter
    this._route.paramMap.subscribe((paramMap: ParamMap) => {
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

    /** Socket listeners - Starts */
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

    /** Live-chat socket listeners */
    this._newChatUserJoined$ = this._socketService
      .newChatUserJoinedListener()
      .subscribe(
        (response) => {
          // console.log(response);
          /** Get chat messages only when user has the chat panel open */
          if (this.campChatOpenState) {
            const user =
              response.userId === this.userId ? 'You' : response.username;
            response.msg = `${user} joined chat room ${response.roomname}`;

            const chatId =
              this.chatMessageList.length > 0
                ? this.chatMessageList[this.chatMessageList.length - 1].chatId +
                  1
                : 1;

            this.chatMessageList.push({
              chatId,
              chatMessage: { ...response },
              messageType: this.messageType.NEW_USER_JOINED,
              postDate: new Date(),
            });

            const scrollHeight = this.chatDisplayDiv?.nativeElement
              .scrollHeight;
            const clientHeight = this.chatDisplayDiv?.nativeElement
              .clientHeight;
            this._scrollToChat = !!(scrollHeight - clientHeight);
          }
        },
        (error) => {
          // do nothing
        }
      );

    this._newChatComment$ = this._socketService
      .newChatMessageListener()
      .subscribe(
        (response) => {
          /** Get chat messages only when user has the chat panel open */
          if (this.campChatOpenState) {
            const user =
              response.userId === this.userId ? 'You' : response.username;

            response.msg = `${user}: ${response.msg} `;

            const chatId =
              this.chatMessageList.length > 0
                ? this.chatMessageList[this.chatMessageList.length - 1].chatId +
                  1
                : 1;

            this.chatMessageList.push({
              chatId,
              chatMessage: { ...response },
              messageType: this.messageType.NEW_CHAT_MESSAGE,
              postDate: new Date(),
            });

            const scrollHeight = this.chatDisplayDiv?.nativeElement
              .scrollHeight;
            const clientHeight = this.chatDisplayDiv?.nativeElement
              .clientHeight;
            this._scrollToChat = !!(scrollHeight - clientHeight);
          }
        },
        (error) => console.log(error)
      );

    this._chatUserLeft$ = this._socketService.chatUserLeftListener().subscribe(
      (response) => {
        // console.log(response);
        /** Get chat messages only when user has the chat panel open
         * User left message is expected to be received by all chat participants, except the one left
         */
        if (this.campChatOpenState) {
          const chatId =
            this.chatMessageList.length > 0
              ? this.chatMessageList[this.chatMessageList.length - 1].chatId + 1
              : 1;

          this.chatMessageList.push({
            chatId,
            chatMessage: { ...response },
            messageType: this.messageType.USER_LEFT_CHAT,
            postDate: new Date(),
          });

          const scrollHeight = this.chatDisplayDiv?.nativeElement.scrollHeight;
          const clientHeight = this.chatDisplayDiv?.nativeElement.clientHeight;
          this._scrollToChat = !!(scrollHeight - clientHeight);
        }
      },
      (error) => {
        // do nothing
      }
    );
    /** Live-chat socket listeners - Ends */

    this._socketDisconnect$ = this._socketService
      .onSocketDisconnect()
      .subscribe((response) => {
        /** If open, close chat expansion panel and give error 'snackbar' to user */
        if (this.campChatOpenState) {
          this.mepCampChat?.close();

          this._snackbarService.showError(
            'There seems to be a server error or restart which resulted in disconnect of live-chat. Please try joining the live-chat after some time.'
          );
        }
      });
    /** Socket listeners - Ends */
  }

  ngAfterViewChecked() {
    /** The code to scroll below did not work in OnInit, AfterContextInit and AfterViewInit where
     * it was executed only once. It did not work even after calling this in socket listeners.
     *
     * Since this method was called multiple times, an appropriate location needs to be found to
     * trigger the code below.
     */
    /** If chat panel is open, scroll to recent chat message if scrollbar is past its height */
    if (this.campChatOpenState && this._scrollToChat) {
      this.chatLi?.last?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
      this._scrollToChat = false;
    }
  }

  ngOnDestroy() {
    // unsubscribe from services subscribed to in ngOnInit()
    this.authStatusSub$.unsubscribe();
    this.campListFromServiceSub$?.unsubscribe();
    this.getCampFromServerSub$?.unsubscribe();

    this._newCommentSub$?.unsubscribe();
    this._editCommentSub$?.unsubscribe();
    this._deleteCommentSub$?.unsubscribe();

    this._newChatComment$?.unsubscribe();
    this._newChatUserJoined$?.unsubscribe();
    this._chatUserLeft$?.unsubscribe();
    this._socketDisconnect$?.unsubscribe;
  }

  onDelete(id: string) {
    this._campgroundsService.deleteCampground(id);
  }

  getLastEdited(editedDate: string): string {
    return moment(editedDate).fromNow();
  }

  onNewCommentSubmit(form: NgForm, mep: MatExpansionPanel): void {
    if (this._isProfane(this.newComment)) return;

    //Removed this.isLoading = true, cause page flickers due to ngIfs
    this.isCommentTriggered = true;
    this._commentsService
      .createComment(
        this.campground._id,
        this.newComment,
        this.userId,
        this.username,
        this.userAvatar
      )
      .subscribe(
        (response) => {
          this.isCommentTriggered = false;

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
          this.isCommentTriggered = false;
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
    if (this._isProfane(text)) return;

    const currentButtonLabel = elementRef.nativeElement.innerText;
    this.toggleEditButton(elementRef);

    if (commentId && text && currentButtonLabel === 'save_task') {
      //Removed this.isLoading = true, cause page flickers due to ngIfs
      this.isCommentTriggered = true;
      this._commentsService
        .editComment(commentId, this.campgroundId, this.userId, text)
        .subscribe(
          (result) => {
            this.isCommentTriggered = false;
            /** Notify edit comment */
            this._socketService.sendMessage('edit-comment', {
              campgroundId: this.campgroundId,
            });
          },
          (error) => {
            this.isCommentTriggered = false;
            console.log('edit comment', error);
          }
        );
    }
  }

  onCommentDelete(commentId: string): void {
    //Removed this.isLoading = true, cause page flickers due to ngIfs
    this.isCommentTriggered = true;
    this._commentsService
      .deleteComment(commentId, this.campgroundId, this.userId)
      .subscribe(
        (result) => {
          /** Notify delete comment */
          this._socketService.sendMessage('delete-comment', {
            campgroundId: this.campgroundId,
          });

          this.isCommentTriggered = false;
        },
        (error) => {
          this.isCommentTriggered = false;
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

  /** Live-chat methods */
  onChatJoin() {
    this.campChatOpenState = true;

    this.campChatOpenState &&
      this._socketService.joinRoom({
        msg: null,
        roomId: this.campgroundId,
        roomname: this.campground.name,
        userId: this.userId,
        username: this.username,
      });
  }

  onChatLeave() {
    this.campChatOpenState = false;

    !this.campChatOpenState &&
      (this.chatMessageList = []) &&
      this._socketService.sendMessage('chat-user-left', {
        msg: `${this.username} left chat room ${this.campground.name}`,
        roomId: this.campgroundId,
        roomname: this.campground.name,
        userId: this.userId,
        username: this.username,
      });
  }

  onChatSubmit() {
    this._socketService.sendMessage('new-chat-message', {
      msg: this.newChatText,
      roomId: this.campgroundId,
      roomname: this.campground.name,
      userId: this.userId,
      username: this.username,
    });

    this.newChatText = '';
  }
  /** Live-chat methods - Ends */

  /** Comment Like methods */
  onCommentLike(commentId: string, commentIndex: number) {
    //Removed this.isLoading = true, cause page flickers due to ngIfs
    this._commentsService
      .likeComment(commentId, this.campgroundId, this.userAvatar)
      .subscribe(
        (response) => {
          if (
            this.campground.comments[commentIndex].likes.findIndex(
              (like) => like.id === this.userId
            ) !== -1
          ) {
            this.campground.comments[
              commentIndex
            ].likes = this.campground.comments[commentIndex].likes.filter(
              (like) => like.id !== this.userId
            );
          } else {
            this.campground.comments[commentIndex].likes.push({
              id: this.userId,
              username: this.username,
              avatar: this.userAvatar,
            });
          }
          this.isLoading = false;
        },
        (error) => {
          // do nothing, trust error interceptor
          this.isLoading = false;
        }
      );
  }

  getLikeUsersList(commentId: string, commentIndex: number) {
    if (commentId) {
      if (
        this.campground.comments[commentIndex]?.likes &&
        this.campground.comments[commentIndex]?.likes.length > 0
      ) {
        return this.campground.comments[commentIndex].likes
          .map((like, index, arr) => {
            if (index < 9) {
              return like.username;
            } else if (index === 9) {
              return `and ${arr.length - 9} other${arr.length > 10 ? 's' : ''}`;
            }
          })
          .join('\n');
      }
    }
  }

  getLikeUsersPreview(commentId: string, commentIndex: number) {
    if (commentId) {
      if (
        this.campground.comments[commentIndex]?.likes &&
        this.campground.comments[commentIndex]?.likes.length > 0
      ) {
        const totalLikes = this.campground.comments[commentIndex].likes.length;

        switch (totalLikes) {
          case 1:
            return `${this.campground.comments[commentIndex].likes[0].username}`;
          case 2:
            return `${this.campground.comments[commentIndex].likes[0].username} and ${this.campground.comments[commentIndex].likes[1].username}`;

          default:
            return `${
              this.campground.comments[commentIndex].likes[0].username
            }, ${
              this.campground.comments[commentIndex].likes[1].username
            } and ${totalLikes - 2} other${totalLikes > 3 ? 's' : ''}`;
        }
      }
    }
  }
  /** Comment Like methods - Ends */

  onOpenDialog(option: string) {
    if (this.campLevelsData) {
      this._dialog.open(InfoDialogComponent, {
        width: '250px',
        data: { option, dataArray: this.campLevelsData },
      });
    }
  }

  onRateCampground() {
    /** 14102020 - Gaurav - GraphQL: TODO => send token to RatingDialogComponent and then to
     * getUserCampgroundRating call to validate the logged in user.
     * There doesn't seem to be a way to send the header along with an apollo client query
     * and has to be provided in the graphql module at init
     */
    console.log('this._authService.getToken()', this._authService.getToken());

    const ratingDialogRef = this._dialog.open(RatingDialogComponent, {
      data: { campgroundId: this.campgroundId },
      width: '250px',
    });

    ratingDialogRef.afterClosed().subscribe((response) => {
      if (response) {
        // Refresh campground page data
        this._getCampgroundFromServer();
      }
    });
  }

  getCampgroundRatersList() {
    if (this.ratingData && this.ratingData.ratedBy.length > 0) {
      return this.ratingData.ratedBy
        .map((username, index, arr) => {
          if (index < 9) {
            return username;
          } else if (index === 9) {
            return `and ${arr.length - 9} other${arr.length > 10 ? 's' : ''}`;
          }
        })
        .join('\n');
    }
  }

  private _isProfane(text: string) {
    if (this._filter.isProfane(text)) {
      this._snackbarService.showError('Profanity is not allowed!');
      return true;
    }

    return false;
  }

  private _getCampgroundFromServer() {
    this.getCampFromServerSub$ = this._campgroundsService
      .getCampground(this.campgroundId)
      .subscribe(
        (response) => {
          this.campground = response.campground;
          this.ratingData = response.ratingData;

          // console.log('campground daata from database', this.campground);

          // Init rating stars
          this.campRating = [
            { rating: 1, icon: 'star_outline' },
            { rating: 2, icon: 'star_outline' },
            { rating: 3, icon: 'star_outline' },
            { rating: 4, icon: 'star_outline' },
            { rating: 5, icon: 'star_outline' },
          ];

          // display stars per rating, taking care of half_stars
          if (this.campground.rating > 0) {
            // increment .5
            for (let i = 0.5; i <= this.campground.rating; i += 0.5) {
              if (i > 5) break; //expect rating between 1 - 5

              // if current iteration is whole integer, set full star
              if (Number.isInteger(i)) {
                this.campRating[i - 1].icon = 'star';
              }

              // if current iteration is a decimal and to end of this loop, set half star
              if (!Number.isInteger(i) && i == this.campground.rating) {
                this.campRating[Math.ceil(i - 1)].icon = 'star_half';
              }
            }
          }

          if (this.campground?.bestSeasons) {
            let seasons = Object.entries(this.campground.bestSeasons);
            this.bestSeasonsText = '';
            for (let [index, [key, value]] of seasons.entries()) {
              if (value) {
                switch (key) {
                  case 'vasanta':
                    this.bestSeasonsText += 'Vasanta(Spring) ';
                    break;
                  case 'grishma':
                    this.bestSeasonsText += 'Grishma(Summer) ';
                    break;
                  case 'varsha':
                    this.bestSeasonsText += 'Varsha(Monsoon) ';
                    break;
                  case 'sharat':
                    this.bestSeasonsText += 'Sharat(Autumn) ';
                    break;
                  case 'hemant':
                    this.bestSeasonsText += 'Hemant(Pre-Winter) ';
                    break;
                  case 'shishira':
                    this.bestSeasonsText += 'Shishira(Winter) ';
                    break;
                  default:
                  //
                }
              }
            }

            this.bestSeasonsText = this.bestSeasonsText.trim();
            this.bestSeasonsText = this.bestSeasonsText.replace(/ /g, ', ');
          }

          const splitCountryName = this.campground?.country?.Country_Name?.split(
            ','
          );

          if (Array.isArray(splitCountryName) && splitCountryName.length > 0) {
            if (splitCountryName.length > 1) {
              for (let i = splitCountryName.length - 1; i >= 0; i--) {
                this.countryNameRearranged += splitCountryName[i] + ' ';
              }
            } else {
              this.countryNameRearranged = splitCountryName[0];
            }
          }

          this.countryNameRearranged = this.countryNameRearranged.trim();

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
          this._campgroundsService.redirectToCampgrounds();
        }
      );
  }
}
