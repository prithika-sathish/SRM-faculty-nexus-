import { db, collection, doc, getDocs } from "./config.js";

let facultyActivitiesMap = {};

// Add event listener after DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.getElementById("searchForm");
  const activityTypeSelect = document.getElementById("searchActivityType");

  // Activity type change handler
  activityTypeSelect.addEventListener("change", function (e) {
    const activityType = e.target.value;
    const dateFields = document.querySelectorAll(".duration");
    const researchFields = document.getElementById("researchPaperFields");
    const dateGroups = document.querySelectorAll(".date-group");
    const searchAuthorInput = document.getElementById("searchAuthor");

    if (activityType === "research_paper") {
      // For research papers, hide date fields and show research fields
      dateGroups.forEach((group) => (group.style.display = "none"));
      dateFields.forEach((field) => {
        const input = field.querySelector("input");
        if (input) {
          input.required = false;
          input.value = ""; // Clear any existing values
        }
      });
      researchFields.style.display = "grid";
      if (searchAuthorInput) {
        searchAuthorInput.required = true;
      }
    } else {
      // For other activities, show date fields and hide research fields
      dateGroups.forEach((group) => (group.style.display = "block"));
      dateFields.forEach((field) => {
        const input = field.querySelector("input");
        if (input) input.required = true;
      });
      researchFields.style.display = "none";
      if (searchAuthorInput) {
        searchAuthorInput.required = false;
        searchAuthorInput.value = ""; // Clear any existing value
      }
    }
  });

  // Form submit handler
  searchForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const submitButton = this.querySelector('button[type="submit"]');
    const activityType = activityTypeSelect.value;

    if (submitButton) submitButton.disabled = true;

    try {
      if (!activityType) {
        showNotification("Please select an activity type", "error");
        return;
      }

      let results;
      if (activityType === "research_paper") {
        const authorInput = document.getElementById("searchAuthor");
        const author = authorInput ? authorInput.value.trim() : "";

        if (!author) {
          showNotification("Please enter an author name to search", "error");
          return;
        }

        const impactFactor =
          document.getElementById("searchImpactFactor").value;
        const indexed = document.getElementById("searchIndexed").value;

        showLoading();
        results = await fetchResearchPapers(author, impactFactor, indexed);
      } else {
        const startDate = document.getElementById("searchStartDate").value;
        const endDate = document.getElementById("searchEndDate").value;

        if (!startDate || !endDate) {
          showNotification("Please select both start and end dates", "error");
          return;
        }

        showLoading();
        results = await fetchActivities(activityType, startDate, endDate);
      }

      displaySearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      showNotification(
        "An error occurred during search. Please try again.",
        "error"
      );
    } finally {
      if (submitButton) submitButton.disabled = false;
      hideLoading();
    }
  });

  // Initialize form state based on current selection
  activityTypeSelect.dispatchEvent(new Event("change"));
});

async function fetchActivities(activityType, startDate, endDate) {
  try {
    // Fetch activities from Firestore
    const departmentRef = doc(db, "SRMVDP departments", "cseetech");
    const facultiesRef = collection(departmentRef, "faculties");

    // Get all faculty documents
    const facultiesSnapshot = await getDocs(facultiesRef);

    // Reset activities map
    facultyActivitiesMap = {};
    let results = [];

    // Process each faculty document
    facultiesSnapshot.docs.forEach((facultyDoc) => {
      const facultyData = facultyDoc.data();
      const facultyNetId = facultyDoc.id;

      // Extract faculty details
      const facultyTitle = facultyData.title || "";
      const facultyDesignation = facultyData.designation || "";
      const facultyName = facultyData.name || "Unknown Faculty";

      // Check if activities exist for the selected type
      if (facultyData.activities && facultyData.activities[activityType]) {
        // Filter activities by date range
        const matchingActivities = facultyData.activities[activityType].filter(
          (activity) => {
            const activityStart = new Date(activity.startDate);
            const activityEnd = new Date(activity.endDate);
            const searchStart = new Date(startDate);
            const searchEnd = new Date(endDate);

            return activityStart >= searchStart && activityEnd <= searchEnd;
          }
        );

        // Process matching activities
        if (matchingActivities.length > 0) {
          // Store faculty activities in map
          facultyActivitiesMap[facultyNetId] = {
            name: facultyName,
            title: facultyTitle,
            designation: facultyDesignation,
            activities: {
              [activityType]: matchingActivities,
            },
          };

          // Add to results
          results.push({
            facultyNetId,
            facultyName,
            facultyTitle,
            facultyDesignation,
            activityCount: matchingActivities.length,
          });
        }
      }
    });

    return results;
  } catch (error) {
    console.error("Error fetching activities:", error);
    throw error;
  }
}

