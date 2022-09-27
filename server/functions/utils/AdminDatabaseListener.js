/**
 * This file needs to be in functions/ directory for Firebase to be able to deploy as source code.
 * Firebase Admin SDK Database API: https://firebase.google.com/docs/database/admin/start
 */
class AdminDatabaseListener {
  constructor(db) {
    this.db = db;
  }

  getDbObjectByIdOnce(collectionType, id) {
    return new Promise((resolve, reject) => {
      this.#getDbObjectByIdOnceWithCallbacks(collectionType, id, (successResponse) => {
        resolve(successResponse);
      }, (errorResponse) => {
        reject(errorResponse);
      });
    });
  }

  getDbCollectionOnce(collectionType) {
    return new Promise((resolve, reject) => {
      this.#getDbCollectionOnceWithCallbacks(collectionType, (successResponse) => {
        resolve(successResponse);
      }, (errorResponse) => {
        reject(errorResponse);
      });
    });
  }

  getDbObjectByRefOnce(refPath) {
    return new Promise((resolve, reject) => {
      this.#getDbObjectByRefOnceWithCallbacks(refPath, (successResponse) => {
        resolve(successResponse);
      }, (errorResponse) => {
        reject(errorResponse);
      });
    });
  }

  #getDbObjectByIdOnceWithCallbacks(collectionType, id, successCallback, errorCallback) {
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

  #getDbCollectionOnceWithCallbacks(collectionType, successCallback, errorCallback) {
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

  #getDbObjectByRefOnceWithCallbacks(refPath, successCallback, errorCallback) {
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
