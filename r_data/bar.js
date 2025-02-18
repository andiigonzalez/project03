import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const width = 900;
const height = 600;
const margin = { top: 50, right: 150, bottom: 50, left: 150 };

const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Add a back button
const backButton = d3.select("body")
    .append("button")
    .text("Back")
    .style("display", "none")
    .style("position", "absolute")
    .style("top", "20px")
    .style("left", "20px")
    .on("click", resetChart);

let initialData;

// Load JSON data
d3.json("hierarchical_surgery_data.json").then(data => {
    if (!data.children) {
        console.error("No children found in JSON data.");
        return;
    }

    // Process hierarchy and calculate parent averages
    initialData = d3.hierarchy(data)
        .eachBefore(d => {
            if (d.children) {
                let totalOpDur = 0, totalHospDur = 0, count = 0;

                d.children.forEach(child => {
                    if (child.data.op_dur !== undefined && child.data.hosp_dur !== undefined) {
                        totalOpDur += child.data.op_dur;
                        totalHospDur += child.data.hosp_dur;
                        count++;
                    }
                });

                // Compute the average
                d.data.op_dur = count > 0 ? totalOpDur / count : 0;
                d.data.hosp_dur = count > 0 ? totalHospDur / count : 0;
            }

            // Ensure values are numbers
            d.op_dur = parseFloat(d.data.op_dur) || 0;
            d.hosp_dur = parseFloat(d.data.hosp_dur) || 0;

            console.log("Processed Durations:", d.data.name, "op_dur:", d.op_dur, "hosp_dur:", d.hosp_dur);
        })
        .sum(d => d.op_dur)  // Use total surgery duration as node size
        .sort((a, b) => b.value - a.value);

    updateChart(initialData);
}).catch(error => {
    console.error("Error loading JSON data:", error);
});

// Function to update chart
function updateChart(root) {
    if (!root.children || root.children.length === 0) {
        console.error("No valid child nodes found.");
        return;
    }

    // Get max values for both durations to set up a common scale
    const maxOpDur = d3.max(root.children, d => d.data.op_dur || 0);
    const maxHospDur = d3.max(root.children, d => d.data.hosp_dur || 0);
    const maxDuration = Math.max(maxOpDur, maxHospDur);

    console.log("Max Surgery Duration:", maxOpDur);
    console.log("Max Hospital Duration:", maxHospDur);
    console.log("Using max duration:", maxDuration);

    // Dynamically set height based on the number of bars
    const numBars = root.children.length;
    const barHeight = 30;
    const newHeight = Math.max(600, numBars * barHeight); // Minimum height of 600px

    // Resize the SVG width dynamically based on maxDuration
    const dynamicWidth = Math.max(1000, maxDuration * 50); // Ensure proper width scaling

    d3.select("svg")
        .transition().duration(750)
        .attr("height", newHeight + margin.bottom + 20) // Adjust height to ensure x-axis visibility
        .attr("width", dynamicWidth);

    console.log("Updated chart dimensions: Width:", dynamicWidth, "Height:", newHeight);

    // Define X scale (restored the correct domain & range)
    const xScale = d3.scaleLinear()
        .domain([-maxDuration, maxDuration])  // Ensures bars extend from 0 on both sides
        .range([margin.left, dynamicWidth - margin.right]); // Full SVG width

    const yScale = d3.scaleBand()
        .domain(root.children.map(d => d.data.name))
        .range([0, newHeight - margin.top - margin.bottom])
        .padding(0.3);

    // Ensure Y Axis exists and updates properly
    let yAxis = svg.select(".y-axis");
    if (yAxis.empty()) {
        yAxis = svg.append("g").attr("class", "y-axis");
    }
    yAxis.transition().duration(750)
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale));

    // Ensure X Axis exists and is properly centered at 0
    let xAxis = svg.select(".x-axis");
    if (xAxis.empty()) {
        xAxis = svg.append("g").attr("class", "x-axis");
    }
    xAxis.transition().duration(750)
        .attr("transform", `translate(0, ${newHeight - margin.bottom - 50})`) // Adjusted to stay visible
        .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => Math.abs(d))); // Restored correct format

    // JOIN: Bind new data
    const bars = svg.selectAll(".bar-group")
        .data(root.children, d => d.data.name);

    // EXIT: Remove old bars
    bars.exit()
        .transition().duration(500)
        .style("opacity", 0)
        .remove();

    // ENTER: Create new bars with transitions
    const barGroups = bars.enter()
        .append("g")
        .attr("class", "bar-group")
        .attr("transform", d => `translate(0, ${yScale(d.data.name)})`)
        .style("opacity", 0);

    barGroups.transition().duration(750).style("opacity", 1);

    // Surgery Duration Bars (left side)
    barGroups.append("rect")
        .attr("class", "bar op-bar")
        .attr("x", d => xScale(-d.data.op_dur || 0))  // Align bars correctly
        .attr("width", 0) // Start from 0 width for smooth transition
        .attr("height", yScale.bandwidth())
        .attr("fill", "#1f77b4")
        .on("click", (event, d) => expandBar(event, d))
        .transition().duration(750)
        .attr("width", d => Math.abs(xScale(0) - xScale(-d.data.op_dur || 0))); // Correct bar width

    // Hospitalization Duration Bars (right side)
    barGroups.append("rect")
        .attr("class", "bar hosp-bar")
        .attr("x", xScale(0)) // Start at center
        .attr("width", 0) // Start from 0 width for smooth transition
        .attr("height", yScale.bandwidth())
        .attr("fill", "#ff7f0e")
        .on("click", (event, d) => expandBar(event, d))
        .transition().duration(750)
        .attr("width", d => xScale(d.data.hosp_dur || 0) - xScale(0)); // Correct right-side width

    // Labels inside bars
    barGroups.append("text")
        .attr("class", "label")
        .attr("x", xScale(0) - 10) // Align labels near center
        .attr("y", yScale.bandwidth() / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .text(d => d.data.name)
        .transition().duration(750)
        .style("opacity", 1);

    // Ensure axis labels persist
    let xAxisTitleLeft = svg.select(".x-axis-title-left");
    if (xAxisTitleLeft.empty()) {
        xAxisTitleLeft = svg.append("text")
            .attr("class", "x-axis-title-left")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text("Average Surgery Duration (in hours)");
    }
    xAxisTitleLeft.transition().duration(750)
        .attr("x", xScale(-maxDuration / 2))
        .attr("y", newHeight - margin.bottom);

    let xAxisTitleRight = svg.select(".x-axis-title-right");
    if (xAxisTitleRight.empty()) {
        xAxisTitleRight = svg.append("text")
            .attr("class", "x-axis-title-right")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text("Average Hospitalization Duration (in days)");
    }
    xAxisTitleRight.transition().duration(750)
        .attr("x", xScale(maxDuration / 2))
        .attr("y", newHeight - margin.bottom);

    // Show back button when navigating subcategories
    backButton.style("display", root !== initialData ? "block" : "none");
}



// Expand function when clicking a bar
function expandBar(event, d) {
    if (!d.children) return; // Only expand if children exist

    updateChart(d);
}

// Reset chart to initial state
function resetChart() {
    updateChart(initialData);
}
