// Header show/hide on scroll
let previousScrollPosition = 0;
const siteHeaderElement = document.getElementById("site-header");

window.addEventListener("scroll", () => {
  const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  if (currentScrollPosition > previousScrollPosition) {
    siteHeaderElement.classList.add("hidden");
  } else {
    siteHeaderElement.classList.remove("hidden");
  }
  previousScrollPosition = currentScrollPosition <= 0 ? 0 : currentScrollPosition;
});

const postListElement = document.getElementById("post-list");
const pageCounterElement = document.getElementById("controls-counter");
const sortSelectElement = document.getElementById("sort");
const perPageSelectElement = document.getElementById("per-page");
const paginationElement = document.getElementById("pagination");


let currentPageNumber = 1;
let totalItemCount = 0;

async function fetchPostData(pageNumber = 1, pageSize = 10, sortDirection = '-published_at') {
  const baseUrl = 'https://your-vercel-project.vercel.app';
  const apiEndpoint = `${baseUrl}/api/ideas?...`;
  const fullImageUrl = `${baseUrl}/api/proxy-image?url=...`;

  try {
    const apiResponse = await fetch(apiEndpoint, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!apiResponse.ok) {
      throw new Error(`API response error: ${apiResponse.status}`);
    }

    const apiData = await apiResponse.json();
    console.log(apiData)
    totalItemCount = apiData.meta.total;

    return apiData.data.map(post => {
      const mediumImageUrl = post.medium_image?.[0]?.url;
      const fullImageUrl = mediumImageUrl
        ? `/proxy-image?url=${encodeURIComponent(mediumImageUrl)}`
        : 'https://via.placeholder.com/400x225';
      const formattedPublishedAt = formatDate(post.published_at);

      return {
        title: post.title,
        image: fullImageUrl,
        date: formattedPublishedAt,
      };
    });
  } catch (error) {
    console.error("Error fetching post data:", error);
    return [];
  }
}

function formatDate(inputDate) {
    const date = new Date(inputDate);

    const months = [
        "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
        "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
}

async function renderPostsToDOM() {
  const sortOrder = sortSelectElement.value === "newest" ? '-published_at' : 'published_at';
  const itemsPerPage = parseInt(perPageSelectElement.value, 10);

  const postList = await fetchPostData(currentPageNumber, itemsPerPage, sortOrder);
  postListElement.innerHTML = postList.map(post => `
    <div class="post-card">
      <img src="${post.image}" loading="lazy"/>
      <div class="post-card-text">
        <div class="post-card-date">${post.date}</div>
        <div class="post-card-title">${post.title}</div>
      </div>
    </div>
  `).join("");

  const firstIndexShowing = (currentPageNumber - 1) * itemsPerPage;
  pageCounterElement.textContent = `Showing ${firstIndexShowing + 1} - ${firstIndexShowing + itemsPerPage} of ${totalItemCount}`
  renderPaginationControls();
}

function renderPaginationControls() {
  const itemsPerPage = parseInt(perPageSelectElement.value, 10);
  const totalPageCount = Math.ceil(totalItemCount / itemsPerPage);
  let paginationHTML = '';

  paginationHTML += `<button class="page-button" data-action="previous-set">«</button>`;
  paginationHTML += `<button class="page-button" data-action="previous">‹</button>`;

  const visibleStartPage = Math.max(currentPageNumber - 2, 1);
  const visibleEndPage = Math.min(visibleStartPage + 4, totalPageCount);

  for (let pageIndex = visibleStartPage; pageIndex <= visibleEndPage; pageIndex++) {
    paginationHTML += `<button class="page-button ${pageIndex === currentPageNumber ? 'active' : ''}" data-page="${pageIndex}">${pageIndex}</button>`;
  }

  paginationHTML += `<button class="page-button" data-action="next">›</button>`;
  paginationHTML += `<button class="page-button" data-action="next-set">»</button>`;

  paginationElement.innerHTML = paginationHTML;
}

paginationElement.addEventListener("click", (event) => {
  const clickedButton = event.target.closest(".page-button");
  if (!clickedButton) return;

  const actionType = clickedButton.dataset.action;
  const selectedPage = parseInt(clickedButton.dataset.page);
  const itemsPerPage = parseInt(perPageSelectElement.value, 10);
  const totalPageCount = Math.ceil(totalItemCount / itemsPerPage);

  if (actionType === "previous" && currentPageNumber > 1) {
    currentPageNumber--;
  } else if (actionType === "next" && currentPageNumber < totalPageCount) {
    currentPageNumber++;
  } else if (actionType === "previous-set") {
    currentPageNumber = Math.max(currentPageNumber - 5, 1);
  } else if (actionType === "next-set") {
    currentPageNumber = Math.min(currentPageNumber + 5, totalPageCount);
  } else if (!isNaN(selectedPage)) {
    currentPageNumber = selectedPage;
  }

  renderPostsToDOM();
});


sortSelectElement.addEventListener("change", () => {
  localStorage.setItem("sort", sortSelectElement.value);
  currentPageNumber = 1;
  renderPostsToDOM();
});

perPageSelectElement.addEventListener("change", () => {
  localStorage.setItem("perPage", perPageSelectElement.value);
  currentPageNumber = 1;
  renderPostsToDOM();
});


window.addEventListener("load", () => {
  const storedSortOrder = localStorage.getItem("sort");
  const storedItemsPerPage = localStorage.getItem("perPage");

  if (storedSortOrder) sortSelectElement.value = storedSortOrder;
  if (storedItemsPerPage) perPageSelectElement.value = storedItemsPerPage;

  renderPostsToDOM();
});
