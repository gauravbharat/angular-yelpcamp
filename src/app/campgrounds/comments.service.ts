import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';

const BACKEND_URL = `${environment.apiUrl}/campgrounds`;

@Injectable({ providedIn: 'root' })
export class CommentsService {
  constructor(private http: HttpClient) {}

  createComment(
    campgroundId: string,
    text: string,
    userId: string,
    username: string,
    userAvatar: string
  ) {
    return this.http.post<{ message: string }>(
      `${BACKEND_URL}/${campgroundId}/comments/new`,
      { text, userId, username, userAvatar }
    );
  }

  editComment(
    commentId: string,
    campgroundId: string,
    userId: string,
    text: string
  ) {
    return this.http.put<{ message: string }>(
      `${BACKEND_URL}/${campgroundId}/comments/${commentId}`,
      { userId, text }
    );
  }

  deleteComment(commentId: string, campgroundId: string, userId: string) {
    return this.http.delete<{ message: string }>(
      `${BACKEND_URL}/${campgroundId}/comments/${userId}/${commentId}`
    );
  }
}
