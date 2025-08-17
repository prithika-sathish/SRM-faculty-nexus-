import { auth, db, authobj } from "./config-index.js";

// Declare global variables
let useremail;
let facultyObj = {
  photo: "",
  name: "",
  title: "",
  netid: "",
  doj: "",
  designation: "",
  education: {
    ug: {
      degree: "",
      specialization: "",
      institution: "",
      year: "",
    },
    pg: {
      degree: "",
      specialization: "",
      institution: "",
      year: "",
    },
  },
};

// Add this helper function at the start of your file
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "-");
}

// Add this function at the top of your init function
function showNotification(message, type = "info") {
  // Create notifications container if it doesn't exist
  let container = document.querySelector(".notifications-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "notifications-container";
    document.body.appendChild(container);
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  // Create icon based on type
  const icon = document.createElement("i");
  switch (type) {
    case "success":
      icon.className = "fa fa-check-circle";
      break;
    case "error":
      icon.className = "fa fa-exclamation-circle";
      break;
    case "warning":
      icon.className = "fa fa-exclamation-triangle";
      break;
    default:
      icon.className = "fa fa-info-circle";
  }

  // Create message element
  const messageElement = document.createElement("span");
  messageElement.textContent = message;

  // Create close button
  const closeButton = document.createElement("button");
  closeButton.className = "notification-close";
  closeButton.innerHTML = "&times;";

  // Close button handler
  const closeNotification = () => {
    notification.classList.add("fade-out");
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 300);
  };

  closeButton.onclick = closeNotification;

  // Assemble notification
  notification.appendChild(icon);
  notification.appendChild(messageElement);
  notification.appendChild(closeButton);

  // Add to container
  container.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(closeNotification, 5000);

  // Remove old notifications if there are more than 3
  const notifications = container.getElementsByClassName("notification");
  if (notifications.length > 3) {
    container.removeChild(notifications[0]);
  }
}

