import * as fse from 'fs-extra';
import * as path from 'path';

import * as isomorphicFetch from 'isomorphic-fetch';

import { FileToPublish } from '@brightsign/baconcore';

import * as FormData from 'form-data';
import * as nodeWrappers from '../common/nodeWrappers';

// TODO - what are these types really?
interface FileToCopy {
  fileName : string;
  hashValue : string;
  fileSize : number;
  filePath : string;
}
interface FilesToCopy  {
  file : FileToCopy[];
}

function uploadFileToBrightSign(hostname: string, filePath: string, fileName: string, sha1: string) {

  const encodedFileName = encodeURIComponent(fileName);

  const endpoint = '/UploadFile';

  const headers = [];
  let header : any = {};
  header.key = 'Destination-Filename';
  header.value = 'pool/sha1-' + sha1;
  headers.push(header);

  header = {};
  header.key = 'Friendly-Filename';
  header.value = encodedFileName;
  headers.push(header);

  return httpUploadFile(hostname, endpoint, filePath, headers);
}

function uploadFilesToBrightSign(filesToPublish: FileToPublish[], hostname: string) {

  return new Promise( (resolve, reject) => {

    const index = 0;
    const numFilesToCopy = filesToPublish.length;

    const promises : any = [];
    filesToPublish.forEach((fileToPublish) => {

      // if (publishParams.progressCallback) {
      //   publishParams.progressCallback(++index, numFilesToCopy, fileToPublish.fileName, fileToPublish.filePath);
      // }

      promises.push(uploadFileToBrightSign(hostname, fileToPublish.filePath,
        fileToPublish.fileName, fileToPublish.hash));
    });

    Promise.all(promises).then( () => {
      resolve();
      console.log('all files uploaded to BrightSign');
    }).catch( (err) => {
      reject(err);
    });
  });
}

export function uploadToBrightSign(ipAddress: string, tmpDir: string) {

  return new Promise((resolve, reject) => {

    let queryString = '';
    queryString += '?limitStorageSpace=' + 'false';

    const url = 'http://'.concat(ipAddress, ':8080/SpecifyCardSizeLimits', queryString);
    // TODO set username / password

    nodeWrappers.httpGet(url).then( (_) => {

      const filesToPublishPath = path.join(tmpDir, 'filesToPublish.json');

      return httpUploadFile(ipAddress, '/PrepareForTransfer', filesToPublishPath, []);

    }).then((response) => {
      return response.json();
    }).then( (rawFilesToCopy) => {
      const filesToCopy = getFilesToCopy(rawFilesToCopy);
      return uploadFilesToBrightSign(filesToCopy, ipAddress);

    }).then( () => {

      console.log('all files uploaded to BrightSign, upload sync spec');

      const filePath = path.join(tmpDir, 'new-local-sync.json');
      return httpUploadFile(ipAddress, '/UploadSyncSpec', filePath);

    }).then( () => {
      resolve();
    }).catch((err) => {
      debugger;
      reject(err);
    });
  });
}

function httpUploadFile(
  hostname: string,
  endpoint: string ,
  filePath: string,
  uploadHeaders: any[] = []
): Promise<any> {
  return new Promise( (resolve, reject) => {
    const url = 'http://' + hostname + ':8080' + endpoint; // TODO this should be a global const

    // TODO get headers should be a utility function
    const headers : any = {  };
    uploadHeaders.forEach((uploadHeader) => {
      headers[uploadHeader.key] = uploadHeader.value;
    });

    // TODO get formData should be a utility function
    const formData = new FormData();
    formData.append('files', fse.createReadStream(filePath));
    isomorphicFetch(url, {
      method: 'POST',
      headers,
      body: formData
    }).then( (response : any) => {
// TODO this should return response.json(). However, there are currently clients of this function
// which make device api calls that respond with empty or non JSON bodies. These calls should be
// handled through a different function.
      resolve(response);
    }).catch( (err : any) => {
      reject(err);
    });
  });
}

function getFilesToCopy(rawFilesToCopy: FilesToCopy) {

  const filesToCopy : any[] = [];

  if (rawFilesToCopy && rawFilesToCopy.file) {
    rawFilesToCopy.file.forEach((file) => {
      const fileName = file.fileName;
      const hashValue = file.hashValue;
      const fileSize = file.fileSize;
      const filePath = file.filePath;

      // TODO - this needs straightening out
      // TODO - ?addToSyncSpec; groupName? copyToRootFolder?
      const fileToPublish = new FileToPublish(fileName, filePath, true, hashValue, fileSize);
      filesToCopy.push(fileToPublish);
    });
  }
  else {
    console.log('getFilesToCopy: no files to copy');
  }

  return filesToCopy;
}

