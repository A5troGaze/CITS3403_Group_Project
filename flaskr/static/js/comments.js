const commentForm = document.getElementById('commentForm');
const commentFeed = document.getElementById('liveCommentFeed');
const commentInput = document.getElementById('commentText');

async function loadLiveComments() {
    try {
        const response = await fetch('/api/get_comments');
        const comments = await response.json();
        
        commentFeed.innerHTML = ''; 
        
        comments.forEach(comment => {
            const cardHTML = `
                <div class="card mb-3 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex flex-start">
                            <img class="rounded-circle shadow-sm me-3"
                                src="${comment.avatar}" alt="avatar" width="50" height="50" />
                            <div class="w-100">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <h6 class="text-primary fw-bold mb-0">
                                        ${comment.username}
                                    </h6>
                                    <p class="mb-0 text-muted" style="font-size: 0.85rem;">${comment.timestamp}</p>
                                </div>
                                <p class="text-dark mb-0 mt-2">
                                    ${comment.text}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            commentFeed.insertAdjacentHTML('beforeend', cardHTML);
        });

        if (comments.length === 0) {
            commentFeed.innerHTML = '<p class="text-muted">No reviews yet. Be the first to comment!</p>';
        }

    } catch (error) {
        console.error("Error fetching live comments:", error);
    }
}

loadLiveComments();
setInterval(loadLiveComments, 3000);

commentForm.addEventListener('submit', async function(event) {
    event.preventDefault(); 
    
    const freshCommentText = commentInput.value;

    try {
        const response = await fetch('/api/add_comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment_text: freshCommentText })
        });

        const result = await response.json();

        if (result.success) {
            commentInput.value = ''; 
            
            loadLiveComments(); 
        } else {
            alert(result.error); 
        }
    } catch (error) {
        alert("Something went wrong connecting to the server.");
    }
});
