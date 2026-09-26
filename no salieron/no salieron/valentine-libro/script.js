const book = document.querySelector("#book");
const allPapers = document.querySelectorAll(".paper");
const nextButtons = document.querySelectorAll(".next-btn");
const prevButtons = document.querySelectorAll(".prev-btn");

// Elementos del candado
const lockModal = document.querySelector("#lock-modal");
const passwordInput = document.querySelector("#password-input");
const unlockBtn = document.querySelector("#unlock-btn");
const closeModalBtn = document.querySelector("#close-modal-btn");
const errorMessage = document.querySelector("#error-message");

const numOfPapers = allPapers.length;
const maxLocation = numOfPapers + 1;
let currentLocation = 1;
let isBookUnlocked = false; 
const SECRET_KEY = "0303"; 

allPapers.forEach((paper, index) => {
    paper.style.zIndex = (numOfPapers - index) + numOfPapers;
});

nextButtons.forEach(button => {
    button.addEventListener("click", (e) => {
        e.stopPropagation();

        if (currentLocation === 1 && !isBookUnlocked) {
            showLockModal(); 
        } else {
            goNextPage(); 
        }
    });
});

prevButtons.forEach(button => {
    button.addEventListener("click", (e) => {
        e.stopPropagation();
        goPrevPage();
    });
});


function openBook() {
    book.style.transform = "translateX(50%)";
}

function closeBook() {
    book.style.transform = "translateX(0%)";
}

function goNextPage() {
    if (currentLocation < maxLocation) {
        if (currentLocation === 1) {
            openBook();
        }
        const paperToFlip = document.querySelector(`#p${currentLocation}`);
        paperToFlip.classList.add("flipped");
        
        setTimeout(() => {
            paperToFlip.style.zIndex = currentLocation;
        }, 600); 
        currentLocation++;
    }
}

function goPrevPage() {
    if (currentLocation > 1) {
        currentLocation--;
        const paperToUnflip = document.querySelector(`#p${currentLocation}`);
        paperToUnflip.classList.remove("flipped");
        paperToUnflip.style.zIndex = (numOfPapers - (currentLocation - 1)) + numOfPapers;
        if (currentLocation === 1) {
            closeBook();
        }
    }
}


function showLockModal() {
    lockModal.classList.add("show");
    passwordInput.value = ""; // Limpiar input
    errorMessage.style.display = "none";
    passwordInput.focus();
}

function hideLockModal() {
    lockModal.classList.remove("show");
}

function checkPassword() {
    if (passwordInput.value === SECRET_KEY) {
        // CLAVE CORRECTA
        isBookUnlocked = true; 
        hideLockModal();
        goNextPage(); 
    } else {
        errorMessage.style.display = "block";
        passwordInput.classList.add("shake"); 
        setTimeout(() => passwordInput.classList.remove("shake"), 500);
    }
}

unlockBtn.addEventListener("click", checkPassword);

closeModalBtn.addEventListener("click", hideLockModal);

passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        checkPassword();
    }
});