import { Injectable } from '@angular/core';

@Injectable()
export class MessagesService {
  messages: Object = {};

  constructor() {
    this.messages = {
      /**
       * Errors
       *
       * 1. Override some of the built-in firebase err codes
       */
      "auth/invalid-email": "The email address is badly formatted.",
      "auth/user-not-found": "Email not found.",
      "auth/wrong-password": "The password is invalid.",
      "auth/email-already-in-use": "The email address is already in use.",
      "auth/account-exists-with-different-credential": "An account already exists with the same email address attached.",
      /**
       * 2. Custom err codes
       */
      "auth/email-not-verified": "Email was not verified.",

      /**
       * Info
       */
      "auth/user-logged-in": "You are now logged in.",
      "auth/user-logged-out": "You are now logged out.",
      "auth/password-reset": "Password reset link was sent to the provided email",
      "auth/account-registered": "Your account was created! Please check your mail to verify your email address.",
      "auth/password-was-changed": "Password was changed",

      /**
       * Two factor auth
       */
      "two-factor-auth/was-enabled": "Two factor verification was enabled for your account",
      "two-factor-auth/was-disabled": "Two factor verification was disabled for your account",
      "two-factor-auth/canceled-by-user": "Verification was canceled.",
      "two-factor-auth/verification-passed": "Verification passed.",
      "two-factor-auth/err-occured": "Error occured during verification. Please try again.",
      "two-factor-auth/verification-failed": "Verification failed."
    }
  }

  get(code) {
    return this.messages[code];
  }

}
