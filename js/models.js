"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    return new URL(this.url).hostname;
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?
    //  So that when we fill a StoryList with getstories, we can call the method
    //  without creating a new instance of the class. We don't have to create 
    //  another StoryList just to fill one.

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  ////////////////////////////////////////////////////////////////////////

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, { title, author, url }) {
    // UNIMPLEMENTED: complete this function!
    const token = user.loginToken;
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "POST",
      data: { token, story: { title, author, url } },
    });

    const story = new Story(response.data.story);
    this.stories.unshift(story);
    user.ownStories.unshift(story);
    return story;
  }

  ////////////////////////////////////////////////////////////////////////

  // Remove story data from API & update story list.
  async removeStory(user, storyId) {
    const token = user.loginToken;
    const response = await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      data: { token }
    });

    // filter all the stories except the story which is removed.
    this.stories = this.stories.filter(s => s.storyId != storyId);
    user.ownStories = user.ownStories.filter(s => s.storyId != storyId);
    user.favorites = user.favorites.filter(s => s.storyId != storyId);
  }

  ////////////////////////////////////////////////////////////////////////

  // Edit story data in API & update story list.
  async editStory(user, estory) {
    const url = estory.url;
    const author = estory.author;
    const title = estory.title;

    const token = user.loginToken;
    const response = await axios({
      url: `${BASE_URL}/stories/${estory.storyId}`,
      method: "PATCH",
      data: { token, story: { title, author, url } },
    });

    const story = new Story(response.data.story);
    //  Find the index of edited story.
    let storyIdx = this.stories.findIndex(s => s.storyId === story.storyId);
    this.stories[storyIdx] = story;
    storyIdx = user.ownStories.findIndex(s => s.storyId === story.storyId);
    user.ownStories[storyIdx] = story;
    storyIdx = user.favorites.findIndex(s => s.storyId === story.storyId);
    //  If edited story is in user's favorite List then update the data.
    if (storyIdx > 0) {
      user.favorites[storyIdx] = story;
    }
  }

}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
    username,
    name,
    createdAt,
    updatedAt,
    favorites = [],
    ownStories = []
  },
    token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  ////////////////////////////////////////////////////////////////////////

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  ////////////////////////////////////////////////////////////////////////

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  ////////////////////////////////////////////////////////////////////////

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  ////////////////////////////////////////////////////////////////////////

  // Adding a story to the user's favorite list.
  // Updates the API.
  async addingFavorite(story) {
    const token = this.loginToken;
    const response = await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
      method: 'POST',
      data: { token },
    });
    this.favorites.push(story);
  }

  ////////////////////////////////////////////////////////////////////////

  // Removing a story of the user's favorite list
  // Updates the API
  async removingFavorite(story) {
    const token = this.loginToken;
    const response = await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
      method: 'DELETE',
      data: { token },
    });

    this.favorites = this.favorites.filter(s => s.storyId !== story.storyId);
  }

  ////////////////////////////////////////////////////////////////////////

  /** Return true/false if given Story instance is a favorite of this user. */

  isFavorite(story) {
    return this.favorites.some(s => (s.storyId === story.storyId));
  }

  ////////////////////////////////////////////////////////////////////////

  // Update/Edit User profile.(User can change name & password.)
  static async updateProfile(password, name) {
    const token = currentUser.loginToken;

    const response = await axios({
      url: `${BASE_URL}/users/${currentUser.username}`,
      method: "PATCH",
      data: { token, user: { password, name } },
    });

    let { user } = response.data

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

}





