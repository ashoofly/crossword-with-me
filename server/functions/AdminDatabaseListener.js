/* eslint-disable no-use-before-define */
/**
 * This file needs to be in functions/ directory for Firebase to be able to deploy as source code.
 * Firebase Admin SDK Database API: https://firebase.google.com/docs/database/admin/start
 */
class AdminDatabaseListener {
  constructor(db) {
    this.db = db;
  }

  getDbObjectById(collectionType, id) {
    return new Promise((resolve, reject) => {
      this.#getDbObjectByIdWithCallbacks(collectionType, id, (successResponse) => {
        resolve(successResponse);
      }, (errorResponse) => {
        reject(errorResponse);
      });
    });
  }

  getDbCollection(collectionType) {
    return new Promise((resolve, reject) => {
      this.#getDbCollectionWithCallbacks(collectionType, (successResponse) => {
        resolve(successResponse);
      }, (errorResponse) => {
        reject(errorResponse);
      });
    });
  }

  getDbObjectByRef(refPath) {
    return new Promise((resolve, reject) => {
      this.#getDbObjectByRefWithCallbacks(refPath, (successResponse) => {
        resolve(successResponse);
      }, (errorResponse) => {
        reject(errorResponse);
      });
    });
  }

  #getDbObjectByIdWithCallbacks(collectionType, id, successCallback, errorCallback) {
    const objectRef = this.db.ref(`${collectionType}/${id}`);

    objectRef.once('value', (snapshot) => {
      if (snapshot.exists()) {
        successCallback(snapshot.val());
      } else {
        successCallback(null);
      }
    }, (error) => {
      console.log(error);
      errorCallback(error);
    });
  }

  #getDbCollectionWithCallbacks(collectionType, successCallback, errorCallback) {
    const collectionRef = this.db.ref(`${collectionType}`);

    collectionRef.once('value', (snapshot) => {
      if (snapshot.exists()) {
        successCallback(snapshot.val());
      } else {
        successCallback(null);
      }
    }, (error) => {
      console.log(error);
      errorCallback(error);
    });
  }

  #getDbObjectByRefWithCallbacks(refPath, successCallback, errorCallback) {
    const objectRef = this.db.ref(refPath);

    objectRef.once('value', (snapshot) => {
      if (snapshot.exists()) {
        successCallback(snapshot.val());
      } else {
        successCallback(null);
      }
    }, (error) => {
      console.log(error);
      errorCallback(error);
    });
  }
}

module.exports = AdminDatabaseListener;
