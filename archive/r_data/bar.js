import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const margin = { top: 50, right: 150, bottom: 50, left: 150 };
let width = document.querySelector(".chart-container2").clientWidth - margin.left - margin.right;
let height = document.querySelector(".chart-container2").clientHeight - margin.top - margin.bottom;


// Create tooltip
const tooltip = d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("display", "none");

// Create and select the SVG
const svg = d3.select("#chart-svg")
    .attr("id", "chart-svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", `translate(${margin.left -100}, ${margin.top})`);


// Add Chart Title
svg.append("text")
    .attr("class", "chart-title")  // Apply class
    .attr("x", width / 2) // Centered
    .attr("y", -margin.top * 0.5)
    .attr("text-anchor", "middle")
    .style("font-size", "26px")
    .style("font-weight", "bold")
    .text("Average Surgery Duration & Hospital Recovery Times");

// Add Subtitle
svg.append("text")
    .attr("class", "chart-subtitle")  // Apply class
    .attr("x", width / 2)
    .attr("y", -margin.top / 20)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .text("Comparing surgery and hospitalization durations across different surgical procedures.");

// Back button
const backButton = d3.select(".chart-container2")
    .append("button")
    .attr("id", "backButton") // Assign an ID to target in CSS
    .text("Back")
    .style("display", "none") // Still control visibility in JS
    .on("click", resetChart);


let initialData;

// Global Scales
let xScale = d3.scaleLinear();
let yScale = d3.scaleBand().padding(0.3);

// Load JSON data
d3.json("hierarchical_surgery_data.json").then(data => {
    if (!data.children) {
        console.error("No children found in JSON data.");
        return;
    }

    initialData = d3.hierarchy(data)
        .eachBefore(d => {
            if (d.children) {
                let opDurations = d.children.map(c => c.data.op_dur || 0);
                let hospDurations = d.children.map(c => c.data.hosp_dur || 0);

                d.data.op_dur = d3.mean(opDurations);
                d.data.hosp_dur = d3.mean(hospDurations);
            }
        })
        .sum(d => d.op_dur)
        .sort((a, b) => b.value - a.value);

    updateChart(initialData);
}).catch(error => {
    console.error("Error loading JSON data:", error);
});

