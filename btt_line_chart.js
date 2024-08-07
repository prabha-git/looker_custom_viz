console.log("from github")
looker.plugins.visualizations.add({
  id: "lcp_comparison_chart",
  label: "LCP Comparison Chart",
  options: {
    color_range: {
      type: "array",
      label: "Color Range",
      display: "colors",
      default: ["#007bff", "#28a745"]
    }
  },
  create: function(element, config) {
    element.innerHTML = '<div id="chartContainer" style="width:100%;height:100%;"></div>';
  },
  updateAsync: function(data, element, config, queryResponse, details, done) {
    // Check for errors
    if (!handleErrors(this, queryResponse, {
      min_pivots: 0,
      max_pivots: 0,
      min_dimensions: 1,
      max_dimensions: 1,
      min_measures: 2,
      max_measures: 2
    })) {
      return;
    }

    // Get the data
    var dimensionName = queryResponse.fields.dimensions[0].name;
    var measure1Name = queryResponse.fields.measures[0].name;
    var measure2Name = queryResponse.fields.measures[1].name;

    var chartData = data.map(function(row) {
      return {
        x: row[dimensionName].value,
        y1: row[measure1Name].value,
        y2: row[measure2Name].value
      };
    });

    // Sort data by x value
    chartData.sort(function(a, b) {
      return new Date(a.x) - new Date(b.x);
    });

    // Prepare series data
    var series1Data = chartData.map(function(point) {
      return [new Date(point.x).getTime(), point.y1];
    });

    var series2Data = chartData.map(function(point) {
      return [new Date(point.x).getTime(), point.y2];
    });

    // Create the chart
    Highcharts.chart('chartContainer', {
      chart: {
        type: 'line'
      },
      title: {
        text: 'LCP Comparison Chart'
      },
      xAxis: {
        type: 'datetime',
        title: {
          text: 'Date'
        }
      },
      yAxis: {
        title: {
          text: 'LCP (seconds)'
        }
      },
      tooltip: {
        shared: true,
        formatter: function() {
          var currentDate = Highcharts.dateFormat('%b %e', this.x);
          var tooltipText = '<b>Date: ' + currentDate + '</b><br/>';
          this.points.forEach(function(point) {
            tooltipText += point.series.name + ': <b>' + point.y.toFixed(2) + '</b><br/>';
          });
          return tooltipText;
        }
      },
      series: [{
        name: 'This Period LCP',
        data: series1Data,
        color: config.color_range[0],
        marker: {
          enabled: true,
          symbol: 'circle',
          radius: 4
        },
        dashStyle: 'Solid',
        lineWidth: 2
      }, {
        name: 'Previous Period LCP',
        data: series2Data,
        color: config.color_range[1],
        marker: {
          enabled: true,
          symbol: 'square',
          radius: 4
        },
        dashStyle: 'Dash',
        lineWidth: 2
      }]
    });

    done();
  }
});

function handleErrors(vis, queryResponse, requirements) {
  var errors = [];

  if (queryResponse.fields.dimensions.length != requirements.min_dimensions) {
    errors.push('This chart requires ' + requirements.min_dimensions + ' dimension');
  }

  if (queryResponse.fields.measures.length < requirements.min_measures ||
      queryResponse.fields.measures.length > requirements.max_measures) {
    errors.push('This chart requires between ' + requirements.min_measures + ' and ' + requirements.max_measures + ' measures');
  }

  if (errors.length > 0) {
    vis.addError({ title: 'Data Requirements', message: errors.join('. ') });
    return false;
  }

  return true;
}
