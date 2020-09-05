import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Location } from '@angular/common';

import { MatDialog } from '@angular/material/dialog';
import { InfoDialogComponent } from '../dialog/dialog.component';

import {
  Campground,
  AmenityList,
  AmenityGroups,
  CampStaticData,
  BestSeasonsModel,
  HikingLevels,
  FitnessLevels,
  TrekTechnicalGrades,
} from '../campground.model';
import { mimeType } from '../../utils/mime-type.validator';
import { CampgroundsService } from '../campgrounds.service';
import { SocketService } from '../../socket.service';

@Component({
  selector: 'app-campground-create',
  templateUrl: './campground-create.component.html',
  styleUrls: ['./campground-create.component.css'],
})
export class CampgroundCreateComponent implements OnInit {
  private mode = 'create';
  private campgroundId: string;
  campground: Campground;
  formTitle = 'Create a New Campground';

  /** UI related vars */
  isLoading = false;
  formBasicGroup = new FormGroup({});
  formLocationGroup = new FormGroup({});
  formAmenitiesGroup = new FormGroup({});
  displayImageName: string;
  imagePreview: string;

  amenitiesGroup: AmenityGroups[];
  private savedAmenities: AmenityList[];
  campStaticData: CampStaticData;

  selectedHikingLevel: HikingLevels;
  selectedFitnessLevel: FitnessLevels;
  selectedTrekGrade: TrekTechnicalGrades;

