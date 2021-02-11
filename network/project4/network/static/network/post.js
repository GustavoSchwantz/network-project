document.addEventListener('DOMContentLoaded', function() {
    
    // Select the username list item
    const user = document.querySelector('#user');
    
    // Enable write a new post just if the user is signed in
    if (user) {
        console.log('Há um usuário logado.');
        new_post();
    }
    else {
        console.log('Não há nenhum usuário logado.');
    }

    load_posts()
});

// Load a set of posts
function load_posts() {
    
    // Get all posts and add them to the DOM
    fetch('/posts')
    .then(response => response.json())
    .then(posts => {
        // Print posts
        console.log(posts);

        posts.forEach(add_post);
    });
}

function add_post(contents) {
    
    // Create new post
    const post = document.createElement('div');
    post.className = 'm-2 p-3 border';
    post.innerHTML = `<h5><b>${contents.username}</b></h5>
                      ${contents.content} <br>
                      <span style="color:gray">${contents.timestamp}</span> <br>
                      <button class="btn btn-primary">Like ${contents.likes}</button>`
    
    // Add post to DOM
    document.querySelector('#posts').append(post);
}

// Write a new post for users who are signed in 
function new_post() {
    
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
        
        // Disable the submit button again:
        submit.disabled = true;
        
        // Stop form from submitting
        return false;
    }
}