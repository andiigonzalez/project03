import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const svg = d3.select("#barchart");
const dropdown = d3.select("#surgery-select");

d3.csv("cases_clean.csv", d3.autoType).then(data => {
    const surgeryTypes = ["All", ...new Set(data.map(d => d.optype))];

    dropdown.selectAll("option")
        .data(surgeryTypes)
        .enter().append("option")
        .text(d => d);

    const width = 800, height = 500, margin = 50;
    const xScale = d3.scaleBand().range([margin, width - margin]).padding(0.2);
    const yScale = d3.scaleLinear().range([height - margin, margin]);

    function updateChart(selectedType) {
        const filteredData = selectedType === "All" ? data : data.filter(d => d.optype === selectedType);
        const summary = d3.rollup(filteredData, v => d3.mean(v, d => d.opdur_mins), d => d.opname);
        const dataset = Array.from(summary, ([name, avg]) => ({ name, avg }));

        xScale.domain(dataset.map(d => d.name));
        yScale.domain([0, d3.max(dataset, d => d.avg)]);

        svg.selectAll("rect").data(dataset).join("rect")
            .attr("x", d => xScale(d.name))
            .attr("y", d => yScale(d.avg))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - margin - yScale(d.avg))
            .attr("fill", "steelblue");
    }

    updateChart("All");
    dropdown.on("change", function () { updateChart(this.value); });
});

