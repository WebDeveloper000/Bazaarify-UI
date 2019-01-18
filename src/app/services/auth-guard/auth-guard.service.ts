import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/take';

import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { UserService } from 'app/services/user.service';
import { Router, Routes, CanActivate } from '@angular/router';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class AuthGuardService implements CanActivate {
  userAuthed: boolean;

  constructor( public afAuth: AngularFireAuth, private userService: UserService, private router: Router ) {
  }

  canActivate(): Observable<boolean> {
    return this.userService.user
      .take(1)
      .map((authState) => !!authState)
      .do(authenticated => {
        if (!authenticated) {
          this.router.navigate(['/login']);
        }
      });
  }

}
