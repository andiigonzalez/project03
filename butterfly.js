import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Define margins and initial dimensions
const margin = { top: 40, right: 30, bottom: 70, left: 200 };
const baseWidth = 900 - margin.left - margin.right;
const baseHeight = 500 - margin.top - margin.bottom;

// Select SVG container
const svgContainer = d3.select("#butterfly")
    .append("svg")
    .attr("width", baseWidth + margin.left + margin.right)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Define scales
const xScaleLeft = d3.scaleLinear().range([0, baseWidth / 3]).nice();   // Shorter width
const xScaleRight = d3.scaleLinear().range([0, baseWidth / 1.5]).nice(); // Longer width
const yScale = d3.scaleBand().padding(0.4); // Adjusted padding for better spacing

// Create axis groups
const xAxisLeftGroup = svgContainer.append("g");
const xAxisRightGroup = svgContainer.append("g");
const yAxisGroup = svgContainer.append("g");

// Add center line
svgContainer.append("line")
    .attr("class", "center-line")
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1);

// Load main chart
function loadMainChart() {
    d3.json("data/main_durations_data.json").then(data => {
        data.forEach(d => d.SurgeryType = d.optype);
        updateChart(data);
    });
}

// Update chart dynamically
function updateChart(data) {
    const categoryCount = data.length;
    const newHeight = Math.max(baseHeight, categoryCount * 25);

    // Update SVG height dynamically
    d3.select("svg").attr("height", newHeight + margin.top + margin.bottom);
    yScale.range([0, newHeight]).domain(data.map(d => d.SurgeryType));

    // Set consistent tick marks for both X-axes
    const xMaxLeft = d3.max(data, d => d.surgery) || 1;
    const xMaxRight = d3.max(data, d => d.stay*24) || 1;
    xScaleLeft.domain([xMaxLeft, 0]).nice();
    xScaleRight.domain([0, xMaxRight]).nice();

    // Update center line
    svgContainer.select(".center-line")
        .attr("x1", baseWidth / 2)
        .attr("x2", baseWidth / 2)
        .attr("y1", 0)
        .attr("y2", newHeight);

    // Bind data to bar groups
    const bars = svgContainer.selectAll(".bar-group").data(data, d => d.SurgeryType);

    bars.exit().transition().duration(500).attr("opacity", 0).remove();

    const barGroups = bars.enter()
        .append("g")
        .attr("class", "bar-group")
        .merge(bars)
        .transition().duration(800)
        .attr("transform", d => `translate(0, ${yScale(d.SurgeryType)})`);

    // Left bars (Surgery Duration - Shorter)
    barGroups.selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("y", yScale.bandwidth() * 0.1)
        .attr("height", yScale.bandwidth() * 0.4)
        .attr("x", d => baseWidth / 2 - xScaleLeft(0)) // Align to center
        .attr("width", 0)
        .attr("fill", "#1f77b4")
        .transition().duration(800)
        .attr("width", d => xScaleLeft(d.surgery));

    // Right bars (Hospital Stay - Longer)
    barGroups.selectAll(".bar2")
        .data(data)
        .join("rect")
        .attr("class", "bar2")
        .attr("y", yScale.bandwidth() * 0.5)
        .attr("height", yScale.bandwidth() * 0.4)
        .attr("x", baseWidth / 2) // Align to center
        .attr("width", 0)
        .attr("fill", "#ff7f0e")
        .transition().duration(800)
        .attr("width", d => xScaleRight(d.stay*24));

    // Add labels at center
    barGroups.selectAll(".bar-label")
        .data(data)
        .join("text")
        .attr("class", "bar-label")
        .attr("x", baseWidth / 2)
        .attr("y", yScale.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .attr("opacity", 0)
        .transition().duration(800)
        .attr("opacity", 1)
        .text(d => d.SurgeryType);

    // Update Axes
    xAxisLeftGroup.transition().duration(800)
        .call(d3.axisBottom(xScaleLeft).ticks(5).tickFormat(d => Math.round(d) + "h"))
        .attr("transform", `translate(${baseWidth / 2 - xScaleLeft(0)}, ${newHeight})`);

    xAxisRightGroup.transition().duration(800)
        .call(d3.axisBottom(xScaleRight).ticks(5).tickFormat(d => Math.round(d) + "d"))
        .attr("transform", `translate(${baseWidth / 2}, ${newHeight})`);

    yAxisGroup.transition().duration(800).call(d3.axisLeft(yScale));
}

// Initialize chart
loadMainChart();