  /** Dependency Injection: Inject -
   * Campground Service
   * ActivatedRouter to get the current active _route params, iff campgroundId is present
   */
  constructor(
    private _campgroundsService: CampgroundsService,
    private _route: ActivatedRoute,
    private _socketService: SocketService,
    private _dialog: MatDialog,
    private _router: Router,
    private _location: Location
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this._campgroundsService.getAllStaticData().subscribe(
      async (r: { message: string; campStaticData: CampStaticData }) => {
        this.campStaticData = r.campStaticData;

        // console.log('campStaticData', this.campStaticData);

        const uniqueGroups = [
          ...new Set(
            this.campStaticData.amenitiesList.map((amenity) => amenity.group)
          ),
        ];

        this.amenitiesGroup = []; //reset

        for (const group of uniqueGroups) {
          await this.amenitiesGroup.push({
            group,
            amenity: this.campStaticData.amenitiesList.filter(
              (amenity) => amenity.group === group
            ),
          });
        }

        this.formBasicGroup = new FormGroup({
          campgroundName: new FormControl(
            { value: null, disabled: false },
            {
              validators: [
                Validators.required,
                Validators.minLength(6),
                Validators.maxLength(30),
              ],
            }
          ),
          campgroundPrice: new FormControl({ value: null, disabled: false }),
          campgroundImage: new FormControl(
            { value: null, disabled: false },
            {
              validators: [Validators.required],
              asyncValidators: [mimeType],
            }
          ),
          campgroundDescription: new FormControl(
            { value: null, disabled: false },
            {
              validators: [Validators.required],
            }
          ),
        });

        this.formLocationGroup = new FormGroup({
          campgroundLocation: new FormControl(
            { value: null, disabled: false },
            {
              validators: [Validators.required],
            }
          ),
          campgroundCountryData: new FormControl(
            {
              value: null,
              disabled: false,
            },
            {
              validators: [Validators.required],
            }
          ),
          bestSeasons: new FormArray([
            new FormControl(false),
            new FormControl(false),
            new FormControl(false),
            new FormControl(false),
            new FormControl(false),
            new FormControl(false),
          ]),
          hikingLevel: new FormControl(null),
          fitnessLevel: new FormControl(null),
          trekTechnicalGrade: new FormControl(null),
        });

        this.formAmenitiesGroup = new FormGroup({
          campgroundAmenities: new FormControl(),
        });

        this._route.paramMap.subscribe((paramMap: ParamMap) => {
          if (paramMap.has('campgroundId')) {
            this.mode = 'edit';
            this.formTitle = 'Edit Campground';
            this.campgroundId = paramMap.get('campgroundId');
            this.isLoading = true;

            this._campgroundsService.getCampground(this.campgroundId).subscribe(
              (response) => {
                // stop spinner
                this.isLoading = false;

                // load data in local variable
                this.campground = {
                  _id: response.campground._id,
                  name: response.campground.name,
                  price: response.campground.price,
                  image: response.campground.image,
                  location: response.campground.location,
                  description: response.campground.description,
                  country: response.campground.country,
                  bestSeasons: response.campground.bestSeasons,
                  hikingLevel: response.campground.hikingLevel,
                  fitnessLevel: response.campground.fitnessLevel,
                  trekTechnicalGrade: response.campground.trekTechnicalGrade,
                };

                this.savedAmenities = response.campground.amenities;
                this.displayImageName = this.campground.image;

                // load data onto form elements
                this.formBasicGroup.setValue({
                  campgroundName: this.campground.name,
                  campgroundPrice: this.campground.price,
                  campgroundImage: this.campground.image,
                  campgroundDescription: this.campground.description,
                });

                let bestSeasons = [false, false, false, false, false, false];
                if (this.campground.bestSeasons) {
                  bestSeasons = Object.values(this.campground.bestSeasons).map(
                    (value) => value
                  );
                }

                let hikingLevel = null;
                let fitnessLevel = null;
                let trekTechnicalGrade = null;
                let country = null;

                /** Duh! Object comparison. Get it from campStaticData!! */
                if (this.campground.hikingLevel) {
                  hikingLevel = this.campStaticData.hikingLevels.find(
                    (hikingLevel) =>
                      hikingLevel.level === this.campground.hikingLevel.level
                  );
                }

                if (this.campground.fitnessLevel) {
                  fitnessLevel = this.campStaticData.fitnessLevels.find(
                    (fitnessLevel) =>
                      fitnessLevel.level === this.campground.fitnessLevel.level
                  );
                }

                if (this.campground.trekTechnicalGrade) {
                  trekTechnicalGrade = this.campStaticData.trekTechnicalGrades.find(
                    (trekTechnicalGrade) =>
                      trekTechnicalGrade.level ===
                      this.campground.trekTechnicalGrade.level
                  );
                }

                if (this.campground?.country) {
                  country = this.campStaticData.countriesList.find(
                    (item) => item._id === this.campground.country.id
                  );
                }

                this.formLocationGroup.setValue({
                  campgroundLocation: this.campground.location,
                  campgroundCountryData: country ? country : null,
                  bestSeasons,
                  hikingLevel: hikingLevel ? hikingLevel : null,
                  fitnessLevel: fitnessLevel ? fitnessLevel : null,
                  trekTechnicalGrade: trekTechnicalGrade
                    ? trekTechnicalGrade
                    : null,
                });

                this.formAmenitiesGroup.setValue({
                  campgroundAmenities: this.savedAmenities
                    ? this.savedAmenities.map((amenity) => {
                        return amenity._id;
                      })
                    : [],
                });
              },
              (error) => {
                this.isLoading = false;
                // console.log(error);
                this._campgroundsService.redirectToCampgrounds();
              }
            );
          } else {
            this.mode = 'create';
            this.formTitle = 'Create a New Campground';
            this.campgroundId = null;
            this.displayImageName = null;
            this.isLoading = false;
          }
        });
      },
      (error) => {
        console.log('Error getting Campground Static entry data list!', error);
      }
    );
  }

