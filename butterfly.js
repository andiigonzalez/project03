import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Define margins and dimensions
const margin = { top: 40, right: 30, bottom: 70, left: 200 }; // Increased bottom margin for labels
const width = 900 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Create filter dropdown
const filterDiv = d3.select("#butterfly").append("div")
    .style("position", "relative")
    .style("top", "10px")
    .style("left", "10px");

filterDiv.append("select")
    .attr("id", "filterDropdown")
    .style("padding", "5px")
    .style("margin-bottom", "10px")
    .on("change", function() {
        const selectedValue = d3.select(this).property("value");
        if (selectedValue === "all") {
            loadMainChart();
        } else {
            loadSubChart(selectedValue);
        }
    });

// Select the correct SVG
const svg = d3.select("#butterfly")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Background rectangle for clicking
svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "white")
    .attr("opacity", 0)
    .on("click", () => loadMainChart());

// Define color scale
const colorScale = d3.scaleOrdinal()
    .domain(["Surgery Duration", "Hospital Stay"])
    .range(["#1f77b4", "#ff7f0e"]);

// Define scales for the butterfly chart
const xScaleLeft = d3.scaleLinear().range([0, width/3]);
const xScaleRight = d3.scaleLinear().range([0, width/1.5]);
const yScale = d3.scaleBand().range([0, height]);

// Create axis groups
const xAxisLeftGroup = svg.append("g")
    .attr("transform", `translate(0,${height})`);
const xAxisRightGroup = svg.append("g")
    .attr("transform", `translate(${width/2},${height})`);
const yAxisGroup = svg.append("g")
    .attr("transform", `translate(${width/2},0)`);

// Add X-axis labels
svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width/4)
    .attr("y", height + 45)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Surgery Duration (Hours)");

svg.append("text")
    .attr("class", "axis-label")
    .attr("x", 3*width/4)
    .attr("y", height + 45)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Hospital Stay (Hours)");

// Add title
svg.append("text")
    .attr("class", "chart-title")
    .attr("x", width/2)
    .attr("y", -margin.top/1.2)
    .attr("text-anchor", "top-middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Surgery Duration and Hospital Stay Comparison");

// Add center line
svg.append("line")
    .attr("class", "center-line")
    .attr("x1", width/2)
    .attr("x2", width/2)
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1);


// Legend
const legend = svg.append("g")
    .attr("transform", `translate(${width - 150}, -30)`);

legend.selectAll("rect")
    .data(["Surgery Duration", "Hospital Stay"])
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 20)
    .attr("width", 10)
    .attr("height", 10)
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

function updateDropdown(data) {
    const dropdown = d3.select("#filterDropdown");
    
    // Clear existing options
    dropdown.selectAll("option").remove();
    
    // Add "All" option
    dropdown.append("option")
        .attr("value", "all")
        .text("All Categories");
    
    // Add options for each surgery type
    const options = [...new Set(data.map(d => d.optype))];
    dropdown.selectAll("option.category")
        .data(options)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);
}

function loadMainChart() {
    backButton.style("display", "none");
    d3.json("data/main_durations_data.json").then(data => {
        data.forEach(d => d.SurgeryType = d.optype);
        updateDropdown(data);
        updateChart(data, false);
    }).catch(error => console.error("Error loading the data", error));
}

function loadSubChart(SurgeryType) {
    backButton.style("display", "inline-block");
    
    d3.json("data/sub_durations_data.json").then(data => {
        const filteredData = data.filter(d => d.optype === SurgeryType);
        filteredData.forEach(d => d.SurgeryType = d.opname);
        updateChart(filteredData, true);
    });
}

function updateChart(data, isSubcategory) {
    // Update scales - removed division by 24 since data is already in days
    yScale.domain(data.map(d => d.SurgeryType));
    xScaleLeft.domain([d3.max(data, d => d.surgery), 0]);
    xScaleRight.domain([0, d3.max(data, d => d.stay*24)]);

    // Update bars
    const bars = svg.selectAll(".bar-group").data(data, d => d.SurgeryType);

    // Remove old bars
    bars.exit()
        .transition().duration(500)
        .attr("opacity", 0)
        .remove();

    // Create new bar groups
    const barGroups = bars.enter()
        .append("g")
        .attr("class", "bar-group")
        .attr("transform", d => `translate(0,${yScale(d.SurgeryType)})`)
        .on("click", function(event, d) {
            if (!isSubcategory) loadSubChart(d.SurgeryType);
        });

    // Surgery Duration bars (left side)
    barGroups.append("rect")
        .attr("class", "bar")
        .attr("y", yScale.bandwidth() * 0.1)
        .attr("height", yScale.bandwidth() * 0.5)
        .attr("x", d => xScaleLeft(d.surgery))
        .attr("width", 0)
        .attr("fill", colorScale("Surgery Duration"))
        .transition().duration(800)
        .attr("width", d => width/2 - xScaleLeft(d.surgery));

    // Hospital Stay bars (right side)
    barGroups.append("rect")
        .attr("class", "bar2")
        .attr("y", yScale.bandwidth() * 0.1)
        .attr("height", yScale.bandwidth() * 0.5)
        .attr("x", width/2)
        .attr("width", 0)
        .attr("fill", colorScale("Hospital Stay"))
        .transition().duration(800)
        .attr("width", d => xScaleRight(d.stay*24)); // Removed division by 24

    // Add single label at the center
    barGroups.append("text")
        .attr("x", width/2)
        .attr("y", yScale.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .attr("opacity", 0)
        .transition().duration(800)
        .attr("opacity", 1)
        .text(d => d.SurgeryType)
        .style("font-size", "14px")
        .attr("alignment-baseline", "middle");

    // Update axes with proper formatting
    xAxisLeftGroup.transition().duration(800)
        .call(d3.axisBottom(xScaleLeft).ticks(12)
            .tickFormat(d => Math.round(d) + "h"))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    xAxisRightGroup.transition().duration(800)
        .call(d3.axisBottom(xScaleRight).ticks(20)
            .tickFormat(d => Math.round(d) + "h"))
        .selectAll("text")
        .attr("transform", "translate(10,0)rotate(-45)")
        .style("text-anchor", "start");

    yAxisGroup.transition().duration(800)
        .call(d3.axisLeft(yScale));
}


// Initialize chart
loadMainChart();