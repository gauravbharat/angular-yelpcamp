import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; //Added by @angular/material
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';

/** Custom Angular Modules */
import { AppRoutingModule } from './app-routing.module';
import { AngularMaterialModule } from './angular-material.module';
import { CampgroundsModule } from './campgrounds/campgrounds.module';
import { StatsModule } from './stats/stats.module';

/** Custom Angular Components */
import { AppComponent } from './app.component';
import { LandingComponent } from './landing/landing.component';

/** HTTP Interceptors */
import { AuthInteceptor } from './auth/auth.interceptor';
import { ErrorInterceptor } from './error/error.interceptor';

/** Custom Util Directives and Pipes */
import { TextTruncateEllipsisDirective } from './utils/text-ellipsis.directive';

/** IndexedDB specific code to persist user auth data object */
import { NgxIndexedDBModule, DBConfig } from 'ngx-indexed-db';
const dbConfig: DBConfig = {
  name: 'angular-yelpcamp-user',
  version: 1,
  objectStoresMeta: [
    {
      store: 'currentUser',
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [],
    },
  ],
};
/** 24082020 - Gaurav - Socket specific code */
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { environment } from '../environments/environment';
const socketConfig: SocketIoConfig = {
  url: environment.apiUrl,
  options: {},
};
import { SocketService } from './socket.service';

@NgModule({
  declarations: [TextTruncateEllipsisDirective, AppComponent, LandingComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AngularMaterialModule,
    CampgroundsModule,
    NgxIndexedDBModule.forRoot(dbConfig),
    SocketIoModule.forRoot(socketConfig),
    StatsModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInteceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    SocketService,
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false, showError: true },
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
