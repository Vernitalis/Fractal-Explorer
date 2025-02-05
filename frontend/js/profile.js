const API_URL = '/api/auth';
const FRACTAL_API_URL = '/api/fractals';
const savedFractalsList = document.getElementById('savedFractals');

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You must be logged in to view this page.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/profile`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            alert('Failed to fetch user profile.');
            return;
        }

        const userData = await response.json();
        document.getElementById('username').textContent = userData.username;
        document.getElementById('email').textContent = `Email: ${userData.email}`;
        fetchAndRenderSavedFractals();
    } catch (error) {
        console.error('Error fetching user profile:', error);
        alert('An error occurred. Please try again later.');
    }
});

document.getElementById('deleteAccount')?.addEventListener('click', async () => {
    const confirmation = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (!confirmation) return;

    const token = localStorage.getItem('token');
    if (!token) {
        alert('You must be logged in to delete your account.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/delete`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        alert(data.message);

        if (response.ok) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        alert('An error occurred while deleting your account.');
    }
});

// Logout
document.getElementById('logout')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});

async function fetchAndRenderSavedFractals() {
    try {
        const response = await fetch(`${FRACTAL_API_URL}/user`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch saved fractals');
        }

        const fractals = await response.json();
        renderSavedFractals(fractals);
    } catch (error) {
        console.error('Error fetching saved fractals:', error);
    }
}

function renderSavedFractals(fractals) {
    savedFractalsList.innerHTML = '';
    fractals.forEach((fractal) => {
        const li = document.createElement('li');

        let listItemContent = `${fractal.fractalType} (${fractal.params.colorScheme})`;

        if (fractal.params.colorScheme === 'custom') {
            const startColorText = `<span style="color: ${fractal.params.startColor}">Start: ${fractal.params.startColor}</span>`;
            const endColorText = `<span style="color: ${fractal.params.endColor}">End: ${fractal.params.endColor}</span>`;
            const finalColorText = `<span> [${startColorText}, ${endColorText}]</span>` 

            listItemContent += finalColorText;
        }

        if (fractal.fractalType === 'julia') {
            listItemContent += ` [cRe: ${fractal.params.cRe}, cIm: ${fractal.params.cIm}]`;
        }

        li.innerHTML = listItemContent;

        savedFractalsList.appendChild(li);
    });
}
