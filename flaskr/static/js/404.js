

      const { error, errorMessage, errorTitle, catMemes, loggedIn } = window.appConfig;

      document.title = errorTitle;


      // Image load =================================================================
      const memeImage = document.getElementById("meme_image");

      if (!loggedIn && memeImage && catMemes.length>0) {
        memeImage.src = catMemes[Math.floor(Math.random() * catMemes.length)];
      }
      

      //random function to pick image when image is clicked
      if (memeImage && catMemes.length > 0) {
        memeImage.addEventListener('click', () => {
          let newIndex;
          let current = memeImage.src;

          do {
            newIndex = Math.floor(Math.random() * catMemes.length);
          } while (catMemes[newIndex] === current && catMemes.length > 1); // Ensure a different image is selected if there's more than one option

          memeImage.src = catMemes[newIndex];
          
          //change little message to tell you to keep on clicking
          const miniMsg = document.getElementById('miniMessage');
          
          if (miniMsg) {
            miniMsg.innerText = "Keep clicking ;)"
          }

        });
      }
      

      //hover animation for button ================================================================
      const UsertoHome = document.getElementById('UsertoHome');

      if (UsertoHome) {

        UsertoHome.addEventListener('mouseenter', () => {
          UsertoHome.innerText = "Ha, you suck! 67!";
        });
        UsertoHome.addEventListener('mouseleave', () => {
          UsertoHome.innerText = "Go to Home";
        });
      }