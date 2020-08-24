import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Socket } from 'ngx-socket-io';

@Injectable()
export class SocketService {
  constructor(private _socket: Socket) {}

  sendMessage(eventName: string, msg: any) {
    this._socket.emit(eventName, msg);
  }

  newCommentListener = () => {
    return Observable.create((observer) => {
      this._socket.on('new-comment', (message) => {
        observer.next(message);
      });
    });
  };

  editCommentListener = () => {
    return Observable.create((observer) => {
      this._socket.on('edit-comment', (message) => {
        observer.next(message);
      });
    });
  };

  deleteCommentListener = () => {
    return Observable.create((observer) => {
      this._socket.on('delete-comment', (message) => {
        observer.next(message);
      });
    });
  };

  newCampListener = () => {
    return Observable.create((observer) => {
      this._socket.on('new-campground', (message) => {
        observer.next(message);
      });
    });
  };

  editCampListener = () => {
    return Observable.create((observer) => {
      this._socket.on('edit-campground', (message) => {
        observer.next(message);
      });
    });
  };

  deleteCampListener = () => {
    return Observable.create((observer) => {
      this._socket.on('delete-campground', (message) => {
        observer.next(message);
      });
    });
  };
}
