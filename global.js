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
