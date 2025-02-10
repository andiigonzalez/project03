// Set dimensions
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
const width = 900, height = width;

// Select the existing SVG
const svg = d3.select("#zoomable")
    .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)

// Define color scale for surgery duration
const color = d3.scaleLinear()
    .domain([0, 300]) // Adjust max duration based on dataset
    .range(["Purple", "Orange"])
    .interpolate(d3.interpolateHcl);

// Load JSON Data
d3.json("surgery_durations.json").then(data => {
    console.log("✅ Loaded JSON Data:", data);  // Debugging step

    // Clear previous content
    svg.selectAll("*").remove();

    // Create a circle packing layout
    const pack = data => d3.pack()
      .size([width, height])
      .padding(3)
    (d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value));
    const root = pack(data)

    console.log("📌 Number of Nodes:", root.descendants().length);
    console.log("📌 First Node Example:", root.descendants()[0]);

    // Append a group container for circles
    const g = svg.append("g")
        .attr("width", width)
        .attr("height", height)
        .attr("style", `max-width: 100%; height: auto; display: block; margin: 0 -14px; background: ${color(0)}; cursor: pointer;`);

    // Append circles
    const node = g.selectAll("circle")
        .data(root.descendants().slice(1)) // Skip root node
        .join("circle")
        .attr("fill", d => d.children ? color(d.depth) : color(d.value)) // Color based on avg_duration
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("pointer-events", d => !d.children ? "none" : null)
            .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
            .on("mouseout", function() { d3.select(this).attr("stroke", null); })
            .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()));

    // Append labels for each node
    const label = svg.append("g")
      .style("font", "bold 15px sans-serif")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
    .selectAll("text")
    .data(root.descendants())
    .join("text")
      .style("fill-opacity", d => d.parent === root ? 1 : 0)
      .style("display", d => d.parent === root ? "inline" : "none")
      .text(d => d.data.name);

    // Zoom functionality
    svg.on("click", (event) => zoom(event, root));
    let focus = root;
    let view;
    zoomTo([focus.x, focus.y, focus.r * 2]);

    function zoomTo(v) {
        const k = width / v[2];

        view = v;
        label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("r", d => d.r * k);
      }

    function zoom(event, d) {
        const focus0 = focus;

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
    return svg.node();
});
