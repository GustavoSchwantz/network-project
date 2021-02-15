document.addEventListener('DOMContentLoaded', function() {

    // By default, load the all posts page
    load_posts();
});

function profile_page(username) {
    
    // Show the header for profile page
    document.querySelector('h1').innerHTML = `Profile Page of ${username}`;

    // Hide textarea and show profile and posts views
    document.querySelector('#textarea-view').style.display = 'none';
    document.querySelector('#profile-view').style.display = 'block';
    document.querySelector('#posts-view').style.display = 'block';
    
    // Send a GET request to the 'profile/username' route to get the username profile information
    fetch('profile/' + username)
    .then(response => response.json())
    .then(info => {
        // Print info
        console.log(info);
        
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

    // Hide textarea and profile views and show posts view
    document.querySelector('#textarea-view').style.display = 'none';
    document.querySelector('#profile-view').style.display = 'none';
    document.querySelector('#posts-view').style.display = 'block';
    
    // Get all posts and add them to the DOM
    fetch('/posts')
    .then(response => response.json())
    .then(posts => {
        // Print posts
        console.log(posts);

        // Clear the posts view
        document.querySelector('#posts-view').textContent = '';
        
        // Add all posts to the DOM
        posts.forEach(add_post);
    });
}

function add_post(contents) {
    
    // Create new post 
    const post = document.createElement('div');
    post.className = 'm-2 p-3 border';
    post.innerHTML = `<a style="color:black" href="javascript:void(0);" onclick="profile_page('${contents.username}');"><h5><b>${contents.username}</b></h5></a>
                      ${contents.content} <br>
                      <span style="color:gray">${contents.timestamp}</span> <br>
                      <button class="btn btn-primary">Like ${contents.likes}</button>`
    
    // Add post to DOM
    document.querySelector('#posts-view').append(post);
}

// Write a new post for users who are signed in 
function new_post() {

    // Show the header for new post
    document.querySelector('h1').innerHTML = 'New Post';

    // Show textarea view and hide posts and profile views
    document.querySelector('#textarea-view').style.display = 'block';
    document.querySelector('#posts-view').style.display = 'none';
    document.querySelector('#profile-view').style.display = 'none';
    
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