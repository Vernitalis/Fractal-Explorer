const token = localStorage.getItem('token');
const profileBtn = document.getElementById('profileBtn');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const fractalBtn = document.getElementById('fractalBtn');


if (token) {
    profileBtn.style.display = 'inline-block';
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'none';
    fractalBtn.style.display = 'inline-block';
} else {
    profileBtn.style.display = 'none';
    loginBtn.style.display = 'inline-block';
    registerBtn.style.display = 'inline-block';
    fractalBtn.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const animateBtn = document.getElementById('animateBtn');
    const mandelbrotImage = document.getElementById('mandelbrotImage');
    let isAnimating = false;

    animateBtn.addEventListener('click', () => {
        if (!isAnimating) {
            mandelbrotImage.src = './resources/mandelbrot_animation.gif';
            animateBtn.textContent = "Stop Animation";
            isAnimating = true;
        } else {
            mandelbrotImage.src = './resources/mandelbrot_image.jpg';
            animateBtn.textContent = "Animate Mandelbrot";
            isAnimating = false;
        }

    });
});
