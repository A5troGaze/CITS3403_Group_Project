document.addEventListener("DOMContentLoaded", function() {

    const newusername = document.getElementById('newusername');
    newusername.addEventListener('mouseenter', () => {
        newusername.innerText = "Do you really want to change your IDENTITY???";
    });
    newusername.addEventListener('mouseleave', () => {
        newusername.innerText = "Save New Username";
    });

    const newname = document.getElementById('newname');
    newname.addEventListener('mouseenter', () => {
        newname.innerText = "So you wanna be someone else? Bruh.";
    });
    newname.addEventListener('mouseleave', () => {
        newname.innerText = "Save New Name";
    });

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

});