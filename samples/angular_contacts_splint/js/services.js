/*
 * Copyright 2015  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
*/
// Services module
var contactsServices = angular.module('contactsServices', []);

// Service using local storage, getting initial data from JSON file
contactsServices.factory('contactsLocalStorageService', [ '$filter', '$q', '$http', function($filter, $q, $http) {
  var localStorageID = "contactsSampleLocalStorageID";  // ID of local storage

  function getDataFromStorage() {
    // Get the current data from local storage, or, if not present, initialize from JSON file
    try {
      var d = JSON.parse(localStorage.getItem(localStorageID));
      if (d) {
        var deferred = $q.defer();
        deferred.resolve(d);
        return deferred.promise;
      }
    } catch (e) {
    }
    return initDataFromJson();
  }

  function initDataFromJson() {
    // Read the JSON file data and store it in local storage
    var promise = $http.get('data/contacts.json').then(function(response) {
      localStorage.setItem(localStorageID, JSON.stringify(response.data));
      return response.data;
    });
    return promise;
  }

  function resetDefaultData() {
    // Remove data from local storage and call the init function
    localStorage.removeItem(localStorageID);
    return initDataFromJson();
  }

  function updateStorage(data) {
    // Update the local storage data
    localStorage.setItem(localStorageID, JSON.stringify(data));
  }

  function findContact($filter, data, email) {
    // Use Angular's filter functionality to find a contact using the  email value
    var found = $filter('filter')(data, email);
    if (found.length) {
      return found[0];
    } else {
      return {};
    }
  }

  return {
    // These are the service functions - getContactList, getContact, resetDefaultData, and updateContact
    getContactList : function() { // returns promise
      return getDataFromStorage();
    },
    getContact : function(email) { // returns promise
      var promise = getDataFromStorage().then(function(data) {
        return findContact($filter, data, email);
      });
      return promise;
    },
    resetDefaultData : function() { // returns promise
      return resetDefaultData();
    },
    updateContact : function(contact) {
      getDataFromStorage().then(function(data) {
        var oldContact = findContact($filter, data, contact.email);
        angular.copy(contact, oldContact);
        updateStorage(data);
      });
    }

  };
} ]);
