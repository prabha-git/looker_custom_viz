looker.plugins.visualizations.add({
  // Id and Label are legacy properties that no longer have any function besides documenting
  // what the visualization used to have. The properties are now set via the manifest
  // form within the admin/visualizations page of Looker
  id: "btt_line_chart",
  label: "LCP Comparison Chart",
  options: {
    // Add any configurable options here
    color_this_period: {
      type: "string",
      label: "This Period Color",
      default: "#007bff"
    },
    color_previous_period: {
      type: "string",
      label: "Previous Period Color",
      default: "#28a745"
    }
  },
  
  // Set up the initial state of the visualization
  create: function(element, config) {
    // Insert a <style> tag with some styles we'll use later.
    element.innerHTML = `
      <style>
        .lcp-chart {
          width: 100%;
          height: 100%;
        }
      </style>
      <div class="lcp-chart"></div>
    `;
    this.chart = null;
  },

  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done) {
    // Clear any errors from previous updates
    this.clearErrors();

    // Throw some errors and exit if the shape of the data isn't what we expect
    if (queryResponse.fields.dimensions.length == 0) {
      this.addError({title: "No Dimensions", message: "This chart requires dimensions."});
      return;
    }
    if (queryResponse.fields.measures.length == 0) {
      this.addError({title: "No Measures", message: "This chart requires measures."});
      return;
    }

    // Extract the data from the Looker query response
    const extractData = (data, queryResponse) => {
      const dateField = queryResponse.fields.dimensions[0].name;
      const lcpField = queryResponse.fields.measures[0].name;
      const pivotField = queryResponse.pivots[0].key;

      return data.reduce((acc, row) => {
        const date = row[dateField].value;
        const pivotValue = row[pivotField][lcpField].value;

        if (!acc[date]) {
          acc[date] = {};
        }
        acc[date][pivotField] = pivotValue;
        return acc;
      }, {});
    };

    const extractedData = extractData(data, queryResponse);

    // Transform the data for Highcharts
    const transformData = (data) => {
      const thisPeriodData = [];
      const previousPeriodData = [];

      Object.entries(data).forEach(([date, values]) => {
        if (values['This Period']) {
          thisPeriodData.push([new Date(date).getTime(), values['This Period']]);
        }
        if (values['Previous Period']) {
          previousPeriodData.push([new Date(date).getTime(), values['Previous Period']]);
        }
      });

      return [thisPeriodData, previousPeriodData];
    };

    const [thisPeriodData, previousPeriodData] = transformData(extractedData);

    // Get the chart container
    const chartContainer = element.querySelector('.lcp-chart');

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    // Create the chart
    this.chart = Highcharts.chart(chartContainer, {
      title: {
        text: 'LCP Over Time - Current vs Previous Period'
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
          return this.points.reduce((s, point) => {
            return s + '<br/>' + point.series.name + ': <b>' + point.y.toFixed(2) + '</b>';
          }, '<b>' + Highcharts.dateFormat('%b %e, %Y', this.x) + '</b>');
        }
      },
      series: [{
        name: 'This Period LCP',
        data: thisPeriodData,
        color: config.color_this_period,
        marker: {
          symbol: 'circle'
        }
      }, {
        name: 'Previous Period LCP',
        data: previousPeriodData,
        color: config.color_previous_period,
        marker: {
          symbol: 'square'
        }
      }]
    });

    // We are done rendering! Let Looker know.
    done();
  }
});
