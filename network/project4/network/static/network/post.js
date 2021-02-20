let allPagesCounter = 1;
let followingCounter = 1;
let profileCounter = 1;
let user;

document.addEventListener('DOMContentLoaded', function() {
    
    username = document.querySelector('#username');

    user = username ? username.innerHTML : null;

    // By default, load the all posts page
    load_posts();
});

function next_page(page) {

    if (page === 'All Posts') {
        allPagesCounter++;
        load_posts();
    }
    else if (page === 'Following') {
        followingCounter++;
        following_page();
    }
    else {
        profileCounter++;
        profile_page(page.slice(16));
    }
}

function previous_page(page) {

    if (page === 'All Posts') {
        allPagesCounter--;
        load_posts();
    }
    else if (page === 'Following') {
        followingCounter--;
        following_page();
    }
    else {
        profileCounter--;
        profile_page(page.slice(16));
    }
}

function following_page() {

    // Show the header for following page
    document.querySelector('h1').innerHTML = 'Following';

    // Hide textarea and profile views and show post and pagination views
    document.querySelector('#textarea-view').style.display = 'none';
    document.querySelector('#profile-view').style.display = 'none';
    document.querySelector('#posts-view').style.display = 'block';
    document.querySelector('#pagination-view').style.display = 'block';

    // Get all posts from the logged user and add them to the DOM
    fetch('/following/' + followingCounter)
    .then(response => response.json())
    .then(contents => {
        // Print all content
        console.log(contents);

         // When user click on for a previous page which does not exist
         if (!contents.previous) { followingCounter++; }
        
         // When user click on for a next page which does not exist
         if (!contents.next) { followingCounter--; }

        // Clear the posts view
        document.querySelector('#posts-view').textContent = '';
        
        // Add all posts to the DOM
        contents.posts.forEach(add_post);
    });
}

function profile_page(username) {
    
    // Show the header for profile page
    document.querySelector('h1').innerHTML = `Profile Page of ${username}`;

    // Hide textarea and show profile, posts and pagination views
    document.querySelector('#textarea-view').style.display = 'none';
    document.querySelector('#profile-view').style.display = 'block';
    document.querySelector('#posts-view').style.display = 'block';
    document.querySelector('#pagination-view').style.display = 'block';
    
    // Send a GET request to the 'profile/username/profileCounter' route to get the username profile information
    fetch('profile/' + username + '/' + profileCounter)
    .then(response => response.json())
    .then(info => {
        // Print info
        console.log(info);

        // When user click on for a previous page which does not exist
        if (!info.previous) { profileCounter++; }
        
        // When user click on for a next page which does not exist
        if (!info.next) { profileCounter--; }
        
        // Set the following and followers numbers
        document.querySelector('#following').innerHTML = `Following: ${info.follows}`;
        document.querySelector('#followers').innerHTML = `Followers: ${info.followers}`;

        const followUnfollowButton = document.querySelector('#follow-unfollow-button');
        
        // If there is follow/unfollow button in the DOM
        if (followUnfollowButton) {
            
            // Show the appropriate button
            followUnfollowButton.innerHTML = info.following ? 'Unfollow' : 'Follow';

            // The follow/unfollow button should not appears to an user that acess her/his own profile
            followUnfollowButton.style.display = info.other ? 'block' : 'none';
            
            // Use button to toggle whether or not following this user’s posts
            followUnfollowButton.addEventListener('click', () => button_clicked(username, info.following));
        }
        
        // Clear the posts view
        document.querySelector('#posts-view').textContent = '';
        
        // Add username's posts to the DOM
        info.posts.forEach(add_post);
    });
}

// This function executes when the follow/unfollow button is clicked on
function button_clicked(username, follow) {
    fetch('profile/' + username, {
        method: 'PUT',
        body: JSON.stringify({
            follow: follow
        })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
        
        // Call function after change the server state for refresh profile information
        profile_page(username);
    }); 
}

