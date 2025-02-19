var NamespaceFirst = (function(){
    var n = 8, // The number of series.
        m = 26; // The number of values per series.

    // The xz array has m elements, representing the x-values shared by all series.
    // The yz array has n elements, representing the y-values of each of the n series.
    // Each yz[i] is an array of m non-negative numbers representing a y-value for xz[i].
    // The y01z array has the same structure as yz, but with stacked [y₀, y₁] instead of y.
    var xz = d3.range(m),
        yz = d3.range(n).map(function () { return bumps(m); }),
        y01z = d3.stack().keys(d3.range(n))(d3.transpose(yz)),
        yMax = d3.max(yz, function (y) { return d3.max(y); }),
        y1Max = d3.max(y01z, function (y) { return d3.max(y, function (d) { return d[1]; }); });

    var svg = d3.select("#firstChart svg"),
        margin = { top: 40, right: 10, bottom: 20, left: 10 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleBand()
        .domain(xz)
        .rangeRound([0, width])
        .padding(0.08);

    var y = d3.scaleLinear()
        .domain([0, y1Max])
        .range([height, 0]);

    var color = d3.scaleLinear()
        .domain([0,n-1])
        //.range(["lightgrey", "black"])
        .range(["orange", "red"])
        //.interpolate(d3.interpolateHcl);

    var series = g.selectAll(".series")
        .data(y01z)
        .enter().append("g")
        .attr("fill", function (d, i) { return color(i); });

    var rect = series.selectAll("rect")
        .data(function (d) { return d; })
        .enter().append("rect")
        .attr("x", function (d, i) { return x(i); })
        .attr("y", height)
        .attr("width", x.bandwidth())
        .attr("height", 0);

    rect.transition()
        .delay(function (d, i) { return i * 10; })
        .attr("y", function (d) { return y(d[1]); })
        .attr("height", function (d) { return y(d[0]) - y(d[1]); });

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
            .tickSize(0)
            .tickPadding(6));

    d3.selectAll("#firstChart input")
        .on("change", changed);

    var timeout = d3.timeout(function () {
        d3.select("input[value=\"grouped\"]")
            .property("checked", true)
            .dispatch("change");
    }, 2000);

    function changed() {
        timeout.stop();
        if (this.value === "grouped") transitionGrouped();
        else transitionStacked();
    }

    function transitionGrouped() {
        y.domain([0, yMax]);

        rect.transition()
            .duration(400)
            .delay(function (d, i) { return i * 10; })
            .attr("x", function (d, i) { return x(i) + x.bandwidth() / n * this.parentNode.__data__.key; })
            .attr("width", x.bandwidth() / n)
            .transition()
            .attr("y", function (d) { return y(d[1] - d[0]); })
            .attr("height", function (d) { return y(0) - y(d[1] - d[0]); });
    }

    function transitionStacked() {
        y.domain([0, y1Max]);

        rect.transition()
            .duration(500)
            .delay(function (d, i) { return i * 10; })
            .attr("y", function (d) { return y(d[1]); })
            .attr("height", function (d) { return y(d[0]) - y(d[1]); })
            .transition()
            .attr("x", function (d, i) { return x(i); })
            .attr("width", x.bandwidth());
    }

    // Returns an array of m psuedorandom, smoothly-varying non-negative numbers.
    // Inspired by Lee Byron’s test data generator.
    // http://leebyron.com/streamgraph/
    function bumps(m) {
        var values = [], i, j, w, x, y, z;

        // Initialize with uniform random values in [0.1, 0.2).
        for (i = 0; i < m; ++i) {
            values[i] = 0.1 + 0.1 * Math.random();
        }

        // Add five random bumps.
        for (j = 0; j < 5; ++j) {
            x = 1 / (0.1 + Math.random());
            y = 2 * Math.random() - 0.5;
            z = 10 / (0.1 + Math.random());
            for (i = 0; i < m; i++) {
                w = (i / m - y) * z;
                values[i] += x * Math.exp(-w * w);
            }
        }

        // Ensure all values are positive.
        for (i = 0; i < m; ++i) {
            values[i] = Math.max(0, values[i]);
        }

        return values;
    }
})();