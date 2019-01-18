/**
 * Import configs
 */
import { FirebaseConfig } from '../environments/firebase.config';
import * as firebase from 'firebase/app';

/**
 * Import vendor
 */
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes, CanActivate } from '@angular/router';
import { JsonpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import { FormsModule } from "@angular/forms";
import {PrettyJsonModule} from 'angular2-prettyjson';
import {CountDown} from "ng2-date-countdown";
// https://www.npmjs.com/package/ng-recaptcha
import { RecaptchaModule } from 'ng-recaptcha';
import { HttpClientModule } from '@angular/common/http';
import { ShareModule } from '@ngx-share/core';
import { ShareButtonsModule } from '@ngx-share/buttons';
import { FileUploader } from 'ng2-file-upload';
import { FacebookModule, FacebookService, FBLikeComponent } from 'ngx-facebook';
import { DatePipe } from '@angular/common';
// Polyfill for CreateEvent
import 'custom-event-polyfill';
/**
 * Import Firebase part
 */
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFireStorageModule } from 'angularfire2/storage';

/**
 * Import app components
 */
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { HeaderComponent } from './components/common/header/header.component';
import { FooterComponent } from './components/common/footer/footer.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { SocialShareComponent } from './components/common/social-share/social-share.component';
import { PhoneVerificationDialogComponent } from './components/dialogs/phone-verification-dialog/phone-verification-dialog.component';
import { NotifyAboutTwofactorComponent } from './components/dialogs/notify-about-twofactor/notify-about-twofactor.component';
import { AccountSettingsComponent } from './components/account-settings/account-settings.component';
import { HelpComponent } from './components/dialogs/help/help.component';
import { NotificationsPanelComponent } from './components/common/notifications-panel/notifications-panel.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { ChatsPanelComponent } from './components/common/chats-panel/chats-panel.component';
import { NotificationsDialogComponent } from './components/dialogs/notifications-dialog/notifications-dialog.component';
import { ChatsDialogComponent } from './components/dialogs/chats/chats-dialog/chats-dialog.component';
import { ChatCardComponent } from './components/common/chats/chat-card/chat-card.component';
import { DiscoveryComponent } from './components/discovery/discovery.component';
import { PaymentComponent } from './components/dialogs/payment/payment.component';
import { PayingComponent } from './components/paying/paying.component';

/**
 * Import app directives
 */

/**
 * Import app services
 */
import { UserService } from 'app/services/user.service';
import { MessagesService } from 'app/services/messages/messages.service';
import { NotifyService } from 'app/services/notify/notify.service';
import { AuthGuardService } from './services/auth-guard/auth-guard.service';
import { MessagingService } from './services/messaging.service';
import { NotificationsService } from './services/notifications/notifications.service';
import { ChatsService } from './services/chats/chats.service';
import { StoreService } from './services/store/store.service';
import { ChatThredComponent } from './components/dialogs/chats/chat-thred/chat-thred.component';
import { SearchComponent } from './components/common/search/search.component';
import { SearchService } from './services/search/search.service';
import { ConfigurationService } from './services/configuration/configuration.service';
import { PaymentService } from './services/payment/payment.service';
import { CryptoPaymentsService } from './services/crypto-payments/crypto-payments.service';

/**
 * Import app pipes
 */
import { HtmlToPlaintextPipe } from 'app/components/common/pipes/html-to-plain-text';
import { GetExcerptPipe } from 'app/components/common/pipes/get-excerpt';
import { DefaultImgDirective } from './components/common/directives/default-img/default-img.directive';
import { UsdToBtcDirective } from './components/common/directives/usd-to-btc/usd-to-btc.directive';
import { QrcodeDirective } from './components/common/directives/qrcode/qrcode.directive';

/**
 * App routes. TODO - separate this
 */
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuardService] },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'account-settings', component: AccountSettingsComponent, canActivate: [AuthGuardService] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [AuthGuardService] },
  { path: 'discovery', component: DiscoveryComponent, canActivate: [AuthGuardService] },
  { path: 'payment', component: PayingComponent, canActivate: [AuthGuardService] },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    HeaderComponent,
    FooterComponent,
    DashboardComponent,
    ResetPasswordComponent,
    PhoneVerificationDialogComponent,
    SocialShareComponent,
    NotifyAboutTwofactorComponent,
    AccountSettingsComponent,
    HelpComponent,
    NotificationsComponent,
    NotificationsPanelComponent,
    NotificationsComponent,
    ChatsPanelComponent,
    NotificationsDialogComponent,
    ChatsDialogComponent,
    ChatCardComponent,
    ChatThredComponent,
    SearchComponent,
    DiscoveryComponent,
    HtmlToPlaintextPipe,
    GetExcerptPipe,
    PaymentComponent,
    DefaultImgDirective,
    PayingComponent,
    UsdToBtcDirective,
    CountDown,
    QrcodeDirective
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    AngularFireModule.initializeApp(FirebaseConfig.firebase),
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    AngularFireStorageModule,
    FormsModule,
    PrettyJsonModule,
    HttpClientModule,
    JsonpModule,
    RecaptchaModule.forRoot(),
    /**
     * Material part
     */
    BrowserAnimationsModule,
    MaterialModule,
    ShareModule.forRoot(),
    ShareButtonsModule.forRoot(),
    FacebookModule.forRoot()
  ],
  providers: [UserService, MessagesService, NotifyService, AuthGuardService, MessagingService, NotificationsService, ChatsService, DatePipe, StoreService, SearchService, ConfigurationService, PaymentService, CryptoPaymentsService],
  bootstrap: [AppComponent],
  entryComponents: [PhoneVerificationDialogComponent, NotifyAboutTwofactorComponent, HelpComponent, NotificationsDialogComponent, ChatsDialogComponent, PaymentComponent]
})
export class AppModule { }
