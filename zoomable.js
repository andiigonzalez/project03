// Set dimensions
// Set dimensions
const width = 900;
const height = width;

// Select the existing SVG and set its properties
const svg = d3.select("#zoomable")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
    .style("max-width", "100%")
    .style("height", "auto")
    .style("display", "inline-block"); // Add this to allow side-by-side with legend

// Define color scale for surgery duration with properly interpolated colors
const color = d3.scaleLinear()
    .domain([0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 360, 390, 420, 460])
    .range([
        "#e6ffe6",  // Lightest green
        "#f4ffa8",  // Light yellow-green
        "#ffff99",  // Light yellow
        "#ffe066",  // Light orange-yellow
        "#ffbb33",  // Light orange
        "#ffb31a",  // Orange
        "#ff9933",  // Darker orange
        "#ff571f",  // Orange-red
        "#ff3f1f",  // Light red
        "#cc1f00",  // Red
        "#b2092b",  // Dark red
        "#990043",  // Deep red
        "#993366",  // Purple-red
        "#a3186b",  // Dark purple-red
        "#99004f"   // Deepest purple-red
    ].reverse())
    .interpolate(d3.interpolateRgb.gamma(0.8)); // Use RGB interpolation for smoother transitions

// Create legend container with matching height
const legendWidth = 100;
const legendHeight = height;

// Create a separate SVG for the legend
const legendSvg = d3.select("#zoomable-container")
  .append("svg")
  .attr("width", legendWidth)
  .attr("height", legendHeight)
  .attr("class", "legend")
  .style("position", "justify")
  .style("right", "0")
  .style("bottom", "0")
  //.style("transform", "translateY(-50%)");

// Create gradient for legend
const defs = legendSvg.append("defs");
const gradient = defs.append("linearGradient")
    .attr("id", "duration-gradient")
    .attr("x1", "0%")
    .attr("x2", "0%")
    .attr("y1", "0%")
    .attr("y2", "100%");

// Add color stops to gradient
const colorStops = color.range();
colorStops.forEach((c, i) => {
    gradient.append("stop")
        .attr("offset", `${(i * 100) / (colorStops.length - 1)}%`)
        .attr("stop-color", c);
});

// Add gradient rectangle
const legendMargin = { top: 40, right: 20, bottom: 20, left: 50 };
const gradientHeight = legendHeight - legendMargin.top - legendMargin.bottom;
const gradientWidth = 70;

legendSvg.append("rect")
    .attr("x", legendMargin.left)
    .attr("y", legendMargin.top)
    .attr("width", gradientWidth)
    .attr("height", gradientHeight)
    .style("fill", "url(#duration-gradient)");

// Create axis for legend
const legendScale = d3.scaleLinear()
    .domain([460, 0])  // Reverse domain for vertical legend
    .range([0, gradientHeight]);

const legendAxis = d3.axisLeft(legendScale)
    .tickValues(color.domain())
    .tickFormat(d => `${d}m`);

legendSvg.append("g")
    .attr("class", "legend-axis")
    .attr("transform", `translate(${legendMargin.left},${legendMargin.top})`)
    .call(legendAxis)
    .style("font-size", "12px");

// Add title to legend
legendSvg.append("text")
    .attr("class", "legend-title")
    .attr("x", 0)
    .attr("y", 20)
    .attr("text-anchor", "left")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Duration (min)");

// Rest of your visualization code remains the same...
// (Keep all the existing zoom, node creation, and data loading code)
// Initialize these variables at the top level
let focus;
let view;
let label;
let node;

function zoom(event, d) {
    const focus0 = focus;
    console.log("🔍 Zooming to:", d.data.name);

    focus = d;

    const transition = svg.transition()
        .duration(event.altKey ? 7500 : 750)
        .tween("zoom", d => {
            const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
            return t => zoomTo(i(t));
        });

    label
        .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
        .transition(transition)
        .style("fill-opacity", d => d.parent === focus ? 1 : 0)
        .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
        .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
}

function zoomTo(v) {
    const k = width / v[2];
    view = v;
    label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.attr("r", d => d.r * k);
}

// Add error handling for the data loading
d3.json("surgery_durations.json")
    .then(data => {
        console.log("✅ Loaded JSON Data:", data);

        // Clear previous content
        svg.selectAll("*").remove();

        // Create a circle packing layout
        const pack = data => d3.pack()
            .size([width, height])
            .padding(3)
            (d3.hierarchy(data)
                .sum(d => d.value)
                .sort((a, b) => b.value - a.value));
        
        const root = pack(data);
        focus = root; // Set initial focus

        console.log("📌 Number of Nodes:", root.descendants().length);
        console.log("📌 First Node Example:", root.descendants()[0]);

        // Append a group container for circles
        const g = svg.append("g")
            .attr("width", width)
            .attr("height", height)
            .attr("style", "background: white; cursor: pointer;");

        // Append circles
        node = g.selectAll("circle")
            .data(root.descendants().slice(1))
            .join("circle")
            .attr("fill", d => d.children ? color(d.data.avg_duration) : color(d.value))
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("pointer-events", d => !d.children ? "none" : null)
            .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
            .on("mouseout", function() { d3.select(this).attr("stroke", null); })
            .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()));

        // Append labels
        label = svg.append("g")
            .style("font", "bold 15px sans-serif")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(root.descendants())
            .join("text")
            .style("fill-opacity", d => d.parent === root ? 1 : 0)
            .style("display", d => d.parent === root ? "inline" : "none")
            .text(d => d.data.name);

        // Set up zoom behavior
        svg.on("click", (event) => zoom(event, root));
        zoomTo([root.x, root.y, root.r * 2]);

        console.log("Focus Node:", focus);
    })
    .catch(error => {
        console.error("Error loading the data:", error);
        svg.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .text("Error loading data");
    });