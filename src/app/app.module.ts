import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; //Added by @angular/material
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

/** Custom Angular Modules */
import { AppRoutingModule } from './app-routing.module';
import { AngularMaterialModule } from './angular-material.module';
import { CampgroundsModule } from './campgrounds/campgrounds.module';

/** Custom Angular Components */
import { AppComponent } from './app.component';
import { LandingComponent } from './landing/landing.component';

/** HTTP Interceptors */
import { AuthInteceptor } from './auth/auth.interceptor';
import { ErrorInterceptor } from './error/error.interceptor';

@NgModule({
  declarations: [AppComponent, LandingComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AngularMaterialModule,
    CampgroundsModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInteceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