function showLoadingAnimation() {
  // Create or update loading indicator
  let loader = document.getElementById("results-loader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "results-loader";
    loader.className = "results-loader";
    loader.innerHTML = `
      <div class="loader-spinner"></div>
    `;

    const resultsContainer = document.getElementById("searchResults");
    if (resultsContainer) {
      resultsContainer.innerHTML = "";
      resultsContainer.appendChild(loader);
    }
  }
}

function hideLoadingAnimation() {
  const loader = document.getElementById("results-loader");
  if (loader) {
    loader.remove();
  }
}

function scrollToResults() {
  const resultsContainer = document.getElementById("searchResults");
  if (resultsContainer) {
    // Smooth scroll to the results section
    resultsContainer.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}
function displaySearchResults(results) {
  const resultsContainer = document.getElementById("searchResults");

  // Clear previous results
  resultsContainer.innerHTML = "";

  // Create results header
  const header = document.createElement("h3");
  header.textContent = "Search Results";
  resultsContainer.appendChild(header);

  // Handle no results scenario
  if (results.length === 0) {
    const noResultsMsg = document.createElement("p");
    noResultsMsg.textContent = "No activities found matching the criteria.";
    noResultsMsg.className = "no-results-message";
    resultsContainer.appendChild(noResultsMsg);
    scrollToResults();
    return;
  }

  // Create results table
  const table = document.createElement("table");
  table.className = "search-results-table";

  // Table header
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Faculty Net ID</th>
      <th>Faculty Name</th>
      <th>Designation</th>
      <th>Activity Count</th>
      <th>Actions</th>
    </tr>
  `;
  table.appendChild(thead);

  // Table body
  const tbody = document.createElement("tbody");
  results.forEach((result) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${result.facultyNetId}</td>
      <td>${result.facultyName}</td>
      <td>${result.facultyDesignation}</td>
      <td>${result.activityCount}</td>
      <td>
        <button class="view-details-btn" 
                data-faculty-id="${result.facultyNetId}">
          View Details
        </button>
      </td>
    `;

    // Add event listener for view details
    const viewDetailsBtn = row.querySelector(".view-details-btn");
    viewDetailsBtn.addEventListener("click", () => {
      showFacultyDetailsModal(result.facultyNetId);
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  resultsContainer.appendChild(table);
  scrollToResults();
}
function showFacultyDetailsModal(facultyNetId) {
  const faculty = facultyActivitiesMap[facultyNetId];

  if (!faculty) {
    alert("Faculty details not found");
    return;
  }

  // Create modal
  const modal = document.createElement("div");
  modal.className = "faculty-modal";
  modal.innerHTML = `
    <div class="faculty-modal-content">
      <span class="modal-close">&times;</span>
      <h2>
        ${faculty.title} ${faculty.name}
        ${faculty.designation ? `<span>(${faculty.designation})</span>` : ""}
      </h2>
      
      <div class="faculty-activities-container">
        ${Object.entries(faculty.activities)
          .map(([activityType, activities]) => {
            // Special handling for research papers
            if (activityType === "research_papers") {
              return `
                <div class="activity-section">
                  <h3>Research Papers</h3>
                  <table class="activity-details-table">
                    <thead>
                      <tr>
                        <th>Paper Title</th>
                        <th>Authors</th>
                        <th>Paper Type</th>
                        <th>ISBN/ISSN</th>
                        <th>Publisher</th>
                        <th>Journal</th>
                        <th>Impact Factor</th>
                        <th>Indexed</th>
                        <th>DOI</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${activities
                        .map(
                          (paper) => `
                        <tr>
                          <td>${paper.prgmTitle || "N/A"}</td>
                          <td>${
                            Array.isArray(paper.authors)
                              ? paper.authors.join(", ")
                              : "N/A"
                          }</td>
                          <td>${paper.paperType || "N/A"}</td>
                          <td>${paper.isbnNumber || "N/A"}</td>
                          <td>${paper.publisher || "N/A"}</td>
                          <td>${paper.journal || "N/A"}</td>
                          <td>${paper.impactFactor || "N/A"}</td>
                          <td>${paper.indexedJournal || "No"}</td>
                          <td>
                            ${
                              paper.doi
                                ? `<a href="https://doi.org/${paper.doi.replace(
                                    "https://doi.org/",
                                    ""
                                  )}" 
                                  target="_blank" 
                                  class="doi-link">
                                  View DOI
                               </a>`
                                : "N/A"
                            }
                          </td>
                        </tr>
                      `
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>
              `;
            } else {
              // Handle other activity types
              return `
                <div class="activity-section">
                  <h3>${activityType
                    .replace(/_/g, " ")
                    .toUpperCase()} Activities</h3>
                  <table class="activity-details-table">
                    <thead>
                      <tr>
                        <th>Program Title</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Organization</th>
                        <th>Certificate</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${activities
                        .map(
                          (activity) => `
                        <tr>
                          <td>${activity.prgmTitle || "N/A"}</td>
                          <td>${formatDate(activity.startDate)}</td>
                          <td>${formatDate(activity.endDate)}</td>
                          <td>${activity.org || "N/A"}</td>
                          <td>
                            ${
                              activity.certLink
                                ? `<a href="${activity.certLink}" 
                                    target="_blank" 
                                    class="certificate-link">
                                    View Certificate
                                 </a>`
                                : "No Certificate"
                            }
                          </td>
                        </tr>
                      `
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>
              `;
            }
          })
          .join("")}
      </div>
    </div>
  `;

  // Append modal to body
  document.body.appendChild(modal);

  // Close modal functionality
  const closeButton = modal.querySelector(".modal-close");
  closeButton.addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  // Close modal when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// Utility function to format dates
function formatDate(dateString) {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    return "Invalid Date";
  }
}

// Export functions if needed for module usage
export { fetchActivities, displaySearchResults, showFacultyDetailsModal };

// Optional: Error handling and logging
window.addEventListener("error", (event) => {
  console.error("Unhandled error:", event.error);
  // Optional: Send error to logging service
});

// Performance monitoring (optional)
const performanceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`${entry.name}: ${entry.duration}ms`);
  }
});

performanceObserver.observe({
  entryTypes: ["measure"],
});

// Add these functions at the top of your file
function showLoading() {
  document.body.classList.add("loading");
}

function hideLoading() {
  document.body.classList.remove("loading");
}

// Update the fetchResearchPapers function to properly handle the search
async function fetchResearchPapers(author, impactFactor, indexed) {
  try {
    const departmentRef = doc(db, "SRMVDP departments", "cseetech");
    const facultiesRef = collection(departmentRef, "faculties");
    const facultiesSnapshot = await getDocs(facultiesRef);

    facultyActivitiesMap = {};
    let results = [];

    console.log("Searching for author:", author);

    for (const facultyDoc of facultiesSnapshot.docs) {
      try {
        const facultyData = facultyDoc.data();
        const facultyNetId = facultyDoc.id;

        // Check if research_paper activities exist
        if (facultyData.activities && facultyData.activities.research_paper) {
          const researchPapers = facultyData.activities.research_paper;
          const matchingPapers = [];

          // Iterate through each research paper
          for (const paper of researchPapers) {
            try {
              // Check if authors array exists and includes the search term
              const authorArray = Array.isArray(paper.authors)
                ? paper.authors
                : [];

              console.log("Author array:", authorArray);
              console.log("Searching for:", author);

              const meetsAuthorCriteria = authorArray.some((authorName) =>
                String(authorName).toLowerCase().includes(author.toLowerCase())
              );

              // Impact factor check (if provided)
              const meetsImpactCriteria =
                !impactFactor ||
                (paper.impactFactor &&
                  parseFloat(paper.impactFactor) >= parseFloat(impactFactor));

              // Indexed journal check (if selected)
              const meetsIndexedCriteria =
                !indexed ||
                (paper.indexedJournal &&
                  paper.indexedJournal.toLowerCase() === indexed.toLowerCase());

              if (
                meetsAuthorCriteria &&
                meetsImpactCriteria &&
                meetsIndexedCriteria
              ) {
                console.log("Found matching paper:", paper);
                matchingPapers.push(paper);
              }
            } catch (paperError) {
              console.error("Error processing paper:", paperError, paper);
            }
          }

          if (matchingPapers.length > 0) {
            facultyActivitiesMap[facultyNetId] = {
              name: facultyData.name || "Unknown Faculty",
              title: facultyData.title || "",
              designation: facultyData.designation || "",
              activities: {
                research_papers: matchingPapers,
              },
            };

            results.push({
              facultyNetId,
              facultyName: facultyData.name || "Unknown Faculty",
              facultyTitle: facultyData.title || "",
              facultyDesignation: facultyData.designation || "",
              activityCount: matchingPapers.length,
            });
          }
        }
      } catch (facultyError) {
        console.error("Error processing faculty:", facultyDoc.id, facultyError);
      }
    }

    console.log("Final search results:", results);
    return results;
  } catch (error) {
    console.error("Error in fetchResearchPapers:", error);
    throw new Error("Failed to fetch research papers. Please try again.");
  }
}
