"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

////////////////////////////////////////////////////////////////////////

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */


function generateStoryMarkup(story, showDeleteBtn = false) {
  console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  const showStar = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
      <div>
        ${showDeleteBtn ? appendEditTools() : ""}
        ${showStar ? appendStar(story, currentUser) : ""}
        
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </div>
        </li>
    `);
}

////////////////////////////////////////////////////////////////////////

/** append favorite/ un-favorite star for story */
function appendStar(story, user) {
  const isFavorite = user.isFavorite(story);
  const star = isFavorite ? "fa-solid" : "fa-regular";
  return `
      <span class="star">
        <i class="${star} fa-star"></i>
      </span>`;
}

////////////////////////////////////////////////////////////////////////

/** append trash-can & edit-pen for story */
function appendEditTools() {
  return `<span class="edit-pen"><i class="fa-regular fa-pen-to-square"></i></span>
      <span class="trash-can"><i class="fas fa-trash-alt"></i></span>`;
}

////////////////////////////////////////////////////////////////////////

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");
  hidePageComponents();
  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }
  $allStoriesList.show();
}

////////////////////////////////////////////////////////////////////////

/**  Get user's favorite stories list from server, generates their HTML, and puts on page. */

function favoriteStoriesList() {
  console.debug("favoriteStoriesList");

  $favoriteStories.empty();

  if (currentUser.favorites.length === 0) {
    $favoriteStories.append("<h3>No favorite stories!</h3>");
  } else {
    // loop through all of users favorites and generate HTML for them
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $favoriteStories.append($story);
    }
  }
  $favoriteStories.show();
}

////////////////////////////////////////////////////////////////////////

/**  Get user's own stories list from server, generates their HTML, and puts on page. */

function myStoriesList() {
  console.debug("myStoriesList");

  $myStories.empty();

  if (currentUser.ownStories.length === 0) {
    $myStories.append("<h3>No your own stories!</h3>");
  } else {
    for (let story of currentUser.ownStories) {
      const $story = generateStoryMarkup(story, true);
      $myStories.append($story);
    }
  }
  $myStories.show();
}

////////////////////////////////////////////////////////////////////////

/** Handle deleting a story. */

async function removeStory(evt) {
  console.debug("removeStory");

  const $closestLi = $(evt.target).closest("li");
  const storyId = $closestLi.attr("id");

  await storyList.removeStory(currentUser, storyId);

  // re-generate story list
  await myStoriesList();
}

$myStories.on("click", ".trash-can", removeStory);

////////////////////////////////////////////////////////////////////////

/** Handle editing a story. */

async function editMyStory(evt) {
  console.debug("editMyStory");

  const $closestLi = $(evt.target).closest("li");
  const storyId = $closestLi.attr("id");

  let story = currentUser.ownStories.find(s => s.storyId === storyId);

  // get story values to edit form.
  $("#author").val(story.author);
  $("#title").val(story.title);
  $("#url").val(story.url);

  $("#updateStoryBtn").attr('data-story-id', `${storyId}`);
  $("#storyLegend").html("Edit Story");
  $("#submitStoryBtn").hide();
  $("#updateStoryBtn").show();
  $submitStoryForm.show();
}

$myStories.on("click", ".edit-pen", editMyStory);

////////////////////////////////////////////////////////////////////////

// update edited story.

async function updateStory(evt) {
  console.debug("updateStory");
  evt.preventDefault();
  const storyId = $(this).data("story-id");

  let story = currentUser.ownStories.find(s => s.storyId === storyId);
  story.author = $("#author").val();
  story.title = $("#title").val();
  story.url = $("#url").val();

  await storyList.editStory(currentUser, story);
  // re-generate story list.
  myStoriesList();

  // reset the form & hide the form.
  $submitStoryForm.trigger('reset');
  $submitStoryForm.hide();
}

$("#updateStoryBtn").on("click", updateStory);

////////////////////////////////////////////////////////////////////////

// Cancel edit story form.

function cancelUpdate(e) {
  console.debug("cancelUpdate");
  $submitStoryForm.hide();
}

$("#cancelBtn").on("click", cancelUpdate)

////////////////////////////////////////////////////////////////////////

// Handle submit story form.

async function submitNewStory(evt) {
  evt.preventDefault();

  //get data from the form.
  const author = $("#author").val();
  const title = $("#title").val();
  const url = $("#url").val();

  const username = currentUser.username;
  const storyData = { title, author, url, username };

  // StoryList class -> addStory() from models.js file.
  const story = await storyList.addStory(currentUser, storyData);

  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);

  // reset the form & hide the form.
  $submitStoryForm.trigger('reset');
  $submitStoryForm.hide();
}

$submitStoryForm.on('submit', submitNewStory);

////////////////////////////////////////////////////////////////////////

// allow user to favorite/ un-favorite a story.

async function setUnsetFavorite(evt) {
  console.debug("setUnsetFavorite");

  const $li = $(evt.target.closest('li'));
  const storyId = $li.attr('id');
  const story = storyList.stories.find(s => s.storyId === storyId);

  if ($(evt.target).hasClass('fa-solid')) {
    //Already story set as favorite, Set story to un-favorite.
    await currentUser.removingFavorite(story);
    $(evt.target).closest('i').toggleClass('fa-solid fa-regular');
  } else {
    // Story not set as favorite, set story to favorite.
    await currentUser.addingFavorite(story);
    $(evt.target).closest('i').toggleClass('fa-solid fa-regular');
  }
  if ($favoriteStories.is(":visible")) {
    favoriteStoriesList();
  }
}

$allStoriesList.on("click", ".star", setUnsetFavorite);
$favoriteStories.on("click", ".star", setUnsetFavorite);
$myStories.on("click", ".star", setUnsetFavorite);