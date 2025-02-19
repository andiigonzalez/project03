import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const margin = { top: 50, right: 150, bottom: 50, left: 150 };
let width = window.innerWidth * 0.9 - margin.left - margin.right;
let height = Math.min(600, window.innerHeight * 0.8) - margin.top - margin.bottom;

// Create tooltip
const tooltip = d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("display", "none");

// Create and select the SVG
const svg = d3.select("#chart-svg")
    .attr("id", "chart-svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Back button
const backButton = d3.select("body")
    .append("button")
    .text("Back")
    .style("display", "none")
    .style("position", "absolute")
    .style("top", "20px")
    .style("left", "20px")
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
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${newHeight + margin.top + margin.bottom}`)
        .attr("height", newHeight + margin.top + margin.bottom);  // Dynamically adjust height

    // update domains only here
    xScale.domain([-maxDuration, maxDuration]); 
    yScale.domain(root.children.map(d => d.data.name)).range([0, newHeight - margin.top - margin.bottom]);

    resizeChart();  // ensures axes update correctly

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
    
    
    let lastBarName = yScale.domain()[yScale.domain().length - 1]; // Last name in Y scale
    let lastBarPosition = lastBarName ? yScale(lastBarName) + yScale.bandwidth() : height - margin.bottom;


    xAxis.transition().duration(750)
        .attr("transform", `translate(0, ${lastBarPosition + 10})`)
        .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => Math.abs(d)));




    // Remove old labels before re-adding
    svg.selectAll(".x-axis-label").remove();

    // Surgery Duration Label (Left)
    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", xScale(-maxDuration / 2))
        .attr("y", newHeight - margin.bottom -5)  // Ensures it stays visible
        .text("Average Surgery Duration (in hours)");

    // Hospitalization Duration Label (Right)
    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", xScale(maxDuration / 2))
        .attr("y", newHeight - margin.bottom -5)  // Ensures it stays visible
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

    barGroups.append("rect")
        .attr("class", "bar op-bar")
        .attr("x", d => xScale(-d.data.op_dur || 0))
        .attr("width", 0)
        .attr("height", yScale.bandwidth())
        .attr("fill", "#1f77b4")
        .on("mouseover", (event, d) => showTooltip(event, d, "op"))
        .on("mouseout", hideTooltip)
        .on("click", (event, d) => expandBar(event, d))
        .transition().duration(750)
        .attr("width", d => Math.abs(xScale(0) - xScale(-d.data.op_dur || 0)));

    barGroups.append("rect")
        .attr("class", "bar hosp-bar")
        .attr("x", xScale(0))
        .attr("width", 0)
        .attr("height", yScale.bandwidth())
        .attr("fill", "#ff7f0e")
        .on("mouseover", (event, d) => showTooltip(event, d, "hosp"))
        .on("mouseout", hideTooltip)
        .on("click", (event, d) => expandBar(event, d))
        .transition().duration(750)
        .attr("width", d => xScale(d.data.hosp_dur || 0) - xScale(0));

    function showTooltip(event, d, type) {
        let minVal, maxVal, unit, label;

        if (d.children) {
            // If it's an operation type, compute min/max from children surgeries
            const values = d.children.map(c => 
                type === "op" ? c.data.op_dur : c.data.hosp_dur
            ).filter(v => v !== undefined);

            minVal = values.length ? d3.min(values).toFixed(2) : "N/A";
            maxVal = values.length ? d3.max(values).toFixed(2) : "N/A";
        } else {
            // If it's a leaf node (individual surgery), use its own min/max values
            minVal = type === "op" ? d.data.op_dur_min : d.data.hosp_dur_min;
            maxVal = type === "op" ? d.data.op_dur_max : d.data.hosp_dur_max;

            // Ensure values are formatted properly
            minVal = minVal !== undefined ? parseFloat(minVal).toFixed(2) : "N/A";
            maxVal = maxVal !== undefined ? parseFloat(maxVal).toFixed(2) : "N/A";
        }

        unit = type === "op" ? "hours" : "days";
        label = type === "op" ? "Operation" : "Hospitalization";

        tooltip.style("display", "block")
            .html(`<strong>${d.data.name}</strong><br>${label} Duration:<br>Min: ${minVal} ${unit}<br>Max: ${maxVal} ${unit}`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 30}px`);
    }


    function hideTooltip() {
        tooltip.style("display", "none");
    }

    backButton.style("display", root !== initialData ? "block" : "none");
}


// Function to handle resizing dynamically
function resizeChart() {
    width = window.innerWidth * 0.9 - margin.left - margin.right;
    height = Math.min(800, window.innerHeight * 0.85) - margin.top - margin.bottom; // Allow more height flexibility

    d3.select("#chart-svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

    // Ensure scales dynamically adjust
    xScale.range([margin.left, width - margin.right]);
    yScale.range([0, height]);

    // Re-call the axes
    svg.select(".x-axis")
        .attr("transform", `translate(0, ${height - margin.bottom})`) 
        .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => Math.abs(d)));

    svg.select(".y-axis")
        .call(d3.axisLeft(yScale));

    // Ensure labels remain in correct position
    svg.selectAll(".x-axis-label")
        .attr("y", height - margin.bottom + 80);
}

// Ensure chart resizes properly
window.addEventListener("resize", resizeChart);
resizeChart();


// Ensure chart resizes properly
window.addEventListener("resize", resizeChart);
resizeChart();


function expandBar(event, d) {
    if (!d.children) return;
    updateChart(d);

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
    updateChart(initialData);
    resizeChart();  // Ensures axes update correctly
}