function showTooltip(event, d, type) {
    let minVal, maxVal, avgVal, unit, label;

    if (d.children) {
        // If it's an operation type, compute min/max from children surgeries
        const values = d.children.map(c => 
            type === "op" ? c.data.op_dur : c.data.hosp_dur
        ).filter(v => v !== undefined);

        minVal = values.length ? d3.min(values).toFixed(2) : "N/A";
        maxVal = values.length ? d3.max(values).toFixed(2) : "N/A";
        avgVal = values.length ? d3.mean(values).toFixed(2) : "N/A";
    } else {
        // If it's a leaf node (individual surgery), use its own values
        minVal = type === "op" ? d.data.op_dur_min : d.data.hosp_dur_min;
        maxVal = type === "op" ? d.data.op_dur_max : d.data.hosp_dur_max;
        avgVal = type === "op" ? d.data.op_dur : d.data.hosp_dur;

        // Ensure values are formatted properly
        minVal = minVal !== undefined ? parseFloat(minVal).toFixed(2) : "N/A";
        maxVal = maxVal !== undefined ? parseFloat(maxVal).toFixed(2) : "N/A";
        avgVal = avgVal !== undefined ? parseFloat(avgVal).toFixed(2) : "N/A";
    }

    unit = type === "op" ? "hours" : "days";
    label = type === "op" ? "Operation" : "Hospitalization";

    tooltip.style("display", "block")
        .html(`<strong>${d.data.name}</strong><br>
               ${label} Duration:<br>
               Min: ${minVal} ${unit}<br>
               Max: ${maxVal} ${unit}<br>
               <strong>Avg: ${avgVal} ${unit}</strong>`)  // Explicitly add avg duration
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 30}px`);
}



function hideTooltip() {
    tooltip.style("display", "none");
}

// Function to update chart dynamically
function updateChart(root) {
    if (!root.children || root.children.length === 0) {
        console.error("No valid child nodes found.");
        return;
    }

    const maxOpDur = d3.max(root.children, d => d.data.op_dur || 0);
    const maxHospDur = d3.max(root.children, d => d.data.hosp_dur || 0);
    const maxDuration = Math.max(maxOpDur, maxHospDur);

    const numBars = root.children.length;
    const barHeight = 25;  // Increase bar spacing for better readability
    const containerHeight = Math.max(600, window.innerHeight * 0.85); 
    const newHeight = Math.max(containerHeight, numBars * barHeight); // Ensure enough height for all bars

    d3.select("#chart-svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");


    // update domains only here
    xScale.domain([-maxDuration, maxDuration]); 
    yScale.domain(root.children.map(d => d.data.name)).range([0, newHeight - margin.top - margin.bottom]);

    resizeChart();  // ensures axes update correctly

    // Ensure a clipPath exists to prevent grid lines from extending beyond axes
    let clip = svg.select("#clip");
    if (clip.empty()) {
        clip = svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width - margin.left - margin.right)
            .attr("height", height - margin.top - margin.bottom);
    }

    // Ensure the grid container exists
    let grid = svg.select(".grid");
    if (grid.empty()) {
        grid = svg.insert("g", ":first-child") // Insert behind everything else
            .attr("class", "grid");
    }

    // Ensure grid extends to the correct bottom position
    grid.transition().duration(750)
        .attr("transform", `translate(0, ${height - margin.bottom -55})`) // Align at bottom of the chart
        .call(
            d3.axisBottom(xScale)
                .tickSize(-(height - margin.top - margin.bottom -10)) // Extend grid to the bottom
                .tickFormat("") // Hide tick labels
        )
        .selectAll("line")
        .style("stroke", "#ccc") // Light gray grid lines
        .style("stroke-opacity", 0.7)
        .style("stroke-dasharray", "4,4"); // Dashed lines for better visibility

    // Ensure grid is behind the bars
    svg.select(".grid").lower();

    let yAxis = svg.select(".y-axis");
    if (yAxis.empty()) {
        yAxis = svg.append("g").attr("class", "y-axis");
    }
    yAxis.transition().duration(750)
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale));

    let xAxis = svg.select(".x-axis");
    if (xAxis.empty()) {
        xAxis = svg.append("g").attr("class", "x-axis");
    }

    let lastBarName = yScale.domain()[yScale.domain().length -1];
    let lastBarPosition = lastBarName ? yScale(lastBarName) + yScale.bandwidth() : height - margin.bottom;

    xAxis.transition().duration(750)
        .attr("transform", `translate(0, ${lastBarPosition + 10})`) // +10
        .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => Math.abs(d)));

    // Remove old labels before re-adding
    svg.selectAll(".x-axis-label").remove();

    // Surgery Duration Label (Left)
    svg.append("text")
        .attr("class", "x-axis-label")  // Apply class
        .attr("text-anchor", "middle")
        .attr("x", xScale(-maxDuration / 2))
        .attr("y", newHeight - margin.bottom - 5)
        .text("Average Surgery Duration (in hours)");

    // Hospitalization Duration Label (Right)
    svg.append("text")
        .attr("class", "x-axis-label")  // Apply class
        .attr("text-anchor", "middle")
        .attr("x", xScale(maxDuration / 2))
        .attr("y", newHeight - margin.bottom - 5)
        .text("Average Hospitalization Duration (in days)");


    const bars = svg.selectAll(".bar-group")
        .data(root.children, d => d.data.name);

    bars.exit().transition().duration(500).style("opacity", 0).remove();

    const barGroups = bars.enter()
        .append("g")
        .attr("class", "bar-group")
        .attr("transform", d => `translate(0, ${yScale(d.data.name)})`)
        .style("opacity", 0);

    barGroups.transition().duration(750).style("opacity", 1);

    // Append surgery bars
    barGroups.append("rect")
        .attr("class", d => d.children ? "bar op-bar parent-bar" : "bar op-bar subgroup-bar") // Different classes
        .attr("x", d => xScale(-d.data.op_dur || 0))
        .attr("width", 0)
        .attr("height", yScale.bandwidth())
        .attr("fill", "#1f77b4")
        .on("mouseover", (event, d) => showTooltip(event, d, "op"))
        .on("mouseout", hideTooltip)
        .on("click", (event, d) => {
            if (d.children) {
                // Parent group: Expand on click
                expandBar(event, d);
            } else {
                // Child group: Open Google search
                const searchQuery = encodeURIComponent(d.data.name);
                window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
            }
        })
        .transition().duration(750)
        .attr("width", d => Math.abs(xScale(0) - xScale(-d.data.op_dur || 0)));

    // Append hospitalization bars
    barGroups.append("rect")
    .attr("class", d => d.children ? "bar hosp-bar parent-bar" : "bar hosp-bar subgroup-bar") // Different classes
        .attr("x", xScale(0))
        .attr("width", 0)
        .attr("height", yScale.bandwidth())
        .attr("fill", "#ff7f0e")
        .on("mouseover", (event, d) => showTooltip(event, d, "hosp"))
        .on("mouseout", hideTooltip)
        .on("click", (event, d) => {
            if (d.children) {
                // Parent group: Expand on click
                expandBar(event, d);
            } else {
                // Child group: Open Google search
                const searchQuery = encodeURIComponent(d.data.name);
                window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
            }
        })
        .transition().duration(750)
        .attr("width", d => xScale(d.data.hosp_dur || 0) - xScale(0));

    // Ensure Back button is only shown for subgroups (not parent-level)
    if (root.depth > 0) {  
        backButton.style("display", "block");
    } else {
        backButton.style("display", "none");
    }
}


// Function to handle resizing dynamically
function resizeChart() {
    let newWidth = document.querySelector(".chart-container2").clientWidth - margin.left - margin.right;
    let newHeight = document.querySelector(".chart-container2").clientHeight - margin.top - margin.bottom;

    d3.select("#chart-svg")
        .attr("width", newWidth)
        .attr("height", newHeight)
        .attr("viewBox", `0 0 ${newWidth} ${newHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    xScale.range([margin.left, newWidth - margin.right]);
    yScale.range([0, newHeight - margin.top - margin.bottom]);

    svg.select(".x-axis")
        .attr("transform", `translate(0, ${newHeight - margin.bottom - 20})`)
        .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => Math.abs(d)));

    svg.select(".y-axis")
        .call(d3.axisLeft(yScale));

    svg.selectAll(".x-axis-label")
        .attr("y", newHeight - margin.bottom - 10);
}


