import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Socket } from 'ngx-socket-io';

@Injectable()
export class SocketService {
  constructor(private _socket: Socket) {}

  sendMessage(eventName: string, data: UIChangeBroadcast | ChatMessage) {
    this._socket.emit(eventName, data);
  }

  joinRoom(data: ChatMessage) {
    this._socket.emit('join', data);
  }

  newChatUserJoinedListener = () => {
    return Observable.create((observer) => {
      this._socket.on('new-user-joined', (message) => {
        observer.next(message);
      });
    });
  };

  newChatMessageListener = () => {
    return Observable.create((observer) => {
      this._socket.on('new-chat-message', (message) => {
        observer.next(message);
      });
    });
  };

  chatUserLeftListener = () => {
    return Observable.create((observer) => {
      this._socket.on('chat-user-left', (message) => {
        observer.next(message);
      });
    });
  };

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

  /** Socket error handling */
  onSocketConnectError = () => {
    return Observable.create((observer) => {
      this._socket.on('connect_error', (error) => {
        observer.next('socket connect error');
      });
    });
  };

  onSocketDisconnect = () => {
    return Observable.create((observer) => {
      this._socket.on('disconnect', (error) => {
        observer.next('socket disconnect');
      });
    });
  };
}

export interface ChatMessage {
  msg: string | null;
  roomId: string;
  roomname: string;
  userId: string;
  username: string;
}

export interface UIChangeBroadcast {
  campgroundId: string;
}