// Load a set of posts
function load_posts() {

    // Show the header for all the posts
    document.querySelector('h1').innerHTML = 'All Posts';

    // Hide textarea and profile views and show posts and pagination views
    document.querySelector('#textarea-view').style.display = 'none';
    document.querySelector('#profile-view').style.display = 'none';
    document.querySelector('#posts-view').style.display = 'block';
    document.querySelector('#pagination-view').style.display = 'block';
    
    // Get all posts from a page and add them to the DOM
    fetch('/posts/' + allPagesCounter)
    .then(response => response.json())
    .then(contents => {
        // Print result
        console.log(contents);
        
        // When user click on for a previous page which does not exist
        if (!contents.previous) { allPagesCounter++; }
        
        // When user click on for a next page which does not exist
        if (!contents.next) { allPagesCounter--; }

        // Clear the posts view
        document.querySelector('#posts-view').textContent = '';
        
        // Add posts to the DOM
        contents.posts.forEach(add_post);
    });
}

function add_post(contents) {
    
    // Create new post 
    const post = document.createElement('div');
    post.className = 'm-2 p-3 border';
    post.innerHTML = `
    <h5><b><a style="color:black" href="#" onclick="profile_page('${contents.username}');">${contents.username}</a></b></h5>
    <div><a id="edit-link-${contents.id}" href="javascript:void(0);" onclick="edit_post(${contents.id}, '${contents.content}');">Edit</a></div>
    <div id="post-${contents.id}">${contents.content}</div>
    <div style="color:gray">${contents.timestamp}</div>
    <button class="btn btn-primary">Like ${contents.likes}</button>`
    
    // Tt is not possible for a user to edit another user’s posts
    if (!user || user !== contents.username) {
        post.querySelector(`#edit-link-${contents.id}`).style.display = 'none';
    }
    
    // Add post to DOM 
    document.querySelector('#posts-view').append(post);
}

function edit_post(id, content) {
    
    // Hide edit link after click on it
    document.querySelector(`#edit-link-${id}`).style.display = 'none';
    
    // Select post element to be used later
    postElement = document.querySelector(`#post-${id}`);

    // Put a textarea inside the post to edit its content
    postElement.innerHTML = `
        <form id="edit-post-form">
            <textarea id="edit-content">${content}</textarea>
            <input class="btn btn-primary" id="edit-submit" type="submit" value="Save">
        </form>`

    // Select textarea and submit button to be used later
    const editedPost   = document.querySelector('#edit-content'); 
    const submit    = document.querySelector('#edit-submit');
    
    // Listen for input to be typed into the textarea
    editedPost.onkeyup = () => {
        if (editedPost.value.length > 0) {
            submit.disabled = false;
        }
        else {
            submit.disabled = true;
        }
    }

    // Listen for submission of form
    document.querySelector('#edit-post-form').onsubmit = () => {
        
        // Find the edited post the user just submitted
        const post = editedPost.value;
        
        // Send a POST request to the '/edit/id' route carrying the edited post content
        fetch('/edit/' + `${id}`, {
            method: 'POST',
            body: JSON.stringify({post: post})
        })
        .then(response => response.json())
        .then(result => {
            // Print result
            console.log(result);
        });
        
        // Change post content
        postElement.innerHTML = post;
        
        // Stop form from submitting
        return false;
    }
}

// Write a new post for users who are signed in 
function new_post() {

    // Show the header for new post
    document.querySelector('h1').innerHTML = 'New Post';

    // Show textarea view and hide posts, profile and pagination views
    document.querySelector('#textarea-view').style.display = 'block';
    document.querySelector('#posts-view').style.display = 'none';
    document.querySelector('#profile-view').style.display = 'none';
    document.querySelector('#pagination-view').style.display = 'none';
    
    // Select the submit button and textarea to be used later
    const submit    = document.querySelector('#submit');
    const newPost   = document.querySelector('#content');
    
    // Disable submit button by default:
    submit.disabled = true;
    
    // Listen for input to be typed into the textarea
    newPost.onkeyup = () => {
        if (newPost.value.length > 0) {
            submit.disabled = false;
        }
        else {
            submit.disabled = true;
        }
    }
    
    // Listen for submission of form
    document.querySelector('form').onsubmit = () => {
        
        // Find the post the user just submitted
        const post = newPost.value;
        
        // Send a POST request to the '/new' route carrying the post content
        fetch('/new', {
            method: 'POST',
            body: JSON.stringify({post: post})
        })
        .then(response => response.json())
        .then(result => {
            // Print result
            console.log(result);
        });
        
        // Clear out textarea:
        newPost.value = '';
        
        // Go to all posts page after sent
        load_posts();
        
        // Stop form from submitting
        return false;
    }
}