window.addEventListener("resize", () => {
    clearTimeout(window.resizing);
    window.resizing = setTimeout(() => {
        resizeChart();
        updateChart(initialData);
    }, 200);
});





function expandBar(event, d) {
    if (!d.children) return;
    updateChart(d);

    // Show back button ONLY when drilling into a subgroup
    if (d.depth > 0) { // Ensures only deeper subgroups trigger back button
        backButton.style("display", "block");
    } else {
        backButton.style("display", "none");
    }

    // Ensure X-Axis Updates Properly
    let lastBarName = yScale.domain()[yScale.domain().length - 1];
    let lastBarPosition = lastBarName ? yScale(lastBarName) + yScale.bandwidth() : height - margin.bottom;

    let xAxis = svg.select(".x-axis");
    if (xAxis.empty()) {
        xAxis = svg.append("g").attr("class", "x-axis");
    }
    
    xAxis.transition().duration(750)
        .attr("transform", `translate(0, ${lastBarPosition + 10})`)
        .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => Math.abs(d)));

    // Keep labels aligned dynamically
    svg.selectAll(".x-axis-label")
        .attr("y", lastBarPosition + 50);
}

function resetChart() {
    updateChart(initialData);  // Reset to top-level data
    resizeChart();  // Ensure axes and layout resize correctly
    backButton.style("display", "none");  // Hide the button when at the top level
}

