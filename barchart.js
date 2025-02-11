const margin = { top: 80, right: 40, bottom: 225, left: 100 },
    width = 800 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

const svg = d3.select(".project")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Ensure .selector-container exists
if (!document.querySelector(".selector-container")) {
    console.error("ERROR: .selector-container is missing in HTML!");
}

// Create dropdown menu
const selector = d3.select(".selector-container")
    .append("select")
    .attr("id", "optypeSelector");

console.log("Dropdown created");

// Load CSV data
d3.csv("cases_clean.csv").then(data => {
    console.log("CSV Data Loaded:", data);

    data.forEach(d => {
        d.surgery = isNaN(+d.surgery) ? 0 : +d.surgery;
        d.hospitalization = isNaN(+d.hospitalization) ? 0 : +d.hospitalization;
    });

    console.log("Parsed Data:", data);

    // Unique operation types for the dropdown
    const uniqueOpTypes = [...new Set(data.map(d => d.optype))];

    // Populate dropdown
    selector.append("option")
        .attr("value", "all")
        .text("All Operations");

    uniqueOpTypes.forEach(optype => {
        selector.append("option")
            .attr("value", optype)
            .text(optype);
    });

    // Define scales
    const x = d3.scaleBand()
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .nice()
        .range([height, 0]);

    // Append axes
    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height})`);

    const yAxis = svg.append("g");

    // X-Axis Label (Surgery Type or Operation Name)
    // const xAxisLabel = svg.append("text")
    //     .attr("x", width / 2)
    //     .attr("y", height + 90)
    //     .attr("text-anchor", "middle")
    //     .style("font-size", "14px")
    //     .text("Surgery Type");

    const xAxisLabel = svg.append("text")
    .attr("class", "x-axis-label")  // Added class for CSS styling
    .attr("x", width / 2)
    .attr("y", height + 150)  // Moved further down
    .attr("text-anchor", "right") // middle -> right
    .style("font-size", "14px")
    .text("Surgery Type");

    // Y-Axis Label (Duration in Minutes)
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -60)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Duration (minutes)");

    // Function to update the chart
    function updateChart(filteredData, isOpName = false) {
        const xDomain = isOpName ? filteredData.map(d => d.opname) : filteredData.map(d => d.optype);
        x.domain(xDomain);
        y.domain([0, d3.max(filteredData, d => Math.max(d.surgery, d.hospitalization))]).nice();

        xAxis.transition().duration(500)
            .call(d3.axisBottom(x))
            .selectAll("text")  // Rotate x-axis labels
            .style("text-anchor", "end")
            .attr("dx", "-0.8em")
            .attr("dy", "0.15em")
            .attr("transform", "rotate(-70)");

        yAxis.transition().duration(500).call(d3.axisLeft(y));

        // Update x-axis label dynamically
        xAxisLabel.text(isOpName ? "Operation Name" : "Surgery Type");

        // Surgery bars
        const barsSurgery = svg.selectAll(".bar-surgery").data(filteredData, d => d.caseid);

        barsSurgery.exit().remove();

        barsSurgery.enter()
            .append("rect")
            .attr("class", "bar-surgery")
            .merge(barsSurgery)
            .transition().duration(500)
            .attr("x", d => x(isOpName ? d.opname : d.optype))
            .attr("y", d => y(d.surgery))
            .attr("width", x.bandwidth() / 2)
            .attr("height", d => height - y(d.surgery))
            .attr("fill", "steelblue");

        // Hospitalization bars
        const barsHospitalization = svg.selectAll(".bar-hospitalization").data(filteredData, d => d.caseid);

        barsHospitalization.exit().remove();

        barsHospitalization.enter()
            .append("rect")
            .attr("class", "bar-hospitalization")
            .merge(barsHospitalization)
            .transition().duration(500)
            .attr("x", d => x(isOpName ? d.opname : d.optype) + x.bandwidth() / 2)
            .attr("y", d => y(d.hospitalization))
            .attr("width", x.bandwidth() / 2)
            .attr("height", d => height - y(d.hospitalization))
            .attr("fill", "orange");
    }

    // Initial render
    updateChart(data);

    // Dropdown event listener
    document.getElementById("optypeSelector").addEventListener("change", function () {
        const selectedOpType = this.value;
        const filteredData = selectedOpType === "all" ? data : data.filter(d => d.optype === selectedOpType);
        updateChart(filteredData, selectedOpType !== "all");
    });

}).catch(error => {
    console.error("Error loading CSV file:", error);
});