  async onFormSubmit() {
    if (
      this.formBasicGroup.invalid ||
      this.formLocationGroup.invalid ||
      this.formAmenitiesGroup.invalid
    )
      return;

    // console.log('passed form validation!');

    /** IMPORTANT! Before programmatically disabling the reactive form controls,
     * store form control values in local varaibles or the form control values would
     * return UNDEFINED
     */
    const name = this.formBasicGroup.value.campgroundName;
    const price = this.formBasicGroup.value.campgroundPrice;
    const image = this.formBasicGroup.value.campgroundImage;
    const description = this.formBasicGroup.value.campgroundDescription;
    const location = this.formLocationGroup.value.campgroundLocation;
    const amenities = this.formAmenitiesGroup.value.campgroundAmenities;
    const hikingLevel = this.formLocationGroup.value.hikingLevel;
    const fitnessLevel = this.formLocationGroup.value.fitnessLevel;
    const trekTechnicalGrade = this.formLocationGroup.value.trekTechnicalGrade;

    const bestSeasons: BestSeasonsModel = {
      vasanta: false,
      grishma: false,
      varsha: false,
      sharat: false,
      hemant: false,
      shishira: false,
    };

    let i = 0;
    for (let key in bestSeasons) {
      bestSeasons[key] = this.formLocationGroup.value.bestSeasons[i];
      i++;
    }

    const country = {
      id: this.formLocationGroup.value.campgroundCountryData._id,
      Continent_Name: this.formLocationGroup.value.campgroundCountryData
        .Continent_Name,
      Country_Name: this.formLocationGroup.value.campgroundCountryData
        .Country_Name,
      Two_Letter_Country_Code: this.formLocationGroup.value
        .campgroundCountryData.Two_Letter_Country_Code,
    };

    this.isLoading = true;

    if (this.mode === 'create') {
      this._campgroundsService
        .createCampground(
          name,
          price,
          description,
          location,
          image,
          amenities,
          country,
          bestSeasons,
          hikingLevel,
          fitnessLevel,
          trekTechnicalGrade
        )
        .subscribe(
          (result) => {
            this.formBasicGroup.reset();
            this.formLocationGroup.reset();
            this.formAmenitiesGroup.reset();
            // console.log('success creating campground', result);

            /** Notifiy new campground */
            this._socketService.sendMessage('new-campground', {
              campgroundId: result.campgroundId,
            });

            this._campgroundsService.redirectToCampgrounds();
          },
          (error) => {
            this.isLoading = false;
            console.log('error creating campground', error);
          }
        );
    } else {
      this._campgroundsService
        .updateCampground(
          this.campgroundId,
          name,
          price,
          description,
          location,
          image,
          amenities,
          country,
          bestSeasons,
          hikingLevel,
          fitnessLevel,
          trekTechnicalGrade
        )
        .subscribe(
          (response) => {
            this.formBasicGroup.reset();
            this.formLocationGroup.reset();
            this.formAmenitiesGroup.reset();

            /** Notifiy edit campground */
            this._socketService.sendMessage('edit-campground', {
              campgroundId: this.campgroundId,
            });

            // console.log('success editing campground', response);
            this._campgroundsService.redirectToCampgrounds();
          },
          (error) => {
            this.isLoading = false;
            console.log('error editing campground', error);
          }
        );
    }
  }

  onOpenDialog(option: string) {
    this._dialog.open(InfoDialogComponent, {
      width: '250px',
      data: { option, dataArray: this.campStaticData },
    });
  }

  onImagePicked(e: Event) {
    // console.log('inside onImagePicked');

    const file = (event.target as HTMLInputElement).files[0];
    this.displayImageName = file.name;

    // Set the file object in the FormControl 'campgroundImage' declared above
    this.formBasicGroup.patchValue({ campgroundImage: file });

    // Recalculates the value and validation controls for this control
    // Also, emit the value to valueChange event subscribers
    this.formBasicGroup.get('campgroundImage').updateValueAndValidity();

    // Read the file and show the preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  isEditMode(): boolean {
    return this.mode === 'edit';
  }

  onGoBack() {
    if (this.isEditMode()) {
      this._location.back();
    } else {
      this._router.navigate(['/campgrounds']);
    }
  }
}
