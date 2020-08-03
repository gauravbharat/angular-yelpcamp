import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; //Added by @angular/material
import { NgModule } from '@angular/core';

/** Custom Angular Modules */
import { AppRoutingModule } from './app-routing.module';
import { AngularMaterialModule } from './angular-material.module';
import { CampgroundsModule } from './campgrounds/campgrounds.module';

/** Custom Angular Components */
import { AppComponent } from './app.component';
import { LandingComponent } from './landing/landing.component';

@NgModule({
  declarations: [AppComponent, LandingComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    AngularMaterialModule,
    CampgroundsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
