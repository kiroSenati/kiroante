// app.js
(() => {
  const state = {
    data: { airing: [], episodes: [], movies: [] },
    filteredEpisodes: [],
    filteredMovies: [],
    currentLetter: 'all',
    searchTerm: '',
    episodesPage: 1,
    itemsPerPage: 6
  };

  const elements = {
    searchInput: document.getElementById('searchInput'),
    azChips: document.getElementById('azChips'),
    airingCarousel: document.getElementById('airingCarousel'),
    episodesGrid: document.getElementById('episodesGrid'),
    moviesGrid: document.getElementById('moviesGrid'),
    viewMoreEpisodes: document.getElementById('viewMoreEpisodes'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    fabBtn: document.getElementById('fabBtn')
  };

  // Lazy loading observer
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const image = card.querySelector('.card-image');
        if (image && image.dataset.poster) {
          image.style.background = image.dataset.poster;
          delete image.dataset.poster;
        }
        observer.unobserve(card);
      }
    });
  });

  // Fetch data
  async function loadData() {
    try {
      const response = await fetch('data.json');
      state.data = await response.json();
      state.filteredEpisodes = [...state.data.episodes];
      state.filteredMovies = [...state.data.movies];
      render();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  // Render functions
  function renderCard(item) {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.title = item.title.toLowerCase();
    card.dataset.letter = item.title[0].toLowerCase();
    
    const yearBadge = item.isNew ? 'NUEVO' : item.year;
    const posterStyle = window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      ? item.poster 
      : 'transparent';
    
    card.innerHTML = `
      <div class="card-image" data-poster="${item.poster}" style="background: ${posterStyle}">
        <div class="card-badge left">${item.type}</div>
        <div class="card-badge right">${yearBadge}</div>
      </div>
      <div class="card-content">
        <h3 class="card-title">${item.title}</h3>
        ${item.tags.length > 0 ? `
          <div class="card-tags">
            ${item.tags.slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
    
    imageObserver.observe(card);
    return card;
  }

  function renderAiringCarousel() {
    elements.airingCarousel.innerHTML = '';
    state.data.airing.forEach(item => {
      const carouselItem = document.createElement('div');
      carouselItem.className = 'carousel-item';
      carouselItem.appendChild(renderCard(item));
      elements.airingCarousel.appendChild(carouselItem);
    });
  }

  function renderEpisodesGrid() {
    const start = 0;
    const end = state.episodesPage * state.itemsPerPage;
    const itemsToShow = state.filteredEpisodes.slice(start, end);
    
    elements.episodesGrid.innerHTML = '';
    itemsToShow.forEach(item => {
      elements.episodesGrid.appendChild(renderCard(item));
    });
    
    elements.viewMoreEpisodes.style.display = end >= state.filteredEpisodes.length ? 'none' : 'block';
  }

  function renderMoviesGrid() {
    elements.moviesGrid.innerHTML = '';
    state.filteredMovies.forEach(item => {
      elements.moviesGrid.appendChild(renderCard(item));
    });
  }

  function render() {
    renderAiringCarousel();
    renderEpisodesGrid();
    renderMoviesGrid();
  }

  // Filter functions
  function applyFilters() {
    const term = state.searchTerm.toLowerCase();
    const letter = state.currentLetter;
    
    state.filteredEpisodes = state.data.episodes.filter(item => {
      const matchesSearch = !term || item.title.toLowerCase().includes(term);
      const matchesLetter = letter === 'all' || item.title[0].toLowerCase() === letter;
      return matchesSearch && matchesLetter;
    });
    
    state.filteredMovies = state.data.movies.filter(item => {
      const matchesSearch = !term || item.title.toLowerCase().includes(term);
      const matchesLetter = letter === 'all' || item.title[0].toLowerCase() === letter;
      return matchesSearch && matchesLetter;
    });
    
    state.episodesPage = 1;
    renderEpisodesGrid();
    renderMoviesGrid();
    renderAiringCarousel();
  }

  // Event listeners
  elements.searchInput.addEventListener('input', (e) => {
    state.searchTerm = e.target.value;
    applyFilters();
  });

  elements.azChips.addEventListener('click', (e) => {
    if (e.target.classList.contains('az-chip')) {
      e.preventDefault();
      document.querySelectorAll('.az-chip').forEach(chip => chip.classList.remove('active'));
      e.target.classList.add('active');
      state.currentLetter = e.target.dataset.letter;
      applyFilters();
    }
  });

  elements.viewMoreEpisodes.addEventListener('click', () => {
    state.episodesPage++;
    renderEpisodesGrid();
  });

  // Carousel controls
  elements.prevBtn.addEventListener('click', () => {
    elements.airingCarousel.scrollBy({ left: -320, behavior: 'smooth' });
  });

  elements.nextBtn.addEventListener('click', () => {
    elements.airingCarousel.scrollBy({ left: 320, behavior: 'smooth' });
  });

  // Drag to scroll
  let isDown = false;
  let startX;
  let scrollLeft;

  elements.airingCarousel.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - elements.airingCarousel.offsetLeft;
    scrollLeft = elements.airingCarousel.scrollLeft;
  });

  elements.airingCarousel.addEventListener('mouseleave', () => {
    isDown = false;
  });

  elements.airingCarousel.addEventListener('mouseup', () => {
    isDown = false;
  });

  elements.airingCarousel.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - elements.airingCarousel.offsetLeft;
    const walk = (x - startX) * 2;
    elements.airingCarousel.scrollLeft = scrollLeft - walk;
  });

  // Touch support
  elements.airingCarousel.addEventListener('touchstart', (e) => {
    startX = e.touches[0].pageX - elements.airingCarousel.offsetLeft;
    scrollLeft = elements.airingCarousel.scrollLeft;
  });

  elements.airingCarousel.addEventListener('touchmove', (e) => {
    const x = e.touches[0].pageX - elements.airingCarousel.offsetLeft;
    const walk = (x - startX) * 2;
    elements.airingCarousel.scrollLeft = scrollLeft - walk;
  });

  // FAB button
  elements.fabBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && document.activeElement.id !== 'searchInput') {
      elements.airingCarousel.scrollBy({ left: -320, behavior: 'smooth' });
    } else if (e.key === 'ArrowRight' && document.activeElement.id !== 'searchInput') {
      elements.airingCarousel.scrollBy({ left: 320, behavior: 'smooth' });
    } else if (e.key === 'Escape') {
      elements.searchInput.value = '';
      state.searchTerm = '';
      applyFilters();
      elements.searchInput.blur();
    }
  });

  // Initialize
  loadData();
})();
