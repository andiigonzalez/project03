console.log("IT’S ALIVE!");


function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}


const ARE_WE_HOME = document.documentElement.classList.contains("home");


const pages = [
  { url: "https://andiigonzalez.github.io/project03/index.html", title: "Home" },
  { url: "https://andiigonzalez.github.io/project03/design.html", title: "Design Rationale" }, 
  { url: "https://andiigonzalez.github.io/project03/development.html", title: "Process Development"},
];
const BASE_URL = "https://andiigonzalez.github.io/project3/";
let nav = document.createElement("nav");
let ul = document.createElement("ul");
nav.appendChild(ul);
document.body.prepend(nav);

for (const p of pages) {
  let url = p.url;
  let title = p.title;

  if (!url.startsWith("http")) {
  url = BASE_URL + url;
}

  const a = document.createElement("a");
  a.href = url;
  a.textContent = title;


  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );


  if (p.external) {
    a.target = "_blank";
  }

  const li = document.createElement("li");
  li.appendChild(a);
  ul.appendChild(li);
}
// Automatic detection of the OS color scheme
const osDarkMode = matchMedia("(prefers-color-scheme: dark)").matches;
const osLightMode = matchMedia("(prefers-color-scheme: light)").matches;

document.body.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);


const select = document.querySelector(".color-scheme select");
const savedScheme = localStorage.colorScheme || (osDarkMode ? "dark" : "light dark");
document.documentElement.style.setProperty("color-scheme", savedScheme);
if (savedScheme === "dark") {
  document.documentElement.classList.add("dark-mode");
} else if (savedScheme === "light") {
  document.documentElement.classList.add("light-mode");
}
select.value = savedScheme;


select.addEventListener("input", function (event) {
  const colorScheme = event.target.value;
  document.documentElement.classList.remove("dark-mode", "light-mode");

  if (colorScheme === "dark") {
    document.documentElement.classList.add("dark-mode");
    document.documentElement.style.setProperty("color-scheme", "dark");
  } else if (colorScheme === "light") {
    document.documentElement.classList.add("light-mode");
    document.documentElement.style.setProperty("color-scheme", "light");
  } else {
  
    document.documentElement.style.setProperty("color-scheme", "light dark");
  }

  localStorage.colorScheme = colorScheme;
  document.documentElement.offsetHeight; 
});

const details = {
  stage1: { title: "Brainstorm & Research", text: "This stage consisted of discussing what dataset and question our project would focus on. Then, we each investigated on our own what potential visualizations were appropriate and feasable for our data. This took approximately 2.5  hours with most of the time being spent on researching different d3 visualizations and how to implement them." },
  stage2: { title: "Potential Visualizations", text: "At this point, each team member created 2-3 visualizations to create a general idea of our possibilities. To acquire as much knowledge and practice, we coded most of them using d3. This stage took overall about 10 hours. It was very time consuming to ensure that our data was properly parsed into json so that we could call it in javascript. Then, coding every aspect of the visualzaation as well as the interactive features proposed many challenges and a considerable amount of re-reading and re-writing code. " },
  stage3: { title: "Website", text: "We created our website skeleton using the layout from our labs. However, we wanted to personalize it and thus created this flow chart with interactive features for the viewer." },
  stage4: { title: "Final Visualization", text: "Once we created our checkpoint visualizations, our team discussed the benefits and costs of our preferred graphs. We analyzed ... XXX TO FINISH." },
  stage5: { title: "Rationale & Website Cleanup", text: "TO FINISH" }
};

function showDetails(stage) {
  const detailBox = document.getElementById("details-box");
  document.getElementById("details-title").innerText = details[stage].title;
  document.getElementById("details-text").innerText = details[stage].text;
  detailBox.classList.remove("hidden");
}

function hideDetails() {
  document.getElementById("details-box").classList.add("hidden");
}
