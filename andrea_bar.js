// Define margins and dimensions
const margin = { top: 50, right: 50, bottom: 100, left: 50 };
const baseWidth = 1000 - margin.left - margin.right;
const baseHeight = 600 - margin.top - margin.bottom;

// Select the container and create the SVG
const container = d3.select(".chart-container1");

const svgContainer = d3.select("#andrea_bar")
    .attr("width", baseWidth + margin.left + margin.right)
    .attr("height", baseHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);


svgContainer.append("text")
    .attr("x", baseWidth / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("How Long Will it Take?")

svgContainer.append("text")
    .attr("x", baseWidth / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("fill", "#666")
    .text("An analysis of Surgery and Hospital Stay Durations Across Surgeries");

const dropdownContainer = container.append("div")
    .attr("class", "dropdown-container")
    .style("position", "absolute")
    .style("top", "800px")
    .style("anchor", "left")
    .style("z-index", "10");

const dropdown = dropdownContainer.append("select")
    .attr("id", "filterDropdown")
    .style("padding", "5px")
    .style("font-size", "14px")
    .style("background", "white")
    .style("border", "1px solid #ccc");


const resetButton = container.append("button")
    .text("Reset")
    .style("display", "none")
    .style("margin-top", "10px")
    .on("click", () => {
        updateChart(initialData, "optype");
        currentView = "main";
    });
// Tooltip
const tooltip = container.append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "8px")
    .style("background", "rgba(0, 0, 0, 0.75)")
    .style("color", "#fff")
    .style("border-radius", "3px")
    .style("display", "none")
    .style("pointer-events", "none");

// Create background rect for clicking to go back
const backRect = svgContainer.append("rect")
    .attr("width", baseWidth)
    .attr("height", baseHeight)
    .attr("fill", "white")
    .attr("opacity", 0)
    .style("cursor", "pointer")
    .on("click", () => {
        if (currentView === "sub") {
            updateChart(initialData, "optype");
            currentView = "main";
        }
    });

// Initialize two x-scales (left for surgery, right for hospital stay)
const xScaleLeft = d3.scaleLinear().range([0, baseWidth / 2]); // Surgery expands left
const xScaleRight = d3.scaleLinear().range([0, baseWidth/2]); // Hospital stay expands right
const yScale = d3.scaleBand().range([0, baseHeight]).padding(0.3);

// Create x-axis groups
const xAxisGroupLeft = svgContainer.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${baseHeight})`);

const xAxisGroupRight = svgContainer.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(${baseWidth / 2}, ${baseHeight})`);

// X-axis labels
const xAxisLabelLeft = svgContainer.append("text")
    .attr("class", "x-axis-label")
    .attr("x", baseWidth / 4)
    .attr("y", baseHeight + 60)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "black")
    .text("Average Surgery Duration (in hours)");

const xAxisLabelRight = svgContainer.append("text")
    .attr("class", "x-axis-label")
    .attr("x", (baseWidth / 4) * 3)
    .attr("y", baseHeight + 60)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "black")
    .text("Average Hospitalization Duration (in days)");

