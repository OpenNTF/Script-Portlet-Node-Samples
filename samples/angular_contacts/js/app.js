/*
 * Copyright 2015  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
*/
// Main application with dependencies
var contactsApp = angular.module('contactsApp', [ 'ngRoute', 'contactsControllers', 'contactsServices' ]);

// Configure routes for the different views
contactsApp.config([ '$routeProvider', function($routeProvider) {
  $routeProvider.when('/list', {
    templateUrl : 'partials/listView.html',
    controller : 'ContactsController'
  }).when('/details/:email', {
    templateUrl : 'partials/detailsView.html',
    controller : 'ContactDetailsController'
  }).when('/update/:email', {
    templateUrl : 'partials/updateView.html',
    controller : 'ContactUpdateController'
  }).when('/about', {
    templateUrl : 'partials/aboutView.html'
  }).otherwise({
    redirectTo : '/list'
  });
} ]);
