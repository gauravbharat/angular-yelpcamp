/**  02092020 - Gaurav - Dialog for display of Camp properties information */
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

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