let currentView = "main"; // Track current view
let initialData;
function updateChart(data = null, groupBy = "optype") {
    // ✅ Load data dynamically if not provided
    if (!data) {
        d3.json("data/sub_durations_data.json")
            .then(response => {
                if (!response.children) {
                    throw new Error("No children found in JSON data");
                }
                initialData = response.children; // Store top-level data
                populateDropdown(initialData);
                updateChart(initialData, "optype"); // Show optypes first
            })
            .catch(error => console.error("Error loading JSON data:", error));
        return;
    }

    console.log("Data received:", data);

    // ✅ Prepare data depending on view (optypes or opnames)
    let processedData;
    if (groupBy === "optype") {
        // Aggregate surgery and stay times by `optype`
        processedData = data.map(category => ({
            name: category.name,
            surgery: d3.mean(category.children, d => d.surgery || 0),
            stay: d3.mean(category.children, d => d.stay || 0),
            children: category.children // Preserve children for filtering
        }));
    } else {
        // Show specific procedures within the selected `optype`
        processedData = data.map(procedure => ({
            name: procedure.name,
            surgery: procedure.surgery || 0,
            stay: procedure.stay || 0
        }));
    }

    // ✅ Set independent x-axis domains for each side
    const maxOpDur = d3.max(processedData, d => d.surgery || 0);
    const maxHospDur = d3.max(processedData, d => d.stay || 0);
    xScaleLeft.domain([0, maxOpDur]); // Surgery duration starts at 0
    xScaleRight.domain([0, maxHospDur]); // Hospital stay duration starts at 0

    // ✅ Dynamically adjust y-axis bandwidth based on the number of categories
    const minBandwidth = 10; // Minimum height for each bar
    const maxBandwidth = 50; // Maximum height for each bar
    const bandwidth = Math.min(maxBandwidth, baseHeight / processedData.length);
    yScale.padding(0.3).range([0, baseHeight]).paddingInner(Math.max(0.1, 0.3)); // Adjust padding dynamically

    yScale.domain(processedData.map(d => d.name));

    // ✅ Update the x-axes
    xAxisGroupLeft.transition().duration(500).call(d3.axisBottom(xScaleLeft).ticks(10));
    xAxisGroupRight.transition().duration(500).call(d3.axisBottom(xScaleRight).ticks(10));

    // ✅ Select bars
    const bars = svgContainer.selectAll(".bar").data(processedData, d => d.name);
    bars.exit().remove();

    const barsEnter = bars.enter().append("g").attr("class", "bar");

    // ✅ Surgery bars (Left side)
    barsEnter.append("rect")
        .attr("class", "bar-surgery")
        .merge(bars.select(".bar-surgery"))
        .transition().duration(800)
        .attr("y", d => yScale(d.name))
        .attr("x", d => baseWidth / 2 - xScaleLeft(d.surgery))
        .attr("height", yScale.bandwidth())
        .attr("width", d => xScaleLeft(d.surgery))
        .attr("fill", "steelblue");

    // ✅ Hospital stay bars (Right side)
    barsEnter.append("rect")
        .attr("class", "bar-hospitalization")
        .merge(bars.select(".bar-hospitalization"))
        .transition().duration(800)
        .attr("y", d => yScale(d.name))
        .attr("x", baseWidth / 2)
        .attr("height", yScale.bandwidth())
        .attr("width", d => xScaleRight(d.stay))
        .attr("fill", "orange");

    // ✅ Add text annotations for operation names in the center
    barsEnter.append("text")
        .attr("class", "bar-label-name")
        .merge(bars.select(".bar-label-name"))
        .transition().duration(800)
        .attr("x", baseWidth / 2) // Center of the chart
        .attr("y", d => yScale(d.name) + yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .style("fill", "black")
        .style("font-size", "12px")
        .style("text-anchor", "middle") // Center-align the text
        .text(d => d.name); // Display the operation name


    // ✅ Click to drill down
    barsEnter.on("click", function (event, d) {
        if (currentView === "main" && d.children) {
            console.log("Drilling into:", d.name);
            drillDown(d);
        }
    });

    // ✅ Tooltip for interaction
    barsEnter.on("mouseover", function (event, d) {
        tooltip.style("display", "block")
            .html(`
                <strong>${d.name}</strong><br>
                Surgery: ${d.surgery.toFixed(2)} hours<br>
                Stay: ${d.stay.toFixed(2)} days
            `);
    }).on("mousemove", function (event) {
        tooltip.style("top", `${event.pageY - 40}px`).style("left", `${event.pageX + 10}px`);
    }).on("mouseout", function () {
        tooltip.style("display", "none");
    });
}

// ✅ Drill-down function
function drillDown(d) {
    if (!d.children || d3.active(svgContainer.node())) return;

    // Collapse the selected bar
    const selectedBar = svgContainer.selectAll(".bar")
        .filter(datum => datum.name === d.name);

    selectedBar.selectAll("rect")
        .transition().duration(500)
        .attr("width", 0) // Collapse the bars
        .attr("fill-opacity", 0); // Fade out the bars

    // After the collapse, update the chart with the children data
    setTimeout(() => {
        updateChart(d.children, "opname");
        currentView = "sub";
    }, 500); // Wait for the collapse animation to finish
}

// Populate dropdown with data
function populateDropdown(data) {
    dropdown.selectAll("option").remove();
    dropdown.append("option")
        .attr("value", "all")
        .text("All Operations");

    data.forEach(d => {
        dropdown.append("option")
            .attr("value", d.name)
            .text(d.name);
    });

    dropdown.on("change", function () {
        const selected = this.value;
        if (selected === "all") {
            updateChart(initialData, "optype");
        } else {
            const filteredData = initialData.find(d => d.name === selected);
            if (filteredData && filteredData.children) {
                updateChart(filteredData.children, "opname");
            }
        }
    });
}

// ✅ Make updateChart globally accessible
window.updateChart = updateChart;

// ✅ Load the chart on page load
updateChart();