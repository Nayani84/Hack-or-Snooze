"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  putStoriesOnPage();
}

$body.on("click", "#nav-all", navAllStories);

////////////////////////////////////////////////////////////////////////

/** Show submit story form when submit is clicked on nav */

function navSubmitStoryClick(evt) {
  console.debug("navSubmitStoryClick", evt);
  $submitStoryForm.trigger('reset');
  hidePageComponents();
  $("#storyLegend").html("Add New Story");
  $("#submitStoryBtn").show();
  $("#updateStoryBtn").hide();
  putStoriesOnPage();
  $submitStoryForm.show();
}

$navSubmit.on("click", navSubmitStoryClick);

////////////////////////////////////////////////////////////////////////

/** Show favorite stories when favorite is clicked on nav */

function navFavoriteClick(evt) {
  console.debug("navFavorites", evt);
  hidePageComponents();
  favoriteStoriesList();
}

$navFavorites.on("click", navFavoriteClick);

////////////////////////////////////////////////////////////////////////

/** Show own stories when my-stories is clicked on nav */

function navMyStoriesClick(evt) {
  console.debug("navMyStoriesClick", evt);
  hidePageComponents();
  myStoriesList();
}

$navMyStories.on("click", navMyStoriesClick);

////////////////////////////////////////////////////////////////////////

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

////////////////////////////////////////////////////////////////////////

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $mainNavLinks.show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}

////////////////////////////////////////////////////////////////////////

/** Show user profile when username is clicked on nav */

function navUserClick() {
  console.debug("navUserClick");
  hidePageComponents();
  $profileForm.show();
  editMyProfile();
  $myStoriesLabel.show();
  $myFavoriteLabel.show();
  myStoriesList();
  favoriteStoriesList();
}

$navUserProfile.on("click", navUserClick);
