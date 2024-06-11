document.getElementById('searchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    if (username) {
        document.getElementById('overview').innerHTML = '<p>Loading...</p>';
        document.getElementById('repos').innerHTML = '';
        document.getElementById('favorites').innerHTML = '';
        fetchUserInfo(username);
        fetchUserRepos(username, 1);
    }
});

function fetchUserInfo(username) {
    fetch(`https://api.github.com/users/${username}`)
        .then(response => {
            if (!response.ok) throw new Error('User not found');
            return response.json();
        })
        .then(user => {
            document.getElementById('overview').innerHTML = `
                <div id="userInfo">
                    <img src="${user.avatar_url}" alt="Profile Picture" width="100"/>
                    <h2>User Name: ${user.name}</h2>
                    <p>User Bio: ${user.bio}</p>
                    <p>Public Repositories: ${user.public_repos}</p>
                    <p>Followers: ${user.followers}</p>
                    <p>Following: ${user.following}</p>
                    <a href="${user.html_url}" target="_blank">Open in GitHub</a>
                </div>
            `;
            showTab('overview');
        })
        .catch(error => {
            document.getElementById('overview').innerHTML = '<p>User not found</p>';
        });
}

function fetchUserRepos(username, page) {
    fetch(`https://api.github.com/users/${username}/repos?page=${page}&per_page=5`)
        .then(response => response.json())
        .then(repos => {
            const repoList = repos.map(repo => `
                <div class="repo">
                    <div>
                        <a href="${repo.html_url}" target="_blank">${repo.name}</a>
                        <p>${repo.description || 'No description available'}</p>
                    </div>
                    <i class="heart-icon ${isFavorite(repo.name) ? 'favorited' : ''}" onclick="toggleFavoriteRepo('${repo.name}', '${repo.html_url}', '${repo.description}')">&#x2764;</i>
                </div>
            `).join('');
            document.getElementById('repos').innerHTML = repoList;
            fetchTotalRepos(username).then(totalRepos => setupPagination(username, page, totalRepos));
        });
}

function fetchTotalRepos(username) {
    return fetch(`https://api.github.com/users/${username}`)
        .then(response => response.json())
        .then(user => user.public_repos);
}

let favoriteRepos = JSON.parse(localStorage.getItem('favoriteRepos')) || [];

function isFavorite(repoName) {
    return favoriteRepos.some(repo => repo.name === repoName);
}

function toggleFavoriteRepo(name, url, description) {
    const repoIndex = favoriteRepos.findIndex(repo => repo.name === name);
    if (repoIndex !== -1) {
        favoriteRepos.splice(repoIndex, 1);
    } else {
        favoriteRepos.push({ name, url, description });
    }
    localStorage.setItem('favoriteRepos', JSON.stringify(favoriteRepos));
    displayFavoriteRepos();
    updateRepoIcons();
}

function displayFavoriteRepos() {
    const favoriteList = favoriteRepos.map(repo => `
        <div class="repo">
            <div>
                <a href="${repo.url}" target="_blank">${repo.name}</a>
                <p>${repo.description || 'No description available'}</p>
            </div>
            <i class="heart-icon favorited" onclick="toggleFavoriteRepo('${repo.name}', '${repo.url}', '${repo.description}')">&#x2764;</i>
        </div>
    `).join('');
    document.getElementById('favorites').innerHTML = favoriteList;
}

function setupPagination(username, currentPage, totalRepos) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const totalPages = Math.ceil(totalRepos / 5);

    const createButton = (text, page) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.classList.add('page');
        if (page === currentPage) {
            button.classList.add('active');
        }
        button.onclick = () => fetchUserRepos(username, page);
        return button;
    };

    // Previous Button
    const prevButton = createButton('Previous', currentPage - 1);
    prevButton.disabled = currentPage === 1;
    pagination.appendChild(prevButton);

    // Page Number Buttons
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = createButton(i, i);
        pagination.appendChild(pageButton);
    }

    // Next Button
    const nextButton = createButton('Next', currentPage + 1);
    nextButton.disabled = currentPage === totalPages;
    pagination.appendChild(nextButton);
}

function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(tabContent => {
        tabContent.classList.remove('active');
    });
    document.getElementById(tab).classList.add('active');

    document.querySelectorAll('nav ul li a').forEach(navLink => {
        navLink.classList.remove('active');
    });
    document.getElementById(`${tab}-tab`).classList.add('active');

    // Hide pagination for the Overview and Favorites tabs
    if (tab === 'repos') {
        document.getElementById('pagination').style.display = 'flex';
    } else {
        document.getElementById('pagination').style.display = 'none';
    }
}

document.getElementById('overview-tab').addEventListener('click', () => showTab('overview'));
document.getElementById('repos-tab').addEventListener('click', () => showTab('repos'));
document.getElementById('favorites-tab').addEventListener('click', () => showTab('favorites'));

// Initial load of favorite repos
document.addEventListener('DOMContentLoaded', displayFavoriteRepos);

function updateRepoIcons() {
    document.querySelectorAll('.heart-icon').forEach(icon => {
        const repoName = icon.closest('.repo').querySelector('a').textContent;
        if (isFavorite(repoName)) {
            icon.classList.add('favorited');
        } else {
            icon.classList.remove('favorited');
        }
    });
}
