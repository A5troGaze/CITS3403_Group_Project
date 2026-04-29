document.addEventListener("DOMContentLoaded", function() {

    const usernameView = document.getElementById('username-view-state');
    const usernameEdit = document.getElementById('username-edit-state');
    const usernameInput = document.getElementById('username-input');
    const cancelUsername = document.getElementById('cancel-username-edit');
    const usernameText = document.getElementById('newusername'); 

    if (usernameView && usernameEdit) {
        
        usernameView.addEventListener('mouseenter', () => {
            usernameText.innerText = "Do you really want to change your IDENTITY???";
        });
        usernameView.addEventListener('mouseleave', () => {
            usernameText.innerText = usernameInput.value; 
        });

        usernameView.addEventListener('click', () => {
            usernameView.classList.add('d-none');
            usernameEdit.classList.remove('d-none');
            usernameInput.focus();
        });

        cancelUsername.addEventListener('click', () => {
            usernameEdit.classList.add('d-none');
            usernameView.classList.remove('d-none');
        });
    }

    const nameView = document.getElementById('name-view-state');
    const nameEdit = document.getElementById('name-edit-state');
    const nameInput = document.getElementById('name-input');
    const nameText = document.getElementById('newname'); 
    const cancelName = document.getElementById('cancel-name-edit');

    if (nameView && nameEdit) {

        nameView.addEventListener('mouseenter', () => {
            nameText.innerText = "So you wanna be someone else? Bruh.";
        });
        
        nameView.addEventListener('mouseleave', () => {
            nameText.innerText = nameInput.value; 
        });

        nameView.addEventListener('click', () => {
            nameView.classList.add('d-none');    
            nameEdit.classList.remove('d-none'); 
            nameInput.focus();
        });

        cancelName.addEventListener('click', () => {
            nameEdit.classList.add('d-none');
            nameView.classList.remove('d-none');
        });
    }

    const profilewelcome = document.getElementById('profilewelcome');
    const actualName = profilewelcome.dataset.name;
    const actualUsername = profilewelcome.dataset.username;

    profilewelcome.addEventListener('mouseenter', () => {
        profilewelcome.innerText = `I know who you are, ${actualName}. You can't hide from me.`;
    });
    profilewelcome.addEventListener('mouseleave', () => {
        profilewelcome.innerText = `Edit your profile, ${actualUsername}`;
    });

    const avatarTrigger = document.getElementById('avatar-trigger');
    const avatarOverlay = document.getElementById('avatar-overlay');

    avatarTrigger.addEventListener('mouseenter', () => {
        avatarOverlay.style.opacity = '1';
    });

    avatarTrigger.addEventListener('mouseleave', () => {
        avatarOverlay.style.opacity = '0';
    });

    const bannerTrigger = document.getElementById('banner-trigger');
    const bannerOverlay = document.getElementById('banner-overlay');

    bannerTrigger.addEventListener('mouseenter', () => {
        bannerOverlay.style.opacity = '1';
    });

    bannerTrigger.addEventListener('mouseleave', () => {
        bannerOverlay.style.opacity = '0';
    });

});