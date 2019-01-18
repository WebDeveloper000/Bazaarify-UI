import { Component, Inject, OnInit } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { NotifyService } from 'app/services/notify/notify.service';
import { HttpClient } from '@angular/common/http';
import { FirebaseApp } from 'angularfire2';
import { Observable } from 'rxjs/Observable';
import { AngularFireDatabase, AngularFireObject } from 'angularfire2/database';
import { UserService } from 'app/services/user.service';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})


export class HelpComponent implements OnInit {
  files: Array<File[]>;
  feedback: Object;
  attachments : any;
  filesUploading: boolean;
  dialogWasFiredFrom: string;

  constructor(
    private db: AngularFireDatabase,
    private userService: UserService,
    private fb: FirebaseApp,
    private router: Router,
    private notify: NotifyService,
    public dialogRef: MatDialogRef<HelpComponent>,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    /**
     * For now could be footer, header. Dialog title relies on it
     */
      this.dialogWasFiredFrom = this.data.placement;
      this.files = [];
      this.attachments = [];
      this.filesUploading = false;
      this.feedback = {};
  }

  ngOnInit() {
  }

  upload(event) {
    this.files = event.target.files;
    this.filesUploading = true;
    let success = false;
    let uploadPromises = [];

    for (let selectedFile of this.files) {
      let storageRef = this.fb.storage().ref();
      let path = `UserCorrespondence/${this.userService.userUid}/${selectedFile['name']}`;
      let iRef = storageRef.child(path);
      uploadPromises.push(iRef.put(selectedFile));
    }

    Promise.all(uploadPromises).then(uploadedFiles => {
      let filesUploaded = [];
      uploadedFiles.map(snapshot => {
        filesUploaded.push({
          filename: snapshot['metadata']['name'],
          contentType: snapshot['metadata']['contentType'],
          path: snapshot['metadata']['downloadURLs'][0]
        });
      });

      this.attachments = filesUploaded;
      this.filesUploading = false;
    });
  }

  deleteAttachment(i) {
    this.attachments.splice(i, 1)
  }

  sendFeedback() {
    this.feedback['attachments'] = this.attachments;
    this.db.list(`Users/${this.userService.userUid}/UserCorrespondence`)
      .push(this.feedback)
      .then(res => {
        this.notify.success("Messag was sent");
        this.closeDialog();
      });
  }

  closeDialog() {
    this.dialogRef.close();
  }

}

interface Image {
  path: string;
  filename: string;
  downloadURL?: string;
  $key?: string;
}

