import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const width = 900;
const height = 600;
const margin = { top: 50, right: 150, bottom: 50, left: 150 };

// Create tooltip
const tooltip = d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("display", "none");

const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

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
    const barHeight = 30;
    const newHeight = Math.max(600, numBars * barHeight);
    const dynamicWidth = Math.max(1000, maxDuration * 50);

    d3.select("svg")
        .transition().duration(750)
        .attr("height", newHeight + margin.bottom + 20)
        .attr("width", dynamicWidth);

    const xScale = d3.scaleLinear()
        .domain([-maxDuration, maxDuration])
        .range([margin.left, dynamicWidth - margin.right]);

    const yScale = d3.scaleBand()
        .domain(root.children.map(d => d.data.name))
        .range([0, newHeight - margin.top - margin.bottom])
        .padding(0.3);

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
    xAxis.transition().duration(750)
        .attr("transform", `translate(0, ${newHeight - margin.bottom - 50})`)
        .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => Math.abs(d)));

    // Add X-axis labels back
    svg.selectAll(".x-axis-label").remove();
    
    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", xScale(-maxDuration / 2))
        .attr("y", newHeight - margin.bottom + 15)
        .text("Average Surgery Duration (in hours)");

    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", xScale(maxDuration / 2))
        .attr("y", newHeight - margin.bottom + 15)
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


function expandBar(event, d) {
    if (!d.children) return;
    updateChart(d);
}

function resetChart() {
    updateChart(initialData);
}
