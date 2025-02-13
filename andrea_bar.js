import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Define margins and dimensions
const margin = { top: 40, right: 30, bottom: 50, left: 200 }; // Increased left margin for labels
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Select the correct SVG AFTER defining width and height
const svg = d3.select("#andrea_bar")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// **Background rectangle for clicking to return to main chart**
svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "white")
    .attr("opacity", 0)
    .on("click", () => loadMainChart()); // Return to main chart on click

// Define color scale
const colorScale = d3.scaleOrdinal()
    .domain(["Surgery Duration", "Hospital Stay"])
    .range(["#1f77b4", "#ff7f0e"]); // Blue for surgery, Orange for stay

const xScale = d3.scaleLinear().range([0, width]); // Horizontal bars, so x is linear
const yScale = d3.scaleBand().range([0, height]).padding(0.4); // Band scale for categories

const xAxisGroup = svg.append("g").attr("transform", `translate(0,${height})`);
const yAxisGroup = svg.append("g");

// Legend
const legend = svg.append("g")
    .attr("transform", `translate(${width - 150}, -30)`); // Position legend at top right

legend.selectAll("rect")
    .data(["Surgery Duration", "Hospital Stay"])
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 20)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", d => colorScale(d));

legend.selectAll("text")
    .data(["Surgery Duration", "Hospital Stay"])
    .enter()
    .append("text")
    .attr("x", 20)
    .attr("y", (d, i) => i * 20 + 12)
    .text(d => d)
    .style("font-size", "14px")
    .attr("alignment-baseline", "middle");

// Back button functionality
const backButton = d3.select("#backButton").on("click", () => loadMainChart());

// Load main categories
function loadMainChart() {
    backButton.style("display", "none");
    d3.json("data/main_durations_data.json").then(data => {
        // Convert 'optype' to 'department' for consistency
        data.forEach(d => d.SurgeryType = d.optype);
        updateChart(data, false);
    }).catch(error => console.error("Error loading the data", error));
}

// Load subcategories for a specific department
function loadSubChart(SurgeryType) {
    backButton.style("display", "inline-block");

    d3.json("data/sub_durations_data.json").then(data => {
        const filteredData = data.filter(d => d.optype === SurgeryType);
        filteredData.forEach(d => d.SurgeryType = d.opname);  // Ensure consistency
        updateChart(filteredData, true);
    });
}

// Update chart with new data
function updateChart(data, isSubcategory) {
    xScale.domain([0, d3.max(data, d => Math.max(d.surgery, d.stay))]);
    yScale.domain(data.map(d => d.SurgeryType));

    const bars = svg.selectAll(".bar-group").data(data, d => d.SurgeryType);

    bars.exit()
        .transition().duration(500)
        .attr("opacity", 0)
        .remove();

    const barGroups = bars.enter()
        .append("g")
        .attr("class", "bar-group")
        .attr("transform", d => `translate(0, ${yScale(d.SurgeryType)})`)
        .on("click", function(event, d) {
            if (!isSubcategory) loadSubChart(d.SurgeryType );
        });

        barGroups.append("rect")
        .attr("class", "bar")
        .attr("y", yScale.bandwidth() * 0.1)
        .attr("height", yScale.bandwidth() * 0.4)
        .attr("x", 0)
        .attr("width", 0)
        .attr("fill", colorScale("Surgery Duration"))
        .transition().duration(800)
        .attr("width", d => xScale(d.surgery));

    barGroups.append("rect")
        .attr("class", "bar2")
        .attr("y", yScale.bandwidth() * 0.5)
        .attr("height", yScale.bandwidth() * 0.4)
        .attr("x", 0)
        .attr("width", 0)
        .attr("fill", colorScale("Hospital Stay"))
        .transition().duration(800)
        .attr("width", d => xScale(d.stay));

    barGroups.append("text")
        .attr("x", d => xScale(Math.max(d.surgery, d.stay)) + 5)
        .attr("y", yScale.bandwidth() / 2)
        .attr("text-anchor", "start")
        .attr("opacity", 0)
        .transition().duration(800)
        .attr("opacity", 1)
        .text(d => d.SurgeryType)
        .style("font-size", "14px")
        .attr("alignment-baseline", "middle");

    xAxisGroup.transition().duration(800).call(d3.axisBottom(xScale));
    yAxisGroup.transition().duration(800).call(d3.axisLeft(yScale));
}

loadMainChart();