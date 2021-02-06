document.addEventListener('DOMContentLoaded', function() {

    document.querySelector('#new-post-form').onsubmit = () => {

        const post = document.querySelector('#new-post-content').value;

        console.log(post);

        fetch('/new', {
            method: 'POST',
            body: JSON.stringify({
                post: post
            })
          })
          .then(response => response.json())
          .then(result => {
              // Print result
              console.log(result);
          });
          
        return false;
    }
});