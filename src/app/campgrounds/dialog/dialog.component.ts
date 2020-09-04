/**  02092020 - Gaurav - Dialog for display of Camp properties information */
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

/** Material Snackbar */
import { SnackbarService } from '../../error/snackbar.service';

interface InforArray {
  level: number;
  levelName: string;
  levelDesc: string;
}

interface Courtesy {
  para: string;
  link: string;
  title: string;
}

@Component({
  selector: 'ay-info-dialog',
  templateUrl: './info-dialog.component.html',
  styles: [
    `
      .mat-typography {
        color: rgba(0, 0, 0, 0.7);
      }

      h3 {
        margin-bottom: 0;
      }

      mat-divider {
        margin: 5px auto;
      }

      .courtesy-footer {
        text-align: center;
        margin: 15px 10px auto;
        font-size: 0.75em;
        color: #383a3b;
      }

      .courtesy-footer a {
        color: #383a3b;
        text-decoration: none;
      }

      .courtesy-footer a:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class InfoDialogComponent {
  title: string;
  infoArray: InforArray[];
  courtesy: Courtesy;

  constructor(
    public dialogRef: MatDialogRef<InfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      option?: string;
      dataArray: any;
    }
  ) {
    switch (data.option) {
      case 'bestSeasons':
        this.title = 'Seasons';
        this.infoArray = [
          {
            level: null,
            levelName: 'Ritu',
            levelDesc:
              'A ritu is a season in the traditional Hindu calendar, used in parts of India. There are six ritu: vasanta (spring); grishma (summer); varsha (rainy or monsoon); sharat (autumn); hemant (pre-winter); and shishira (winter).',
          },
          {
            level: null,
            levelName: null,
            levelDesc:
              'Ritu is chosen to be displayed, as season options in this app, because of its number of classifications which includes english calender seasons.',
          },
        ];
        break;

      case 'hikingLevel':
        this.title = 'Hiking Levels';
        this.infoArray = data.dataArray.hikingLevels;

        break;

      case 'fitnessLevel':
        this.title = 'Fitness Levels';
        this.infoArray = data.dataArray.fitnessLevels;

        break;

      case 'trekTechnicalGrade':
        this.title = 'Trek Technical Grades';
        this.infoArray = data.dataArray.trekTechnicalGrades;
        break;

      default:
        return;
    }

    if (data.option === 'bestSeasons') {
      this.courtesy = {
        para: 'Seasons info courtesy: ',
        link: 'https://www.nationalgeographic.org/encyclopedia/season/',
        title: 'National Geographic',
      };
    }

    if (data.option === 'hikingLevel') {
      this.courtesy = {
        para: 'Hiking levels info courtesy: ',
        link:
          'https://www.eurohike.at/en/travel-information/during-the-tour/level-of-hiking',
        title: 'EuroHike',
      };
    }

    if (
      data.option === 'fitnessLevel' ||
      data.option === 'trekTechnicalGrade'
    ) {
      this.courtesy = {
        para: 'Fitness levels and Trek Technical Grades info courtesy: ',
        link: 'https://www.kantoadventures.com/hiking-difficulty-scale.html',
        title: 'Kanto Adventures',
      };
    }
  }
}

import { CampgroundsService } from '../campgrounds.service';

@Component({
  templateUrl: './rating-dialog.component.html',
  styles: [
    `
      .title {
        margin-top: 10px;
        display: flex;
        justify-content: space-between;
      }

      .title-emojis {
        font-size: 1.5rem;
      }

      .icon-close {
        cursor: pointer;
      }

      mat-dialog-content {
        text-align: center;
      }

      .icon-rating {
        cursor: pointer;
        font-size: 2.5rem;
        padding-right: 10px;
        margin: 10px auto;
      }

      .icon-rating:last-of-type {
        padding-right: 0;
      }

      mat-dialog-actions {
        justify-content: center;
      }
    `,
  ],
})
export class RatingDialogComponent implements OnInit {
  isLoading = false;
  campRating = [
    { rating: 1, icon: 'star_outline' },
    { rating: 2, icon: 'star_outline' },
    { rating: 3, icon: 'star_outline' },
    { rating: 4, icon: 'star_outline' },
    { rating: 5, icon: 'star_outline' },
  ];
  currentRating = 0;
  isUpdated = false;

  constructor(
    private _campgroundService: CampgroundsService,
    private _snackbarService: SnackbarService,
    public dialogRef: MatDialogRef<RatingDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      campgroundId: string;
    }
  ) {
    dialogRef.disableClose = true;
  }

  ngOnInit() {
    this.isLoading = true;
    this._campgroundService
      .getUserCampgroundRating(this.data.campgroundId)
      .subscribe(
        (response) => {
          // Set last saved user rating for this camp
          if (response && response.rating > 0) {
            this.currentRating = response.rating;
            this._resetRatingDisplay(response.rating, false);
          }

          this.isLoading = false;
        },
        (error) => {
          this.isLoading = false;
          console.log('Error getting last campground rating', error);

          this._snackbarService.showError(
            'Error getting last campground rating!'
          );
          this.dialogRef.close();
        }
      );
  }

  onChangeRating(rating: number) {
    this._resetRatingDisplay(rating, true);
    this.currentRating = rating;
  }

  onClearRating() {
    this._resetRatingDisplay(0, true);
    this.currentRating = 0;
  }

  onSaveRating() {
    this.isLoading = true;
    this._campgroundService
      .updateCampgroundRating(this.data.campgroundId, this.currentRating)
      .subscribe(
        (response) => {
          this.isLoading = false;
          this._snackbarService.showSuccess('Camground rating updated!');
          this.dialogRef.close(true);
        },
        (error) => {
          this.isLoading = false;
          console.log('Error updating campground rating', error);
          this._snackbarService.showError('Error updating campground rating!');
          this.dialogRef.close(false);
        }
      );
  }

  private _resetRatingDisplay(rating: number, reset: boolean) {
    if (reset) this.campRating.forEach((r) => (r.icon = 'star_outline'));

    // increment .5
    for (let i = 0.5; i <= rating; i += 0.5) {
      if (i > 5) break; //expect rating between 1 - 5

      // if current iteration is whole integer, set full star
      if (Number.isInteger(i)) {
        this.campRating[i - 1].icon = 'star';
      }

      // if current iteration is a decimal and to end of this loop, set half star
      if (!Number.isInteger(i) && i == rating) {
        this.campRating[Math.ceil(i - 1)].icon = 'star_half';
      }
    }
  }
}