(async function init() {
  let validuser = true;
  let user;
  document.getElementById("login").onclick = async function () {
    let provider = new authobj.GoogleAuthProvider();
    //provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    //await firebase.auth().signInWithRedirect(provider);
    await auth
      .signInWithPopup(provider)
      .then(async (result) => {
        user = result;
        if (result.user.email.split("@")[1] != "srmist.edu.in") {
          validuser = false;
        }
      })
      .catch((error) => {
        console.log(error);
      });
    if (!validuser) {
      showNotification("Attempt to Sign In with Invalid account.", "error");
      // alert("Attempt to Sign In with Invalid account.");
      user.user.delete();
    } else {
      console.log(user);
    }
  };

  let activityBuffer = {
    fdp: [],
    workshop: [],
    conference: [],
    seminar: [],
    uhv: [],
    fiip: [],
    orientation: [],
    moocs: [],
    resource_person: [],
    research_paper: [],
    others: [],
  };

  async function activities() {
    document.getElementsByClassName("workspace")[0].style = "";
    document.getElementsByClassName("workspace")[0].innerHTML = `
      <div class="activity-choice-container">
        <h2>Activity Records</h2>
        <div class="activity-buttons">
          <button id="addRecord" class="activity-choice-btn">
            <span class="fa fa-plus"></span>
            Add New Record
          </button>
          <button id="modifyRecord" class="activity-choice-btn">
            <span class="fa fa-edit"></span>
            Modify Existing Record
          </button>
        </div>
      </div>
    `;

    // Add New Record handler
    document.getElementById("addRecord").onclick = async function () {
      showLoading(); // Show loading animation
      try {
        // Call the existing activities form display logic
        await showActivityForm();
      } catch (error) {
        console.error("Error adding new record:", error);
        showNotification(
          "Failed to add new record. Please try again.",
          "error"
        );
        // alert("Failed to add new record. Please try again.");
      } finally {
        hideLoading(); // Hide loading animation
      }
    };

    // Modify Record handler
    document.getElementById("modifyRecord").onclick = async function () {
      await showExistingActivities();
    };
  }

  // Function to show the existing activity form (current implementation)
  async function showActivityForm() {
    document.getElementsByClassName("workspace")[0].style =
      "display:flex;flex-direction:row;justify-content:space-evenly;";
    document.getElementsByClassName("workspace")[0].innerHTML = `
      <form id="activityForm">
        <div class="form-group">
          <label for="activityType">Select Activity Type *</label>
          <div class="select-wrapper">
            <select id="activityType" required>
              <option value="">Choose an activity...</option>
              <option value="resource_person">Resource Person</option>
              <option value="fdp">Faculty Development Program (FDP)</option>
              <option value="workshop">Workshop</option>
              <option value="conference">Conference</option>
              <option value="seminar">Seminar</option>
              <option value="uhv">UHV</option>
              <option value="fiip">FIIP</option>
              <option value="orientation">Orientation Program</option>
              <option value="moocs">MOOCs</option>
              
              <option value="research_paper">Research Paper</option>
              <option value="others">Other Activity</option>
            </select>
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>

        <div id="additionalFields">
          <div class="form-group default-field">
            <label for="programTitle">Program Title *</label>
            <input
              type="text"
              id="programTitle"
              placeholder="Enter program title"
              required
            />
          </div>

          <div class="form-group default-field">
            <label>Duration *</label>
            <div class="date-inputs">
              <div class="date-field">
                <label>Start Date</label>
                <div class="date-wrapper">
                  <input type="date" id="startDate" required />
                  
                </div>
              </div>
              <div class="date-field">
                <label>End Date</label>
                <div class="date-wrapper">
                  <input type="date" id="endDate" required />
                  
                </div>
              </div>
            </div>
          </div>

          <div class="form-group default-field">
            <label for="organization">Organization *</label>
            <input
              type="text"
              id="organization"
              placeholder="Enter organization name"
              required
            />
          </div>

          <div class="form-group default-field">
            <label for="certificateLink">Certificate Link (Optional)</label>
            <input
              type="url"
              id="certificateLink"
              placeholder="https://..."
            />
          </div>

          <div class="form-group other-type-field" style="display: none;">
            <label for="otherActivityType">Specify Activity Type</label>
            <input
              type="text"
              id="otherActivityType"
              placeholder="Enter activity type"
              required
            />
          </div>

          <div class="submit-button-container">
            <button id='activity_btn'>
              <span id="submitText">Submit Activity</span>
              <div id="spinner" class="spinner"></div>
            </button>
          </div>
        </div>
      </form>

      <div class="dropdowns">
        <h3>Activities to be submitted</h3>
        ${
          Object.values(activityBuffer).some((arr) => arr.length > 0)
            ? `<button id="submitAllBuffered" class="submit-all-btn">
                <span class="fa fa-cloud-upload"></span> Submit All Activities
               </button>`
            : ""
        }
        ${Object.entries(activityBuffer)
          .map(
            ([type, items]) => `
          <button id='${type}_btn' class="${items.length ? "has-items" : ""}">
            ${getActivityTypeLabel(type)} (${items.length})
            <span style='float:right;' class="fa fa-solid fa-caret-down"></span>
          </button>
          <div class="displayArray" id='${type}' style='display:none;'>
            ${items
              .map(
                (activity, index) => `
              <center>
                  <div class="buffered-activity">
                    <span class="activity-title">${activity.prgmTitle}${
                  activity.otherType ? ` (${activity.otherType})` : ""
                }</span>
                    <button class="remove-buffer-item" data-type="${type}" data-index="${index}">
                      <span class="fa fa-times"></span>
                </button>
                  </div>
              </center>
            `
              )
              .join("")}
          </div>
        `
          )
          .join("")}
      </div>
    `;

    // Add styles for buffered activities
    const style = document.createElement("style");
    style.textContent = `
      .has-items {
        background: #27ae60 !important;
      }
      .buffered-activity {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: white;
        padding: 10px 15px;
        margin: 8px;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .activity-title {
        font-weight: 500;
        color: #2c3e50;
      }
      .remove-buffer-item {
        background: none !important;
        color: #e74c3c !important;
        padding: 5px !important;
        margin: 0 !important;
        width: auto !important;
      }
      .remove-buffer-item:hover {
        color: #c0392b !important;
      }
      .submit-all-btn {
        background: #27ae60 !important;
        margin-top: 15px !important;
      }
    `;
    document.head.appendChild(style);

    // Add event listeners for the buffered items
    setupBufferEventListeners();

    // Modify the activity submission handler
    function activitySubmission(e) {
      e.preventDefault();
      showLoading();

      const activityType = document.getElementById("activityType").value;

      // Different validation and collection for research papers
      if (activityType === "research_paper") {
        const paperTitle = document.getElementById("programTitle").value.trim();
        const paperType = document.querySelector(
          'input[name="paperType"]:checked'
        )?.value;
        const authors = Array.from(
          document.querySelectorAll(".author-entry input")
        )
          .map((input) => input.value.trim())
          .filter((value) => value !== "");

        // Basic validation
        if (!paperTitle || !paperType || authors.length === 0) {
          hideLoading();
          showNotification(
            "Please fill in all required fields (Title, Paper Type, and at least one Author)",
            "error"
          );
          return;
        }

        // Collect all research paper fields
        const newActivity = {
          prgmTitle: paperTitle,
          paperType: paperType,
          authors: authors,
          doi: document.getElementById("doi").value.trim(),
          indexedJournal: document.getElementById("indexedJournal").value,
          impactFactor: document.getElementById("impactFactor").value,
          isbnNumber: document.getElementById("isbnNumber").value.trim(),
          volumeNumber: document.getElementById("volumeNumber").value.trim(),
          issueNumber: document.getElementById("issueNumber").value.trim(),
          publicationYear: document.getElementById("publicationYear").value,
          publicationMonth: document.getElementById("publicationMonth").value,
          pagesFrom: document.getElementById("pagesFrom").value,
          pagesTo: document.getElementById("pagesTo").value,
          publisher: document.getElementById("publisher").value.trim(),
          journal: document.getElementById("journal").value.trim(),
        };

        try {
          activityBuffer[activityType].push(newActivity);
          showNotification(
            "Research paper added to buffer successfully",
            "success"
          );
          showActivityForm(); // Refresh the form
        } catch (error) {
          console.error("Error adding research paper to buffer:", error);
          showNotification("Failed to add research paper to buffer", "error");
        } finally {
          hideLoading();
        }
        return;
      }

      // For other activity types, keep the existing validation and submission logic
      const prgmTitle = document.getElementById("programTitle").value.trim();
      const startDate = document.getElementById("startDate").value.trim();
      const endDate = document.getElementById("endDate").value.trim();
      const org = document.getElementById("organization").value.trim();
      const certLink = document.getElementById("certificateLink").value.trim();

      if (!activityType) {
        hideLoading();
        showNotification("Please select an activity type", "error");
        return;
      }

      if (!prgmTitle || !startDate || !endDate || !org) {
        hideLoading();
        showNotification("Please fill in all required fields", "error");
        return;
      }

      if (new Date(endDate) < new Date(startDate)) {
        hideLoading();
        showNotification("End date must be after start date", "error");
        return;
      }

      const newActivity = {
        prgmTitle,
        startDate,
        endDate,
        org,
        certLink: certLink || "",
      };

      if (activityType === "others") {
        const otherType = document
          .getElementById("otherActivityType")
          .value.trim();
        if (!otherType) {
          hideLoading();
          showNotification("Please specify the activity type", "error");
          return;
        }
        newActivity.otherType = otherType;
      }

      try {
        activityBuffer[activityType].push(newActivity);
        showNotification("Activity added to buffer successfully", "success");
        showActivityForm();
      } catch (error) {
        console.error("Error adding activity to buffer:", error);
        showNotification("Failed to add activity to buffer", "error");
      } finally {
        hideLoading();
      }
    }

    // Add the submit handler to the form
    document.getElementById("activity_btn").onclick = activitySubmission;

    // Add these event listeners after the HTML is set
    const activityTypeSelect = document.getElementById("activityType");
    const additionalFields = document.getElementById("additionalFields");

    // Update the activityTypeSelect change handler
    activityTypeSelect.addEventListener("change", function () {
      const additionalFields = document.getElementById("additionalFields");
      const defaultFields = document.querySelectorAll(".default-field");
      const otherField =
        document.querySelector(".other-type-field") ||
        document.createElement("div");
      otherField.className = "other-type-field";
      otherField.style.display = "none";

      // First clear the additionalFields
      additionalFields.innerHTML = "";

      // Show/hide default fields based on activity type
      if (this.value === "research_paper") {
        // Create research paper specific fields
        const researchFields = document.createElement("div");
        researchFields.className = "research-paper-fields";
        researchFields.innerHTML = `
          <div class="form-group">
            <label>Paper Title</label>
            <input type="text" class="input-field" id="programTitle" placeholder="Enter paper title">
          </div>

          <div class="paper-type-container">
            <label class="paper-type-label">Paper Type</label>
            <div class="radio-group">
              <div class="radio-option">
                <input type="radio" id="journal" name="paperType" value="journal">
                <label for="journal">
                  <div class="custom-radio"></div>
                  <span>Journal</span>
                </label>
              </div>
              <div class="radio-option">
                <input type="radio" id="conference" name="paperType" value="conference">
                <label for="conference">
                  <div class="custom-radio"></div>
                  <span>Conference</span>
                </label>
              </div>
            </div>
          </div>

          <div class="authors-container">
            <label>Authors</label>
            <div class="authors-list"></div>
            <button type="button" class="add-author-btn">
              <span class="fa fa-plus"></span> Add Author
            </button>
          </div>
          
          <div class="form-group">
            <label>DOI</label>
            <input type="text" class="input-field" id="doi" placeholder="Enter DOI">
            <small class="helper-text">
              Enter DOI with or without 'https://doi.org/'. Examples:<br>
              - 10.1000/xyz123<br>
              - https://doi.org/10.1000/xyz123
            </small>
          </div>
          
          <div class="form-group">
            <label>Indexed Journal</label>
            <select class="input-field" id="indexedJournal">
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div class="form-group">
            <label>Impact Factor</label>
            <input type="number" step="0.01" class="input-field" id="impactFactor" placeholder="e.g., 2.5">
          </div>

          <div class="form-group">
            <label>ISBN/ISSN Number</label>
            <input type="text" class="input-field" id="isbnNumber" placeholder="Enter ISBN or ISSN number">
          </div>

          <div class="input-container">
            <div class="input-group">
              <label>Volume Number</label>
              <input type="text" class="input-field" id="volumeNumber" placeholder="Enter volume number">
            </div>
            <div class="input-group">
              <label>Issue Number</label>
              <input type="text" class="input-field" id="issueNumber" placeholder="Enter issue number">
            </div>
          </div>

          <div class="input-container">
            <div class="input-group">
              <label>Year</label>
              <input type="number" class="input-field" id="publicationYear" min="1900" max="2099">
            </div>
            <div class="input-group">
              <label>Month</label>
              <select class="input-field" id="publicationMonth">
                <option value="">Select month...</option>
                ${Array.from({ length: 12 }, (_, i) => i + 1)
                  .map(
                    (month) => `
                    <option value="${month}">${new Date(
                      2000,
                      month - 1
                    ).toLocaleString("default", { month: "long" })}</option>
                  `
                  )
                  .join("")}
              </select>
            </div>
          </div>

          <div class="input-container">
            <div class="input-group">
              <label>Pages From</label>
              <input type="number" class="input-field" id="pagesFrom" min="1">
            </div>
            <div class="input-group">
              <label>Pages To</label>
              <input type="number" class="input-field" id="pagesTo" min="1">
            </div>
          </div>

          <div class="form-group">
            <label>Publisher</label>
            <input type="text" class="input-field" id="publisher" placeholder="Enter publisher name">
          </div>

          <div class="form-group">
            <label>Journal</label>
            <input type="text" class="input-field" id="journal" placeholder="Enter journal name">
          </div>

          <div class="submit-button-container">
            <button id='activity_btn'>
              <span id="submitText">Submit Research Paper</span>
              <div id="spinner" class="spinner"></div>
            </button>
          </div>
        `;

        additionalFields.appendChild(researchFields);

        // Initialize author addition functionality
        const authorsList = researchFields.querySelector(".authors-list");
        const addAuthorBtn = researchFields.querySelector(".add-author-btn");

        addAuthorBtn.onclick = function () {
          const authorDiv = document.createElement("div");
          authorDiv.className = "author-entry";
          authorDiv.innerHTML = `
            <input type="text" class="input-field" placeholder="Enter author name">
            <button type="button" class="remove-author-btn">
              <span class="fa fa-times"></span>
            </button>
          `;
          authorsList.appendChild(authorDiv);

          // Add remove functionality
          authorDiv.querySelector(".remove-author-btn").onclick = function () {
            authorDiv.remove();
          };
        };

        // Reattach the submit handler
        document.getElementById("activity_btn").onclick = activitySubmission;
      } else {
        // Add default fields for other activity types
        additionalFields.innerHTML = `
          <div class="form-group default-field">
            <label for="programTitle">Program Title *</label>
            <input type="text" id="programTitle" placeholder="Enter program title" required>
          </div>

          <div class="form-group default-field">
            <label>Duration *</label>
            <div class="date-inputs">
              <div class="date-field">
                <label>Start Date</label>
                <div class="date-wrapper">
                  <input type="date" id="startDate" required>
                </div>
              </div>
              <div class="date-field">
                <label>End Date</label>
                <div class="date-wrapper">
                  <input type="date" id="endDate" required>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group default-field">
            <label for="organization">Organization *</label>
            <input type="text" id="organization" placeholder="Enter organization name" required>
          </div>

          <div class="form-group default-field">
            <label for="certificateLink">Certificate Link (Optional)</label>
            <input type="url" id="certificateLink" placeholder="https://...">
          </div>

          <div class="submit-button-container">
            <button id='activity_btn'>
              <span id="submitText">Submit Activity</span>
              <div id="spinner" class="spinner"></div>
            </button>
          </div>
        `;

        if (this.value === "others") {
          otherField.style.display = "block";
          otherField.innerHTML = `
            <label for="otherActivityType">Specify Activity Type</label>
            <input type="text" id="otherActivityType" placeholder="Enter activity type" required>
          `;
          additionalFields.appendChild(otherField);
        }

        // Reattach the submit handler
        document.getElementById("activity_btn").onclick = activitySubmission;
      }

      // Show the fields with animation
      if (this.value) {
        additionalFields.style.display = "block";
        requestAnimationFrame(() => {
          additionalFields.classList.add("visible");
        });
      } else {
        additionalFields.classList.remove("visible");
        setTimeout(() => {
          additionalFields.style.display = "none";
        }, 300);
      }
    });

    // Make the entire date wrapper clickable
    document.querySelectorAll(".date-wrapper").forEach((wrapper) => {
      wrapper.addEventListener("click", function (e) {
        if (e.target === this) {
          this.querySelector('input[type="date"]').showPicker();
        }
      });
    });
  }

  // New function to fetch and display existing activities
  async function showExistingActivities() {
    document.getElementsByClassName("workspace")[0].style =
      "display:flex;flex-direction:row;justify-content:space-evenly;";

    // Show loading state
    document.getElementsByClassName("workspace")[0].innerHTML = `
    Loading existing activities...
      <div class="loading-spinner">
        
      </div>
    `;

    try {
      // Fetch activities from database
      const activities = await fetchFacultyActivities();

      // Display activities in the same format as the add form, but populated
      document.getElementsByClassName("workspace")[0].innerHTML = `
        <form id="activityForm">
          <div id="additionalFields" style="display: none;">
            <div class="form-group">
              <label for="programTitle">Program Title</label>
              <input
                type="text"
                id="programTitle"
                placeholder="Enter program title"
                required
              />
            </div>

            <div class="form-group">
              <label>Duration</label>
              <div class="date-inputs">
                <div class="date-field">
                  <label>Start Date</label>
                  <div class="date-wrapper">
                    <input type="date" id="startDate" required />
                  </div>
                </div>
                <div class="date-field">
                  <label>End Date</label>
                  <div class="date-wrapper">
                    <input type="date" id="endDate" required />
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="organization">Organization</label>
              <input
                type="text"
                id="organization"
                placeholder="Enter organization name"
                required
              />
            </div>

            <div class="form-group">
              <label for="certificateLink">Certificate Link (Optional)</label>
              <input
                type="url"
                id="certificateLink"
                placeholder="https://..."
              />
            </div>

            <div class="form-group other-type-field" style="display: none;">
              <label for="otherActivityType">Activity Type</label>
              <input
                type="text"
                id="otherActivityType"
                placeholder="Enter activity type"
                required
              />
            </div>
          </div>
        </form>

        <div class="dropdowns">
          <h3>Your existing activities</h3>
          ${getOrderedActivityTypes(activities)
            .map(
              ([type, items]) => `
            <button id='${type}_btn'>
              ${getActivityTypeLabel(type)} (${items.length})
              <span style='float:right;' class="fa fa-solid fa-caret-down"></span>
            </button>
            <div class="displayArray" id='${type}' style='display:none;'>
              ${items
                .map(
                  (activity) => `
                <center>
                  <button class="activity_save" 
                          data-activity="${type}"
                          data-details='${JSON.stringify(activity)}'>
                    ${activity.prgmTitle}${
                    activity.otherType ? ` (${activity.otherType})` : ""
                  }
                  </button>
                </center>
              `
                )
                .join("")}
            </div>
          `
            )
            .join("")}
        </div>
      `;

      // Add event listeners for dropdowns and activity buttons
      setupModifyEventListeners();
    } catch (error) {
      console.error("Error fetching activities:", error);
      document.getElementsByClassName("workspace")[0].innerHTML = `
        <div class="error-message">
          Failed to load activities. Please try again.
        </div>
      `;
    }

    // Add styles for update and delete buttons
    const style = document.createElement("style");
    style.textContent = `
      .update-btn, .delete-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
      }

      .update-btn {
        background: #27ae60;
        color: white;
      }

      .delete-btn {
        background: #e74c3c;
        color: white;
      }

      .update-btn:hover, .delete-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .update-btn:active, .delete-btn:active {
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
  }

  // Helper function to fetch faculty activities from database
  async function fetchFacultyActivities() {
    let activities = {};

    const deptSnapshot = await db.collection("SRMVDP departments").get();
    for (const dept of deptSnapshot.docs) {
      const facultyRef = db
        .collection(`SRMVDP departments/${dept.id}/faculties`)
        .doc(useremail);
      const facultyDoc = await facultyRef.get();

      if (facultyDoc.exists) {
        const data = facultyDoc.data();
        if (data.activities) {
          activities = data.activities;
          break; // Exit once we find the faculty's activities
        }
      }
    }

    return activities;
  }

  // Helper function to get readable activity type labels
  function getActivityTypeLabel(type) {
    const labels = {
      fdp: "FDPs (Faculty Development Programs)",
      workshop: "Workshops",
      conference: "Conferences",
      seminar: "Seminars",
      uhv: "UHV",
      fiip: "FIIP",
      orientation: "Orientation Programs",
      moocs: "MOOCs",
      resource_person: "Resource Person",
      research_paper: "Research Papers",
      others: "Other Activities",
    };
    return labels[type] || type;
  }

  // Helper function to maintain consistent order of activities
  function getOrderedActivityTypes(activities) {
    const order = [
      "fdp",
      "workshop",
      "conference",
      "seminar",
      "uhv",
      "fiip",
      "orientation",
      "moocs",
      "resource_person",
      "research_paper",
      "others",
    ];
    return order.map((type) => [type, activities[type] || []]);
  }

  async function uploadDetails() {
    try {
      document.getElementsByClassName("fdetails")[0].remove();
    } catch (err) {}
    try {
      for (let divs of document.getElementsByClassName(
        "qualification-section"
      )) {
        divs.remove();
      }
      document.getElementById("dumpdb").remove();
    } catch (err) {}
    document.getElementById("upload").style.background = "#4a90e2";
    document.getElementsByClassName("workspace")[0].innerHTML += `
    
      <div class='qualification-section'>
        <h3>Basic Details</h3>
        <center><img id='photo' alt='Faculty Image' class='facultyPhoto'></center>
        <div class="input-container">
            <div class="input-group">
                <input type="text" class="input-field" id="name" placeholder=" " required>
                <label for="faculty-name" class="input-label">Faculty Name</label>
            </div>
        </div>
        <div class="input-container">
            <div class="input-group">
                <input type="text" class="input-field" id="doj" onfocusout='(this.type="text")' onfocus='(this.type="date")' placeholder=" " required>
                <label for="faculty-name" class="input-label">Date of Joining</label>
            </div>
        </div>
        <div class="input-container">
            <div class="input-group">
                <input type="text" class="input-field" disabled id="netid" placeholder=" " required>
                <label for="faculty-name" class="input-label" >Net ID</label>
            </div>
        </div>

      </div>
      <div class="qualification-section">
        <h3>UG Details</h3>
        <div class="input-container">
            <div class="input-group">
                    <input type="text" class="input-field" id="ug-degree" placeholder=" " required>
                    <label for="ug-degree" class="input-label">UG Degree (e.g., B.Tech, BE)</label>
            </div>
            <div class="input-group">
                    <input type="text" class="input-field" id="ug-specialization" placeholder=" " required>
                    <label for="ug-specialization" class="input-label">Specialization</label>
            </div>
        </div>
        <div class="input-container">
          <div class="input-group">
              <input type="text" class="input-field" id="ug-institution" placeholder=" " required>
              <label for="ug-institution" class="input-label">Institution</label>
          </div>
          <div class="input-group">
              <input type="number" class="input-field" id="ug-year" placeholder=" " min="1950" max="2024" required>
              <label for="ug-year" class="input-label">Year of Passing</label>
          </div>
        </div>
      
      
      </div>
      <div class="qualification-section">
        <h3>PG Details</h3>
        <div class="input-container">
            <div class="input-group">
                    <input type="text" class="input-field" id="pg-degree" placeholder=" " required>
                    <label for="pg-degree" class="input-label">PG Degree (e.g., M.Tech, ME)</label>
            </div>
            <div class="input-group">
                    <input type="text" class="input-field" id="pg-specialization" placeholder=" " required>
                    <label for="pg-specialization" class="input-label">Specialization</label>
            </div>
        </div>
        <div class="input-container">
            <div class="input-group">
                <input type="text" class="input-field" id="pg-institution" placeholder=" " required>
                    <label for="pg-institution" class="input-label">Institution</label>
            </div>
            <div class="input-group">
                    <input type="number" class="input-field" id="pg-year" placeholder=" " min="1950" max="2024" required>
                    <label for="pg-year" class="input-label">Year of Passing</label>
                </div>
            </div>
        </div>
        <div id="phd-details" style="display: none;">
        <div class="qualification-section">
                <h3>PhD Details</h3>
            <div class="inputs">
                <div class="input-container">
                    <div class="input-group">
                            <input type="text" class="input-field" id="phd-specialization" placeholder=" ">
                        <label for="phd-specialization" class="input-label">Specialization</label>
                    </div>
                    <div class="input-group">
                        <input type="text" class="input-field" id="phd-institution" placeholder=" ">
                        <label for="phd-institution" class="input-label">Institution</label>
                    </div>
                </div>
                <div class="input-container">
                    <div class="input-group">
                        <input type="number" class="input-field" id="phd-year" placeholder=" " min="1950" max="2024">
                        <label for="phd-year" class="input-label">Year of Completion</label>
                        </div>
                        <div class="input-group">
                            <input type="text" class="input-field" id="phd-thesis" placeholder=" ">
                            <label for="phd-thesis" class="input-label">Thesis Title</label>
                        </div>
                    </div>
                </div>
            </div>
            

        </div>
        <div class="qualification-section" id='supervisor-div' style='display:none;'>
          <h3>Supervisor Details</h3>
          <div class="inputs">
                <div class="input-container">
                    <div class="input-group">
                            <input type="text" class="input-field" id="supervisor" placeholder=" ">
                        <label for="phd-specialization" class="input-label">Supervisor Name</label>
                    </div>
                    <div class="input-group">
                        <input type="text" class="input-field" id="supervisor-institution" placeholder=" ">
                        <label for="phd-institution" class="input-label">Institution of the Supervisor</label>
                    </div>
                </div>
                
                </div>
           

        </div>
        <center><button class='upload-database-btn' id='dumpdb'><span class="fa fa-solid fa-database"></span> Upload to DataBase</button></center>
        
    `;
    document.getElementById("basic-details").onclick = basicDetails;
    document.getElementById("edu-details").onclick = educationalDetails;
    document.getElementById("upload").onclick = uploadDetails;
    let ids_and_vals = {
      name: facultyObj.name,
      doj: formatDate(facultyObj.doj), // Format the date here
      netid: facultyObj.netid,
      "ug-degree": facultyObj.education.ug.degree,
      "ug-specialization": facultyObj.education.ug.specialization,
      "ug-institution": facultyObj.education.ug.institution,
      "ug-year": facultyObj.education.ug.year,
      "pg-degree": facultyObj.education.pg.degree,
      "pg-specialization": facultyObj.education.pg.specialization,
      "pg-institution": facultyObj.education.pg.institution,
      "pg-year": facultyObj.education.pg.year,
    };

    document.getElementById("photo").src = facultyObj.photo;
    if (facultyObj.education.phd != undefined) {
      document.getElementById("phd-details").style = "";
      document.getElementById("supervisor-div").style = "";
      ids_and_vals["phd-specialization"] =
        facultyObj.education.phd.specialization;
      ids_and_vals["phd-institution"] = facultyObj.education.phd.institution;
      ids_and_vals["phd-year"] = facultyObj.education.phd.year;
      ids_and_vals["phd-thesis"] = facultyObj.education.phd.thesis_title;
      ids_and_vals["supervisor"] = facultyObj.education.phd.supervisor_name;
      ids_and_vals["supervisor-institution"] =
        facultyObj.education.phd.supervisor_institution;
    }
    facultyObj.isnewUser = false;
    for (let ids in ids_and_vals) {
      document.getElementById(ids).value = ids_and_vals[ids];
    }
    document.getElementById("dumpdb").onclick = async function () {
      document.getElementById(
        "dumpdb"
      ).innerHTML = `<span class="fa fa-solid fa-spinner" style='animation-name:loader;animation-duration:4s;animation-fill-mode:forwards;animation-iteration-count:infinite;'></span>`;
      await db
        .collection(`SRMVDP departments`)
        .get()
        .then(async (res) => {
          res.docs.map(async (dept) => {
            let faculties = false;
            await db
              .collection(`SRMVDP departments/${await dept.id}/faculties`)
              .get()
              .then(async (faculties) => {
                faculties.docs.map(async (faculty) => {
                  if (faculty.id == useremail) {
                    await db
                      .collection(
                        `SRMVDP departments/${await dept.id}/faculties`
                      )
                      .doc(await faculty.id)
                      .update(facultyObj)
                      .then(() => {
                        document.getElementById(
                          "dumpdb"
                        ).innerHTML = `<span class='fa fa-solid fa-check'></span> Uploaded to Database`;
                        document.getElementById("dumpdb").style.background =
                          "green";
                      });
                  }
                });
              });
          });
        });
    };
  }
  async function basicDetails() {
    try {
      document.getElementsByClassName("fdetails")[0]?.remove();
    } catch (err) {}

    this.classList.add("nav-button-clicked");
    let container = document.createElement("div");
    container.setAttribute("class", "fdetails");

    container.innerHTML = `
            <div id="dropArea">
                <p class="img_prompt">Click or Drag & Drop</p>
            </div>
            
            <div class="editor-container">
            <div class="editor-section">
                <div class="editor-controls">
                    <button id="resetButton">Reset</button>
                    <button id="applyButton">Apply Crop</button>
                    <button id="closebtn"><span class="fa fa-solid fa-xmark"></span></button>
                </div>
                <div class="editor-preview">
                    <div id="cropArea">
                        <div id="cropOverlay">
                            <div class="crop-guide"></div>
                        </div>
                    </div>
                </div>
                <div class="zoom-controls">
                    <button id="zoomOutButton">-</button>
                    <input type="range" id="zoomSlider" min="0.5" max="3" step="0.1" value="1">
                    <button id="zoomInButton">+</button>
                </div>
            </div>
            </div>
            <h2>Basic Details</h2>
            <hr class="hrdivide">
            <div class="inputs">
                <div class="input-container">
                    <div class="input-group title-group">
                        <select class="input-field title-select" id="title" required>
                            <option value="default">Title</option>
                            <option value="Dr.">Dr.</option>
                            <option value="Mr.">Mr.</option>
                            <option value="Mrs.">Mrs.</option>
                            <option value="Ms.">Ms.</option>
                        </select>
                    </div>

                    <div class="input-group">
                        <input type="text" class="input-field" id="faculty-name" placeholder=" " required>
                        <label for="faculty-name" class="input-label">Faculty Name</label>
                    </div>
                </div>
                <div class="input-container">
                    <div class="input-group">
                        <input type="text" class="input-field" id="Net ID" placeholder=" " required>
                        <label for="faculty-name" class="input-label">Net ID</label>
                    </div>
                </div>
                <div class="input-container">
                    <div class="input-group">
                        <input type="text" class="input-field" id="doj" onfocusout='(this.type="text")' onfocus='(this.type="date")' placeholder=" " required>
                        <label for="faculty-name" class="input-label">Date of Joining</label>
                    </div>
                </div>
                <select style="width:70%;margin:auto;" class="input-field" id="designation" required>
                    <option value="default">--Select Designation--</option>
                    <option id='prof' value="prof">Professor</option>
                    <option id='srg' value="srg">Assistant Professor (Sr.G)</option>
                    <option id='og' value="og">Assistant Professor (O.G)</option>
                    <option id='sg' value="sg">Assistant Professor (S.G)</option>
                    <option id='assoc' value="assoc">Associate Professor</option>
                </select>
                
            </div>
            <center><button id="next" class="proceed">Next <span class="fa fa-solid fa-right-long"></span></button></center>

        `;

    document.getElementsByClassName("workspace")[0].appendChild(container);

    // Populate fields with existing data if available
    if (facultyObj) {
      if (facultyObj.photo) {
        const dropArea = document.getElementById("dropArea");
        dropArea.style.backgroundImage = `url(${facultyObj.photo})`;
        dropArea.style.backgroundSize = "cover";
        dropArea.style.backgroundPosition = "center";
        try {
          document.getElementsByClassName("img_prompt")[0].remove();
        } catch (err) {}
      }

      if (facultyObj.title)
        document.getElementById("title").value = facultyObj.title;
      if (facultyObj.name)
        document.getElementById("faculty-name").value = facultyObj.name;
      if (facultyObj.doj) document.getElementById("doj").value = facultyObj.doj;
      if (facultyObj.designation)
        document.getElementById("designation").value = facultyObj.designation;
    }

    document.getElementById("faculty-name").value = facultyObj.name;
    document.getElementById("title").value = facultyObj.title;
    document.getElementById("Net ID").disabled = false;
    document.getElementById("Net ID").value = facultyObj.netid;
    //document.getElementById("Net ID").value = auth.currentUser.email.split("@")[0];
    document.getElementById("Net ID").disabled = true;

    // Restore photo if it exists
    if (facultyObj.photo) {
      const dropArea = document.getElementById("dropArea");
      dropArea.style.backgroundImage = `url(${facultyObj.photo})`;
      dropArea.style.backgroundSize = "cover";
      dropArea.style.backgroundPosition = "center";
      try {
        document.getElementsByClassName("img_prompt")[0].remove();
      } catch (err) {}
    }
    document.getElementById("designation").value = "srg";

    container.style =
      "flex-direction:column;display:flex;justify-content:space-around;";
    function init_image_cropper() {
      const dropArea = document.getElementById("dropArea");
      const cropArea = document.getElementById("cropArea");
      const resetButton = document.getElementById("resetButton");
      const applyButton = document.getElementById("applyButton");
      const zoomSlider = document.getElementById("zoomSlider");
      const zoomOutButton = document.getElementById("zoomOutButton");
      const zoomInButton = document.getElementById("zoomInButton");

      let currentImage = null;
      let isDragging = false;
      let startX,
        startY,
        imageX = 0,
        imageY = 0;
      let scale = 1;

      function handleFile(file) {
        if (!file.type.startsWith("image/")) {
          showNotification("Please upload an image file", "error");
          // alert("Please upload an image file");
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.createElement("img");
          img.onload = () => {
            // Clear previous content
            cropArea.innerHTML = "";

            // Create overlay again
            const cropOverlay = document.createElement("div");
            cropOverlay.id = "cropOverlay";
            const cropGuide = document.createElement("div");
            cropGuide.classList.add("crop-guide");
            cropOverlay.appendChild(cropGuide);

            cropArea.appendChild(img);
            cropArea.appendChild(cropOverlay);

            // Style image
            img.style.maxWidth = "100%";
            img.style.maxHeight = "100%";
            img.style.position = "absolute";
            img.style.cursor = "move";
            document.getElementsByClassName(
              "editor-container"
            )[0].style.display = "block";
            currentImage = img;
            setupImageInteractions(img);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }

      function setupImageInteractions(img) {
        img.addEventListener("mousedown", startDragging);
        document.addEventListener("mousemove", drag);
        document.addEventListener("mouseup", stopDragging);
      }

      function startDragging(e) {
        e.preventDefault();
        isDragging = true;
        startX = e.clientX - imageX;
        startY = e.clientY - imageY;
        if (currentImage) currentImage.style.cursor = "grabbing";
      }

      function drag(e) {
        if (!isDragging) return;
        imageX = e.clientX - startX;
        imageY = e.clientY - startY;
        if (currentImage) {
          currentImage.style.transform = `translate(${imageX}px, ${imageY}px) scale(${scale})`;
        }
      }

      function stopDragging() {
        isDragging = false;
        if (currentImage) currentImage.style.cursor = "move";
      }

      function resetImage() {
        if (!currentImage) return;
        imageX = 0;
        imageY = 0;
        scale = 1;
        zoomSlider.value = 1;
        currentImage.style.transform = `translate(0px, 0px) scale(1)`;
      }

      function applyCrop() {
        const cropGuide = document.querySelector(".crop-guide");
        if (!currentImage || !cropGuide) {
          showNotification("Please upload an image first", "error");
          // alert("Please upload an image first");
          return;
        }

        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Set canvas size to match crop guide size
          canvas.width = 300; // Match crop guide width
          canvas.height = 300; // Match crop guide height

          const cropRect = cropGuide.getBoundingClientRect();
          const imageRect = currentImage.getBoundingClientRect();

          // Get the current transform values
          const transform = currentImage.style.transform;
          const scaleMatch = transform.match(/scale\((.*?)\)/);
          const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

          // Calculate the actual dimensions and positions
          const actualImageWidth = currentImage.naturalWidth;
          const actualImageHeight = currentImage.naturalHeight;
          const displayedWidth = imageRect.width / currentScale;
          const displayedHeight = imageRect.height / currentScale;

          // Calculate scaling factors
          const scaleX = actualImageWidth / displayedWidth;
          const scaleY = actualImageHeight / displayedHeight;

          // Calculate crop coordinates in the original image space
          const cropX =
            ((cropRect.left - imageRect.left) / currentScale) * scaleX;
          const cropY =
            ((cropRect.top - imageRect.top) / currentScale) * scaleY;
          const cropWidth = (cropRect.width / currentScale) * scaleX;
          const cropHeight = (cropRect.height / currentScale) * scaleY;

          // Draw the cropped image
          ctx.drawImage(
            currentImage,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            canvas.width,
            canvas.height
          );

          // Update drop area and preview
          document.getElementsByClassName("editor-container")[0].style.display =
            "none";
          const dropArea = document.getElementById("dropArea");
          dropArea.style.backgroundImage = `url(${canvas.toDataURL()})`;
          dropArea.style.backgroundSize = "cover";
          dropArea.style.backgroundPosition = "center";
          facultyObj.photo = canvas.toDataURL();

          try {
            document.getElementsByClassName("img_prompt")[0].remove();
          } catch (err) {}

          return canvas.toDataURL();
        } catch (error) {
          console.error("Crop Error:", error);
          showNotification(
            "An error occurred while cropping. Please try again.",
            "error"
          );
          // alert("An error occurred while cropping. Please try again.");
        }
      }

      // Event Listeners for Upload
      dropArea.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => handleFile(e.target.files[0]);
        input.click();
      });

      dropArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropArea.classList.add("dragover");
      });

      dropArea.addEventListener("dragleave", () => {
        dropArea.classList.remove("dragover");
      });

      dropArea.addEventListener("drop", (e) => {
        e.preventDefault();
        dropArea.classList.remove("dragover");
        const file = e.dataTransfer.files[0];
        handleFile(file);
      });

      // Zoom Controls
      zoomSlider.addEventListener("input", (e) => {
        scale = parseFloat(e.target.value);
        if (currentImage) {
          currentImage.style.transform = `translate(${imageX}px, ${imageY}px) scale(${scale})`;
        }
      });

      zoomInButton.addEventListener("click", () => {
        if (scale < 3) {
          scale += 0.1;
          zoomSlider.value = scale;
          if (currentImage) {
            currentImage.style.transform = `translate(${imageX}px, ${imageY}px) scale(${scale})`;
          }
        }
      });

      zoomOutButton.addEventListener("click", () => {
        if (scale > 0.5) {
          scale -= 0.1;
          zoomSlider.value = scale;
          if (currentImage) {
            currentImage.style.transform = `translate(${imageX}px, ${imageY}px) scale(${scale})`;
          }
        }
      });
      document.getElementById("cropArea").addEventListener("wheel", (e) => {
        e.preventDefault();
        if (e.deltaY > 0) {
          zoomOutButton.click();
        } else if (e.deltaY < 0) {
          zoomInButton.click();
        }
      });
      function closeEditor() {
        document.getElementsByClassName("editor-container")[0].style.display =
          "none";
      }
      document.getElementById("closebtn").onclick = closeEditor;

      // Reset and Apply Buttons
      resetButton.addEventListener("click", resetImage);
      applyButton.addEventListener("click", applyCrop);
    }
    init_image_cropper();
    document.getElementById("next").onclick = () => {
      //Validating Entries
      let title_entry = document.getElementById("title").value;
      let doj_entry = document.getElementById("doj").value;
      let name = document.getElementById("faculty-name").value.trim();
      let designation = document.getElementById("designation").value;

      if (
        designation == "default" ||
        title_entry == "default" ||
        name.length == 0 ||
        doj_entry.trim().length == 0
      ) {
        showNotification("All fields are mandatory", "error");
        // alert("All fields are mandatory");
      } else if (name == "undefined") {
        showNotification("Some error occured. Try reloading the page", "error");
        // alert("Some error occured. Try reloading the page");
      } else if (facultyObj.photo == "") {
        showNotification("Upload Photo", "error");
        //alert("Upload Photo");
      } else {
        // Store the details in facultyObj
        facultyObj.title = title_entry;
        facultyObj.name = name;
        facultyObj.designation = document.getElementById(designation).innerHTML;
        facultyObj.doj = doj_entry;
        // Update UI
        document.getElementsByClassName("navigation-bar")[0].scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });

        document.getElementById("basic-details").style.background = "green";
        document.getElementsByClassName("completed")[0].style.width = "50%";

        // Clear current content
        document.getElementsByClassName("fdetails")[0].remove();

        // Trigger educational details tab
        if (typeof educationalDetails === "function") {
          educationalDetails.call(document.getElementById("edu-details"));
        } else {
          console.error("Educational details function not defined");
        }
      }
    };
  }
  async function educationalDetails() {
    try {
      document.getElementsByClassName("fdetails")[0]?.remove();
    } catch (err) {}

    this.classList.add("nav-button-clicked");
    let container = document.createElement("div");
    container.setAttribute("class", "fdetails");

    // Add the next button to the HTML template
    container.innerHTML = `
        <h2>Educational Details</h2>
        <hr class="hrdivide">
        
        <div class="qualification-section">
            <h3>UG Details</h3>
            <div class="inputs">
                <!-- UG details fields -->
                <div class="input-container">
                    <div class="input-group">
                        <input type="text" class="input-field" id="ug-degree" placeholder=" " required>
                        <label for="ug-degree" class="input-label">UG Degree (e.g., B.Tech, BE)</label>
                    </div>
                    <div class="input-group">
                        <input type="text" class="input-field" id="ug-specialization" placeholder=" " required>
                        <label for="ug-specialization" class="input-label">Specialization</label>
                    </div>
                </div>
                <div class="input-container">
                    <div class="input-group">
                        <input type="text" class="input-field" id="ug-institution" placeholder=" " required>
                        <label for="ug-institution" class="input-label">Institution</label>
                    </div>
                    <div class="input-group">
                        <input type="number" class="input-field" id="ug-year" placeholder=" " min="1950" max="2024" required>
                        <label for="ug-year" class="input-label">Year of Passing</label>
                    </div>
                </div>
            </div>
        </div>

        <div class="qualification-section">
            <h3>PG Details</h3>
            <div class="inputs">
                <!-- PG details fields -->
                <div class="input-container">
                    <div class="input-group">
                        <input type="text" class="input-field" id="pg-degree" placeholder=" " required>
                        <label for="pg-degree" class="input-label">PG Degree (e.g., M.Tech, ME)</label>
                    </div>
                    <div class="input-group">
                        <input type="text" class="input-field" id="pg-specialization" placeholder=" " required>
                        <label for="pg-specialization" class="input-label">Specialization</label>
                    </div>
                </div>
                <div class="input-container">
                    <div class="input-group">
                        <input type="text" class="input-field" id="pg-institution" placeholder=" " required>
                        <label for="pg-institution" class="input-label">Institution</label>
                    </div>
                    <div class="input-group">
                        <input type="number" class="input-field" id="pg-year" placeholder=" " min="1950" max="2024" required>
                        <label for="pg-year" class="input-label">Year of Passing</label>
                    </div>
                </div>
            </div>
        </div>

        <button class="add-phd-btn" id="add-phd">
            <span class="fa fa-plus"></span> Add PhD Details
        </button>

        <div id="phd-details" style="display: none;">
            <!-- PhD details section -->
        </div>

        <div id="supervisor-div" style="display: none;">
            <!-- Supervisor details section -->
        </div>

        <center>
            <button id="next" class="proceed">Next <span class="fa fa-solid fa-right-long"></span></button>
        </center>
    `;

    document.getElementsByClassName("workspace")[0].appendChild(container);
    container.style =
      "flex-direction:column;display:flex;justify-content:space-around;";

    // Populate saved data if it exists
    if (facultyObj && facultyObj.education) {
      // Populate UG details
      if (facultyObj.education.ug) {
        document.getElementById("ug-degree").value =
          facultyObj.education.ug.degree || "";
        document.getElementById("ug-specialization").value =
          facultyObj.education.ug.specialization || "";
        document.getElementById("ug-institution").value =
          facultyObj.education.ug.institution || "";
        document.getElementById("ug-year").value =
          facultyObj.education.ug.year || "";
      }

      // Populate PG details
      if (facultyObj.education.pg) {
        document.getElementById("pg-degree").value =
          facultyObj.education.pg.degree || "";
        document.getElementById("pg-specialization").value =
          facultyObj.education.pg.specialization || "";
        document.getElementById("pg-institution").value =
          facultyObj.education.pg.institution || "";
        document.getElementById("pg-year").value =
          facultyObj.education.pg.year || "";
      }

      // Show PhD section if it exists
      if (facultyObj.education.phd) {
        document.getElementById("phd-details").style.display = "block";
        document.getElementById("supervisor-div").style.display = "block";
        document.getElementById("add-phd").innerHTML =
          '<span class="fa fa-minus"></span> Remove PhD Details';
        // Add code to populate PhD fields here
      }
    }

    // Add PhD toggle functionality
    document.getElementById("add-phd").onclick = function () {
      const phdDetails = document.getElementById("phd-details");
      const supervisorDiv = document.getElementById("supervisor-div");
      if (phdDetails.style.display === "none") {
        phdDetails.style.display = "block";
        supervisorDiv.style.display = "block";
        this.innerHTML = '<span class="fa fa-minus"></span> Remove PhD Details';
      } else {
        phdDetails.style.display = "none";
        supervisorDiv.style.display = "none";
        this.innerHTML = '<span class="fa fa-plus"></span> Add PhD Details';
      }
    };

    // Add next button functionality
    document.getElementById("next").onclick = function () {
      // Validate and save education details
      const ugDegree = document.getElementById("ug-degree").value.trim();
      const ugSpec = document.getElementById("ug-specialization").value.trim();
      const ugInst = document.getElementById("ug-institution").value.trim();
      const ugYear = document.getElementById("ug-year").value.trim();

      const pgDegree = document.getElementById("pg-degree").value.trim();
      const pgSpec = document.getElementById("pg-specialization").value.trim();
      const pgInst = document.getElementById("pg-institution").value.trim();
      const pgYear = document.getElementById("pg-year").value.trim();

      if (
        !ugDegree ||
        !ugSpec ||
        !ugInst ||
        !ugYear ||
        !pgDegree ||
        !pgSpec ||
        !pgInst ||
        !pgYear
      ) {
        showNotification("Please fill all UG and PG details", "error");
        return;
      }

      // Save the details to facultyObj
      facultyObj.education = {
        ug: {
          degree: ugDegree,
          specialization: ugSpec,
          institution: ugInst,
          year: ugYear,
        },
        pg: {
          degree: pgDegree,
          specialization: pgSpec,
          institution: pgInst,
          year: pgYear,
        },
      };

      // Update UI
      document.getElementById("edu-details").style.background = "green";
      document.getElementsByClassName("completed")[0].style.width = "100%";

      // Move to next section
      document.getElementsByClassName("fdetails")[0].remove();
      document.getElementById("upload").click();
    };
  }
  async function roadMap(ele) {
    // Clear existing content
    ele.innerHTML = "";

    // Add the navigation bar
    ele.innerHTML = `
      <div class="navigation-bar">
        <div class="navigation-line">
          <div class="completed"></div>
        </div>
        <div class="nav-button-wrapper">
          <button id='basic-details' class="nav-button" data-section="basic-details">
            <span class="fa fa-solid fa-clipboard"></span>
          </button>
          <p>Basic<br>Details</p>
        </div>
        <div class="nav-button-wrapper">
          <button id='edu-details' class="nav-button" data-section="educational-details">
            <span class="fa fa-solid fa-book"></span>
          </button>
          <p>Education<br>Details</p>
        </div>
        <div class="nav-button-wrapper">
          <button id='upload' class="nav-button" data-section="research-papers">
            <span class="fa fa-solid fa-cloud-arrow-up"></span>
          </button>
          <p>Review and Upload <br>Details</p>
        </div>
      </div>
    `;

    // Add event listeners
    document.getElementById("basic-details").onclick = basicDetails;
    document.getElementById("edu-details").onclick = educationalDetails;
    document.getElementById("upload").onclick = uploadDetails;
  }
  await auth.onAuthStateChanged(async (user) => {
    if (user) {
      useremail = user.email;

      // Initialize facultyObj with user data
      try {
        const deptSnapshot = await db.collection("SRMVDP departments").get();
        for (const dept of deptSnapshot.docs) {
          const facultyRef = db
            .collection(`SRMVDP departments/${dept.id}/faculties`)
            .doc(useremail);
          const facultyDoc = await facultyRef.get();

          if (facultyDoc.exists) {
            // Update facultyObj with database data
            facultyObj = {
              ...facultyObj, // Keep default structure
              ...facultyDoc.data(), // Override with database values
            };
            break;
          }
        }
      } catch (error) {
        console.error("Error initializing faculty data:", error);
      }

      // Check if it's a valid SRM email
      validuser = user.email.endsWith("@srmist.edu.in");

      const signOut = document.createElement("button");
      signOut.innerHTML = `<span class="fa fa-solid fa-door-open"></span>  Sign Out`;
      signOut.id = "signOut";
      signOut.onclick = async function () {
        try {
          await auth.signOut();
          window.location.reload();
        } catch (error) {
          console.error("Error signing out:", error);
          showNotification("Error signing out. Please try again.", "error");
          // alert("Error signing out. Please try again.");
        }
      };

      if (!validuser) {
        showNotification(
          "Invalid User! Please use your SRM email to login.",
          "error"
        );
        // alert("Invalid User! Please use your SRM email to login.");
        await auth.signOut();
        window.location.reload();
        return;
      }

      // Check if faculty exists and has access
      let foundFaculty = false;
      let hasAccess = true;

      await db
        .collection(`SRMVDP departments`)
        .get()
        .then(async (res) => {
          for (const dept of res.docs) {
            const facultyRef = await db
              .collection(`SRMVDP departments/${dept.id}/faculties`)
              .doc(useremail)
              .get();

            if (facultyRef.exists) {
              foundFaculty = true;
              const data = facultyRef.data();
              facultyObj = { ...facultyObj, ...data };

              // Check if dateOfLeaving exists
              if (data.dateOfLeaving) {
                hasAccess = false;
              }
              break; // Exit the loop once we find the faculty
            }
          }
        });

      if (!hasAccess) {
        window.alert(
          "You no longer have access to this portal. Please contact the administrator."
        );
        await auth.signOut();
        window.location.reload();
        return;
      }

      // If we get here, user is valid and has access
      document.getElementsByClassName("btns")[0].appendChild(signOut);
      document.getElementById("login").setAttribute("class", "loggedin");
      document.getElementById("login").innerHTML = `${user.displayName[0]}`;
      document.getElementById("useracronym").title = user.email;

      // HOD-specific access
      // if ((await user.email.split(".")[0]) == "hod") {
      if (user.email == "vp7986@srmist.edu.in") {
        // Add HOD-specific buttons and functionality here
        const button = document.createElement("button");
        button.innerHTML = `<span class="fa fa-solid fa-user-plus"></span>  Add Faculty`;
        button.id = "addFacultyButton";
        document.getElementsByClassName("btns")[0].appendChild(button);

        const delUser = document.createElement("button");
        delUser.innerHTML = `<span class="fa fa-solid fa-user-minus"></span>  Remove Faculty`;
        delUser.id = "removeFacultyButton";
        document.getElementsByClassName("btns")[0].appendChild(delUser);

        // Add Faculty button click handler
        document.getElementById("addFacultyButton").onclick =
          async function () {
            let workspace = document.getElementsByClassName("workspace")[0];
            workspace.innerHTML = `
            <div class="faculty-details">
              <center><h2>Enter Faculty Details</h2></center>
              <div class="input-group">
                <input type="text" id="fname" class="input-field" placeholder=" " required>
                <label for="name" class="input-label">Faculty Name</label>
              </div>
              <div class="input-group">
                <input type="text" id="netid" class="input-field" placeholder=" " required>
                <label for="netid" class="input-label">Net ID </label>
              </div>
              <button id="addUserButton">
                <span class="spinner" style="display: none;">
                  <i class="fa fa-spinner fa-spin"></i>
                </span>
                <span class="button-text">
                  <span class="fa fa-user-plus"></span> Add Faculty
                </span>
              </button>
            </div>
          `;

            document.getElementById("addUserButton").onclick =
              async function () {
                const button = this;
                const spinner = button.querySelector(".spinner");
                const buttonText = button.querySelector(".button-text");

                // Validating entries
                let name = document.getElementById("fname").value.trim();
                let netid = document
                  .getElementById("netid")
                  .value.trim()
                  .toLowerCase();

                if (!name.length || !netid.length) {
                  showNotification("All fields are mandatory", "error");
                  // alert("All fields are mandatory");
                  return;
                }

                // Remove @srmist.edu.in if user entered it
                netid = netid.replace(/@srmist\.edu\.in$/, "");

                // Create the full email
                const fullEmail = `${netid}@srmist.edu.in`;

                // Show loading state
                button.disabled = true;
                spinner.style.display = "inline-block";
                buttonText.style.display = "none";

                try {
                  let dept = "cseetech";
                  const facultiesRef = await db
                    .collection(`SRMVDP departments/${dept}/faculties`)
                    .get();

                  // Check if faculty already exists (check both netid and full email)
                  const exists = facultiesRef.docs.some(
                    (doc) => doc.id === netid || doc.id === fullEmail
                  );

                  if (exists) {
                    showNotification(
                      "Unable to Add New Faculty!\nFaculty already exists",
                      "error"
                    );
                    // alert("Unable to Add New Faculty!\nFaculty already exists");
                    return;
                  }

                  // Add new faculty with initial details
                  await db
                    .collection(`SRMVDP departments/${dept}/faculties`)
                    .doc(fullEmail) // Always use full email as document ID
                    .set({
                      name: name,
                      netid: netid, // Store just the netid part
                      isnewUser: true,
                      joiningDate: new Date().toISOString().split("T")[0],
                      email: fullEmail, // Store full email
                      activities: {},
                      education: {},
                      photo: "",
                    });

                  showNotification("Faculty added successfully", "success");
                  document.getElementById("fname").value = "";
                  document.getElementById("netid").value = "";
                } catch (error) {
                  console.error("Error adding faculty:", error);
                  showNotification(
                    "Error adding faculty. Please try again.",
                    "error"
                  );
                  //alert("Error adding faculty. Please try again.");
                } finally {
                  // Restore button state
                  button.disabled = false;
                  spinner.style.display = "none";
                  buttonText.style.display = "inline-block";
                }
              };
          };

        // Remove Faculty button click handler
        document.getElementById("removeFacultyButton").onclick =
          async function () {
            let workspace = document.getElementsByClassName("workspace")[0];
            workspace.innerHTML = `
            <div class="faculty-details">
              <center><h2>Remove Faculty</h2></center>
              <div class="faculty-list">
                <div class="search-container">
                  <input 
                    type="text" 
                    id="facultySearch" 
                    placeholder="Search by name or Net ID..."
                    class="search-input"
                  >
                  <div class="search-icon">
                    <span class="fa fa-search"></span>
                  </div>
                </div>
                <h3>Current Faculty Members</h3>
                <div id="facultyContainer" class="faculty-grid">
                  Loading faculty data...
                </div>
              </div>
            </div>
          `;

            try {
              // Fetch all faculty members
              let dept = "cseetech";
              const facultiesRef = db.collection(
                `SRMVDP departments/${dept}/faculties`
              );
              const snapshot = await facultiesRef.get();

              const facultyContainer =
                document.getElementById("facultyContainer");
              const facultySearch = document.getElementById("facultySearch");

              if (snapshot.empty) {
                facultyContainer.innerHTML = "<p>No faculty members found.</p>";
                return;
              }

              // Store only active faculty data (without dateOfLeaving)
              const facultyData = [];
              snapshot.forEach((doc) => {
                const faculty = doc.data();
                // Only include faculty members who don't have dateOfLeaving
                if (!faculty.dateOfLeaving) {
                  const email = doc.id;
                  const netId = email.split("@")[0];
                  facultyData.push({ ...faculty, email, netId });
                }
              });

              if (facultyData.length === 0) {
                facultyContainer.innerHTML =
                  "<p>No active faculty members found.</p>";
                return;
              }

              // Function to render faculty cards
              function renderFacultyCards(facultiesToRender) {
                if (facultiesToRender.length === 0) {
                  facultyContainer.innerHTML =
                    "<p>No matching faculty found.</p>";
                  return;
                }

                let facultyHTML = "";
                facultiesToRender.forEach((faculty) => {
                  facultyHTML += `
                  <div class="faculty-card">
                    <img src="${
                      faculty.photo || "assets/images/default-avatar.png"
                    }" 
                         alt="${faculty.name}" 
                         class="faculty-avatar">
                    <div class="faculty-info">
                      <h4>${faculty.name || "N/A"}</h4>
                      <p>Net ID: ${faculty.netId}</p>
                      <p>Designation: ${faculty.designation || "N/A"}</p>
                      <p>Joining Date: ${formatDate(faculty.doj)}</p>
                    </div>
                    <button class="remove-faculty-btn" data-email="${
                      faculty.email
                    }">
                      <span class="fa fa-user-minus"></span> Remove
                    </button>
                  </div>
                `;
                });
                facultyContainer.innerHTML = facultyHTML;

                // Reattach event listeners
                attachRemoveButtonListeners();
              }

              // Function to attach remove button listeners
              function attachRemoveButtonListeners() {
                document
                  .querySelectorAll(".remove-faculty-btn")
                  .forEach((button) => {
                    button.onclick = async function () {
                      const email = this.getAttribute("data-email");
                      const facultyCard = this.closest(".faculty-card");
                      const facultyName =
                        facultyCard.querySelector("h4").textContent;

                      // Create and show the modal
                      const modal = document.createElement("div");
                      modal.className = "remove-faculty-modal";
                      modal.innerHTML = `
                      <div class="modal-content">
                        <h3>Remove Faculty Member</h3>
                        <p>Are you sure you want to remove ${facultyName}?</p>
                        <div class="date-picker-container">
                          <label for="dateOfLeaving">Date of Leaving:</label>
                          <input type="date" id="dateOfLeaving" required>
                        </div>
                        <div class="modal-buttons">
                          <button class="confirm-remove">
                            <span class="fa fa-check"></span> Confirm
                          </button>
                          <button class="cancel-remove">
                            <span class="fa fa-times"></span> Cancel
                          </button>
                        </div>
                      </div>
                    `;

                      document.body.appendChild(modal);

                      // Set max date to today
                      const dateInput = modal.querySelector("#dateOfLeaving");
                      dateInput.max = new Date().toISOString().split("T")[0];

                      // Handle cancel
                      modal.querySelector(".cancel-remove").onclick = () => {
                        modal.remove();
                      };

                      // Handle confirm
                      modal.querySelector(".confirm-remove").onclick =
                        async () => {
                          const leavingDate = dateInput.value;

                          if (!leavingDate) {
                            showNotification("Please select a date", "error");
                            //alert("Please select a date");
                            return;
                          }

                          try {
                            const facultyRef = db
                              .collection(
                                `SRMVDP departments/${dept}/faculties`
                              )
                              .doc(email);

                            await facultyRef.update({
                              dateOfLeaving: formatDate(leavingDate),
                            });

                            // Remove from facultyData array
                            const index = facultyData.findIndex(
                              (f) => f.email === email
                            );
                            if (index > -1) {
                              facultyData.splice(index, 1);
                            }

                            // Animate and remove the faculty card
                            facultyCard.style.animation = "fadeOut 0.5s ease";
                            setTimeout(() => {
                              facultyCard.remove();
                              if (facultyContainer.children.length === 0) {
                                facultyContainer.innerHTML =
                                  "<p>No active faculty members found.</p>";
                              }
                            }, 500);

                            showNotification(
                              `${facultyName} has been marked as inactive.`,
                              "success"
                            );
                            modal.remove();
                          } catch (error) {
                            console.error("Error removing faculty:", error);
                            showNotification(
                              "Error removing faculty. Please try again.",
                              "error"
                            );
                          }
                        };
                    };
                  });
              }

              // Initial render
              renderFacultyCards(facultyData);

              // Add search functionality
              facultySearch.addEventListener("input", (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filteredFaculty = facultyData.filter((faculty) => {
                  const nameMatch = (faculty.name || "")
                    .toLowerCase()
                    .includes(searchTerm);
                  const netIdMatch = faculty.netId
                    .toLowerCase()
                    .includes(searchTerm);
                  return nameMatch || netIdMatch;
                });
                renderFacultyCards(filteredFaculty);
              });
            } catch (error) {
              console.error("Error fetching faculty data:", error);
              document.getElementById("facultyContainer").innerHTML =
                "<p>Error loading faculty data. Please try again.</p>";
            }
          };

        return; // Exit early for HOD
      }

      // Only proceed if we found the faculty data
      if (foundFaculty) {
        const editProfile = document.createElement("button");
        editProfile.innerHTML = `<span class="fa fa-solid fa-pencil"></span>  Edit Profile`;
        editProfile.id = "editProfile";
        document.getElementsByClassName("btns")[0].appendChild(editProfile);

        // Add click handler for edit profile
        editProfile.onclick = async function () {
          const workspace = document.getElementsByClassName("workspace")[0];

          // Show loading animation
          workspace.innerHTML = `
            <div class="loading-profile">
              <div class="loading-spinner-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
              </div>
              <p>Loading profile data...</p>
            </div>
          `;

          // Refresh faculty data before showing the form
          try {
            const deptSnapshot = await db
              .collection("SRMVDP departments")
              .get();
            for (const dept of deptSnapshot.docs) {
              const facultyRef = db
                .collection(`SRMVDP departments/${dept.id}/faculties`)
                .doc(useremail);
              const facultyDoc = await facultyRef.get();

              if (facultyDoc.exists) {
                // Update facultyObj with latest data while preserving structure
                facultyObj = {
                  ...facultyObj, // Keep default structure
                  ...facultyDoc.data(), // Override with latest database values
                };
                break;
              }
            }

            await roadMap(workspace);
            document.getElementById("basic-details").click();
          } catch (error) {
            console.error("Error fetching faculty data:", error);
            workspace.innerHTML = `
              <div class="error-message">
                <span class="fa fa-exclamation-circle"></span>
                Error loading your profile data. Please try again.
              </div>
            `;
          }
        };

        let activity = document.createElement("button");
        activity.innerHTML = `<span class="fa fa-solid fa-scroll"></span> Activity Records`;
        document.getElementsByClassName("btns")[0].appendChild(activity);
        activity.onclick = activities;

        let displayPortal = document.createElement("button");
        displayPortal.innerHTML = `<span class="fa fa-solid fa-info-circle"></span> Information Dashboard`;
        document.getElementsByClassName("btns")[0].appendChild(displayPortal);

        // Change the onclick event to navigate to display_portal.html
        displayPortal.onclick = function () {
          window.open("display_portal.html", "_blank");
        };
      } else {
        showNotification(
          "Your account has not been added to the faculty database. Please contact the administrator.",
          "error"
        );
        // alert(
        //   "Your account has not been added to the faculty database. Please contact the administrator."
        // );
      }
    }
  });

  // Update the setupModifyEventListeners function
  function setupModifyEventListeners() {
    // Add event listeners for dropdown toggles
    const dropdownButtons = document.querySelectorAll('[id$="_btn"]');
    dropdownButtons.forEach((button) => {
      button.onclick = () => {
        const targetId = button.id.replace("_btn", "");
        const targetDiv = document.getElementById(targetId);

        // Close all other dropdowns first
        document.querySelectorAll(".displayArray").forEach((div) => {
          if (div.id !== targetId) {
            div.style.display = "none";
          }
        });

        // Toggle current dropdown
        if (targetDiv) {
          targetDiv.style.display =
            targetDiv.style.display === "none" ? "block" : "none";
        }
      };
    });

    // Add event listeners for activity buttons
    const activityButtons = document.querySelectorAll(".activity_save");
    activityButtons.forEach((button) => {
      button.onclick = function () {
        const activityType = this.getAttribute("data-activity");
        const activityDetails = JSON.parse(this.getAttribute("data-details"));

        // Show form and populate fields
        const additionalFields = document.getElementById("additionalFields");
        additionalFields.style.display = "block";
        additionalFields.classList.add("visible");

        // First reset the form to its default state
        additionalFields.innerHTML = `
          <div class="form-group default-field">
            <label for="programTitle">Program Title *</label>
            <input
              type="text"
              id="programTitle"
              placeholder="Enter program title"
              required
            />
          </div>

          <div class="form-group default-field">
            <label>Duration *</label>
            <div class="date-inputs">
              <div class="date-field">
                <label>Start Date</label>
                <div class="date-wrapper">
                  <input type="date" id="startDate" required />
                </div>
              </div>
              <div class="date-field">
                <label>End Date</label>
                <div class="date-wrapper">
                  <input type="date" id="endDate" required />
                </div>
            </div>
          </div>

          <div class="form-group default-field">
            <label for="organization">Organization *</label>
            <input
              type="text"
              id="organization"
              placeholder="Enter organization name"
              required
            />
          </div>

          <div class="form-group default-field">
            <label for="certificateLink">Certificate Link (Optional)</label>
            <input
              type="url"
              id="certificateLink"
              placeholder="https://..."
            />
          </div>
        `;

        if (activityType === "research_paper") {
          // Show research paper specific fields
          const researchFields = document.createElement("div");
          researchFields.className = "research-paper-fields";
          researchFields.innerHTML = `
            <div class="form-group">
              <label>Paper Title</label>
              <input type="text" class="input-field" id="programTitle" value="${
                activityDetails.prgmTitle || ""
              }" placeholder="Enter paper title">
            </div>

            <div class="paper-type-container">
              <label class="paper-type-label">Paper Type</label>
              <div class="radio-group">
                <div class="radio-option">
                  <input type="radio" id="journal" name="paperType" value="journal" ${
                    activityDetails.paperType === "journal" ? "checked" : ""
                  }>
                  <label for="journal">
                    <div class="custom-radio"></div>
                    <span>Journal</span>
                  </label>
                </div>
                <div class="radio-option">
                  <input type="radio" id="conference" name="paperType" value="conference" ${
                    activityDetails.paperType === "conference" ? "checked" : ""
                  }>
                  <label for="conference">
                    <div class="custom-radio"></div>
                    <span>Conference</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="authors-container">
              <label>Authors</label>
              <div class="authors-list">
                ${(activityDetails.authors || [])
                  .map(
                    (author) => `
                  <div class="author-entry">
                    <input type="text" class="input-field" value="${author}" placeholder="Enter author name">
                    <button type="button" class="remove-author-btn">
                      <span class="fa fa-times"></span>
                    </button>
                  </div>
                `
                  )
                  .join("")}
              </div>
              <button type="button" class="add-author-btn">
                <span class="fa fa-plus"></span> Add Author
              </button>
            </div>
            
            <div class="form-group">
              <label>DOI</label>
              <input type="text" class="input-field" id="doi" value="${
                activityDetails.doi || ""
              }" placeholder="Enter DOI">
              <small class="helper-text">
                Enter DOI with or without 'https://doi.org/'. Examples:<br>
                - 10.1000/xyz123<br>
                - https://doi.org/10.1000/xyz123
              </small>
            </div>
            
            <div class="form-group">
              <label>Indexed Journal</label>
              <select class="input-field" id="indexedJournal">
                <option value="">Select...</option>
                <option value="yes" ${
                  activityDetails.indexedJournal === "yes" ? "selected" : ""
                }>Yes</option>
                <option value="no" ${
                  activityDetails.indexedJournal === "no" ? "selected" : ""
                }>No</option>
              </select>
            </div>

            <div class="form-group">
              <label>Impact Factor</label>
              <input type="number" step="0.01" class="input-field" id="impactFactor" value="${
                activityDetails.impactFactor || ""
              }" placeholder="e.g., 2.5">
            </div>

            <div class="form-group">
              <label>ISBN/ISSN Number</label>
              <input type="text" class="input-field" id="isbnNumber" value="${
                activityDetails.isbnNumber || ""
              }" placeholder="Enter ISBN/ISSN number">
            </div>

            <div class="input-container">
              <div class="input-group">
                <label>Volume Number</label>
                <input type="text" class="input-field" id="volumeNumber" value="${
                  activityDetails.volumeNumber || ""
                }" placeholder="Enter volume number">
              </div>
              <div class="input-group">
                <label>Issue Number</label>
                <input type="text" class="input-field" id="issueNumber" value="${
                  activityDetails.issueNumber || ""
                }" placeholder="Enter issue number">
              </div>
            </div>

            <div class="input-container">
              <div class="input-group">
                <label>Year</label>
                <input type="number" class="input-field" id="publicationYear" value="${
                  activityDetails.publicationYear || ""
                }" min="1900" max="2099">
              </div>
              <div class="input-group">
                <label>Month</label>
                <select class="input-field" id="publicationMonth">
                  <option value="">Select month...</option>
                  ${Array.from({ length: 12 }, (_, i) => i + 1)
                    .map(
                      (month) => `
                    <option value="${month}" ${
                        activityDetails.publicationMonth == month
                          ? "selected"
                          : ""
                      }>${new Date(2000, month - 1).toLocaleString("default", {
                        month: "long",
                      })}</option>
                  `
                    )
                    .join("")}
                </select>
              </div>
            </div>

            <div class="input-container">
              <div class="input-group">
                <label>Pages From</label>
                <input type="number" class="input-field" id="pagesFrom" value="${
                  activityDetails.pagesFrom || ""
                }" min="1">
              </div>
              <div class="input-group">
                <label>Pages To</label>
                <input type="number" class="input-field" id="pagesTo" value="${
                  activityDetails.pagesTo || ""
                }" min="1">
              </div>
            </div>

            <div class="form-group">
              <label>Publisher</label>
              <input type="text" class="input-field" id="publisher" value="${
                activityDetails.publisher || ""
              }" placeholder="Enter publisher name">
            </div>

            <div class="form-group">
              <label>Journal</label>
              <input type="text" class="input-field" id="journal" value="${
                activityDetails.journal || ""
              }" placeholder="Enter journal name">
            </div>
          `;

          // Replace default fields with research paper fields
          additionalFields.innerHTML = "";
          additionalFields.appendChild(researchFields);

          // Initialize author addition functionality
          const authorsList = researchFields.querySelector(".authors-list");
          const addAuthorBtn = researchFields.querySelector(".add-author-btn");

          addAuthorBtn.onclick = function () {
            const authorDiv = document.createElement("div");
            authorDiv.className = "author-entry";
            authorDiv.innerHTML = `
              <input type="text" class="input-field" placeholder="Enter author name">
              <button type="button" class="remove-author-btn">
                <span class="fa fa-times"></span>
              </button>
            `;
            authorsList.appendChild(authorDiv);

            // Add remove functionality
            authorDiv.querySelector(".remove-author-btn").onclick =
              function () {
                authorDiv.remove();
              };
          };

          // Add remove functionality to existing author entries
          document.querySelectorAll(".remove-author-btn").forEach((btn) => {
            btn.onclick = function () {
              this.closest(".author-entry").remove();
            };
          });
        } else {
          // Handle other activity types
          document.getElementById("programTitle").value =
            activityDetails.prgmTitle || "";
          document.getElementById("startDate").value =
            activityDetails.startDate || "";
          document.getElementById("endDate").value =
            activityDetails.endDate || "";
          document.getElementById("organization").value =
            activityDetails.org || "";
          document.getElementById("certificateLink").value =
            activityDetails.certLink || "";
        }

        // Add update and delete buttons
        const buttonContainer = document.createElement("center");
        buttonContainer.className = "update-delete-buttons";
        buttonContainer.innerHTML = `
          <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
            <button id="updateActivity" class="update-btn">
              <span class="fa fa-check"></span> Update
            </button>
            <button id="deleteActivity" class="delete-btn">
              <span class="fa fa-trash"></span> Delete
            </button>
          </div>
        `;

        additionalFields.appendChild(buttonContainer);

        // Add event listeners for update and delete
        document.getElementById("updateActivity").onclick = async function (e) {
          e.preventDefault();
          if (activityType === "research_paper") {
            await updateResearchPaper(activityType, activityDetails);
          } else {
            if (!validateActivityForm()) return;
            await updateActivity(activityType, activityDetails);
          }
        };

        document.getElementById("deleteActivity").onclick = async function (e) {
          e.preventDefault();
          await deleteActivity(activityType, activityDetails);
        };
      };
    });
  }

  // Add this helper function to validate the form
  function validateActivityForm() {
    const prgmTitle = document.getElementById("programTitle").value.trim();
    const startDate = document.getElementById("startDate").value.trim();
    const endDate = document.getElementById("endDate").value.trim();
    const org = document.getElementById("organization").value.trim();

    if (!prgmTitle || !startDate || !endDate || !org) {
      showNotification("Please fill in all required fields", "error");
      // alert("Please fill in all required fields");
      return false;
    }

    if (new Date(endDate) < new Date(startDate)) {
      showNotification("End date must be after start date", "error");
      // alert("End date must be after start date");
      return false;
    }

    return true;
  }

  // Add these helper functions for update and delete operations
  async function updateActivity(activityType, originalActivity) {
    showLoading(); // Show loading animation
    try {
      const updatedActivity = {
        prgmTitle: document.getElementById("programTitle").value,
        startDate: document.getElementById("startDate").value,
        endDate: document.getElementById("endDate").value,
        org: document.getElementById("organization").value,
        certLink: document.getElementById("certificateLink").value,
      };

      const deptSnapshot = await db.collection("SRMVDP departments").get();
      for (const dept of deptSnapshot.docs) {
        const facultyRef = db
          .collection(`SRMVDP departments/${dept.id}/faculties`)
          .doc(useremail);
        const facultyDoc = await facultyRef.get();

        if (facultyDoc.exists) {
          const activities = facultyDoc.data().activities || {};
          const activityList = activities[activityType] || [];

          // Find and update the activity
          const index = activityList.findIndex(
            (activity) =>
              activity.prgmTitle === originalActivity.prgmTitle &&
              activity.startDate === originalActivity.startDate
          );

          if (index !== -1) {
            activityList[index] = updatedActivity;
            await facultyRef.update({
              [`activities.${activityType}`]: activityList,
            });
            showNotification("Activity updated successfully", "success");
            // alert("Activity updated successfully");
            await showExistingActivities(); // Refresh the display
          }
        }
      }
    } catch (error) {
      console.error("Error updating activity:", error);
      showNotification("Failed to update activity", "error");
      // alert("Failed to update activity");
    } finally {
      hideLoading(); // Hide loading animation
    }
  }

  async function deleteActivity(activityType, activityToDelete) {
    if (confirm("Are you sure you want to delete this activity?")) {
      showLoading(); // Show loading animation
      try {
        const deptSnapshot = await db.collection("SRMVDP departments").get();
        for (const dept of deptSnapshot.docs) {
          const facultyRef = db
            .collection(`SRMVDP departments/${dept.id}/faculties`)
            .doc(useremail);
          const facultyDoc = await facultyRef.get();

          if (facultyDoc.exists) {
            const activities = facultyDoc.data().activities || {};
            const activityList = activities[activityType] || [];

            // Filter out the activity to delete
            const updatedList = activityList.filter(
              (activity) =>
                activity.prgmTitle !== activityToDelete.prgmTitle ||
                activity.startDate !== activityToDelete.startDate
            );

            await facultyRef.update({
              [`activities.${activityType}`]: updatedList,
            });
            showNotification("Activity deleted successfully", "success");
            // alert("Activity deleted successfully");
            await showExistingActivities(); // Refresh the display
          }
        }
      } catch (error) {
        console.error("Error deleting activity:", error);
        showNotification("Failed to delete activity", "error");
        // alert("Failed to delete activity");
      } finally {
        hideLoading(); // Hide loading animation
      }
    }
  }

  // Add this new function to handle buffered submissions
  async function submitBufferedActivities() {
    showLoading(); // Show loading animation
    try {
      const deptSnapshot = await db.collection("SRMVDP departments").get();
      for (const dept of deptSnapshot.docs) {
        const facultyRef = db
          .collection(`SRMVDP departments/${dept.id}/faculties`)
          .doc(useremail);
        const facultyDoc = await facultyRef.get();

        if (facultyDoc.exists) {
          const currentData = facultyDoc.data();
          const activities = currentData.activities || {};

          // Merge buffered activities with existing ones
          for (const [type, items] of Object.entries(activityBuffer)) {
            if (items.length > 0) {
              activities[type] = [...(activities[type] || []), ...items];
            }
          }

          // Update database
          await facultyRef.update({ activities });

          // Clear buffer
          activityBuffer = {
            fdp: [],
            workshop: [],
            conference: [],
            seminar: [],
            uhv: [],
            fiip: [],
            orientation: [],
            moocs: [],
            resource_person: [],
            research_paper: [],
            others: [],
          };

          showNotification(
            "All activities have been submitted successfully!",
            "success"
          );
          // alert("All activities have been submitted successfully!");

          // Refresh the display
          await showActivityForm();
        }
      }
    } catch (error) {
      console.error("Error submitting activities:", error);
      showNotification(
        "Failed to submit activities. Please try again.",
        "error"
      );
      // alert("Failed to submit activities. Please try again.");
    } finally {
      hideLoading(); // Hide loading animation
    }
  }

  // Add this new function to handle buffer-specific events
  function setupBufferEventListeners() {
    // Handle remove buttons
    document.querySelectorAll(".remove-buffer-item").forEach((button) => {
      button.onclick = function (e) {
        e.preventDefault();
        const type = this.dataset.type;
        const index = parseInt(this.dataset.index);
        activityBuffer[type].splice(index, 1);
        showActivityForm(); // Refresh the display
      };
    });

    // Handle submit all button
    const submitAllBtn = document.getElementById("submitAllBuffered");
    if (submitAllBtn) {
      submitAllBtn.onclick = async function (e) {
        e.preventDefault();
        await submitBufferedActivities();
      };
    }

    // Handle dropdown toggles
    const dropdownButtons = document.querySelectorAll('[id$="_btn"]');
    dropdownButtons.forEach((button) => {
      button.onclick = () => {
        const targetId = button.id.replace("_btn", "");
        const targetDiv = document.getElementById(targetId);
        if (targetDiv) {
          targetDiv.style.display =
            targetDiv.style.display === "none" ? "block" : "none";
        }
      };
    });
  }

  function showLoading() {
    document.getElementById("loadingOverlay").style.display = "flex";
  }

  function hideLoading() {
    document.getElementById("loadingOverlay").style.display = "none";
  }

  // Add this new function to handle research paper updates
  async function updateResearchPaper(activityType, originalActivity) {
    showLoading();
    try {
      const updatedPaper = {
        prgmTitle: document.getElementById("programTitle").value,
        paperType: document.querySelector('input[name="paperType"]:checked')
          ?.value,
        authors: Array.from(document.querySelectorAll(".author-entry input"))
          .map((input) => input.value.trim())
          .filter((value) => value !== ""),
        doi: document.getElementById("doi").value,
        indexedJournal: document.getElementById("indexedJournal").value,
        impactFactor: document.getElementById("impactFactor").value,
        isbnNumber: document.getElementById("isbnNumber").value,
        volumeNumber: document.getElementById("volumeNumber").value,
        issueNumber: document.getElementById("issueNumber").value,
        publicationYear: document.getElementById("publicationYear").value,
        publicationMonth: document.getElementById("publicationMonth").value,
        pagesFrom: document.getElementById("pagesFrom").value,
        pagesTo: document.getElementById("pagesTo").value,
        publisher: document.getElementById("publisher").value,
        journal: document.getElementById("journal").value,
      };

      const deptSnapshot = await db.collection("SRMVDP departments").get();
      for (const dept of deptSnapshot.docs) {
        const facultyRef = db
          .collection(`SRMVDP departments/${dept.id}/faculties`)
          .doc(useremail);
        const facultyDoc = await facultyRef.get();

        if (facultyDoc.exists) {
          const activities = facultyDoc.data().activities || {};
          const papersList = activities[activityType] || [];

          // Find and update the paper
          const index = papersList.findIndex(
            (paper) =>
              paper.prgmTitle === originalActivity.prgmTitle &&
              paper.doi === originalActivity.doi
          );

          if (index !== -1) {
            papersList[index] = updatedPaper;
            await facultyRef.update({
              [`activities.${activityType}`]: papersList,
            });
            showNotification("Research paper updated successfully", "success");
            await showExistingActivities();
          }
        }
      }
    } catch (error) {
      console.error("Error updating research paper:", error);
      showNotification("Failed to update research paper", "error");
    } finally {
      hideLoading();
    }
  }
})();
