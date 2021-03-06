import { Component } from '@angular/core';

@Component({
  // templateUrl: './pagenotfound.component.html',
  template: `
    <app-header></app-header>
    <div>
      <img
        class="image"
        src="/assets/images/404-page-not-found.jpg"
        alt="page not found"
      />
      <a href="https://www.freepik.com/vectors/business"
        >Business vector created by pikisuperstar - www.freepik.com</a
      >
    </div>
  `,
  styleUrls: ['./pagenotfound.component.css'],
})
export class PageNotFoundComponent {
  imagePath = '../../assets/images/404-page-not-found.jpg';
}
