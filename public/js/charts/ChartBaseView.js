const _ = require('lodash');
const d3 = require('d3');

const CrossfilterDataStore = require('../stores/CrossfilterDataStore');

/**
 * Creates a D3-like scale constructor that when set with a domain of ordinals (intended:
 * organization names), the scale returns a color using the d3.interpolateCool() scale.
 * @returns {orgScale} a d3-scale-like object that you can call .domain() on.
 */
const scaleOrgColor = function() {
  let scale = d3.scaleOrdinal();

  let orgScale = function(org) {
    return d3.interpolateCool(scale(org));
  };

  orgScale.domain = function(domainList) {
    scale.domain(domainList);

    if (!domainList.length) {
      scale.range([]);
    } else if (domainList.length === 1) {
      scale.range([0]);
    } else {
      // make range 0 - 1, with length === domainList.length
      scale.range(d3.range(0, 1 + 1 / domainList.length, 1 / (domainList.length - 1)));
    }

    return this;
  };

  return orgScale;
};
window.scaleOrgColor = scaleOrgColor;

module.exports = class ChartBaseView {
  constructor(svgSelector = 'svg', _opts = {}) {
    // flux bindings:
    // ----------------
    CrossfilterDataStore.listen(this.onNewCrossfilterData.bind(this));


    // d3 setup:
    // ----------------
    let svg = this.svg = d3.select(svgSelector);

    if (!svg.size()) {
      throw new Error('Invalid svg specified');
    }

    let opts = this.opts = _.defaults(_opts, {
      margin: {
        left: 80,
        right: 10,
        bottom: 20,
        top: 10,
      },
    });

    // margin convention: http://bl.ocks.org/mbostock/3019563
    svg = svg.append('g')
      .attr('transform', `translate(${opts.margin.left}, ${opts.margin.top})`);

    let svgW = parseInt(this.svg.attr('width'), 10);
    let svgH = parseInt(this.svg.attr('height'), 10);

    if (!svgW || !svgH) {
      throw new Error('Invalid svg specified -- must have w and h');
    }

    this.opts.chartArea = _.defaults(opts.chartArea || {}, {
      width: svgW - opts.margin.left - opts.margin.right,
      height: svgH - opts.margin.top - opts.margin.bottom,
    });

    this._components = {
      xScale: d3.scaleLinear().range([0, opts.chartArea.width]),

      axisYScale: d3.scaleLinear().range([opts.chartArea.height, 0]),
      canvasYScale: d3.scaleLinear().range([0, opts.chartArea.height]),
    };

    this._components.xAxis = d3.axisBottom(this._components.xScale)
      .tickSize(3)
      .tickPadding(6);

    this._components.yAxis = d3.axisLeft(this._components.axisYScale)
      .tickSize(3)
      .tickPadding(6)
      .ticks(5, '3s');

    this._svg = {
      xAxis: svg.append('g')
        .classed('x axis', true)
        .attr('transform', `translate(0, ${opts.chartArea.height})`),

      yAxis: svg.append('g').classed('y axis', true),

      chartArea: svg.append('g')
        .classed('chart-canvas', true)
        .attr('transform', `translate(1, ${opts.chartArea.height}) scale(1, -1)`),
    };
  }

  onNewCrossfilterData(xfData) {
    if (!xfData.drilldownName) {
      throw new Error('Missing drilldown category!');
    }

    if (xfData.drilldownName === 'allAmount') {
      this.renderAllAmount(xfData);
    } else if (xfData.drilldownName === 'amountByOrg') {
      this.renderByOrgs(xfData);
    } else if (xfData.drilldownName === 'amountBySdg') {
      this.renderBySdg(xfData);
    }
  }

  /**
   * Updates y-axis scales
   * @param {Array(number)} config.domain Sets the domain of scales
   * @param {function(scale)} config.call Calls a transform function, passing each scale as the arg
   *   (eg for .nice())
   * @returns {ChartBaseView}
   */
  updateYScale(config) {
    this._components.axisYScale.domain(config.domain);
    this._components.canvasYScale.domain(config.domain);

    if (config.call) {
      config.call(this._components.axisYScale);
      config.call(this._components.canvasYScale);
    }

    return this;
  }

  renderScales() {
    // this._svg.xAxis.call(this._components.xAxis);
    this._svg.yAxis.transition()
      .call(this._components.yAxis);
  }

  renderAllAmount(xfData) {
    let allAmount = xfData.allAmount;
    let allGlyphs = this._svg.chartArea.selectAll('rect.glyph')
      .data([allAmount]);

    this.updateYScale({
      domain: [0, xfData.goal],
      call: s => s.nice(),
    });
    this.renderScales();

    let yScale = this._components.canvasYScale;

    let glyphWidth = 20;

    allGlyphs.exit()
      .transition()
        .attr('x', 0)
        .attr('y', yScale(0))
        .attr('width', glyphWidth)
        .attr('height', 0)
        .remove();

    allGlyphs
      .enter()
        .append('rect')
        .classed('glyph', true)
        .attr('x', 0)
        .attr('y', yScale(0))
        .attr('width', glyphWidth)
        .attr('height', 0)
        .style('fill', '#000')
      .merge(allGlyphs)
      .transition()
        .attr('x', 0)
        .attr('y', yScale(0))
        .attr('width', glyphWidth)
        .attr('height', yScale)
        .style('fill', '#000');
  }

  renderBySdg(xfData) {
    let allAmount = xfData.allAmount;
    let sdgsByAmount = xfData.drilldownKV; // list of {key: <sdgId>, value: <number>}

    let keys = sdgsByAmount.map(r => r.key);
    let drilldownByKey = _.keyBy(sdgsByAmount, r => r.key);

    let stacker = d3.stack()
      .keys(keys)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    // Transform data into a list of x-entries as expected by d3 stack generator
    // (although we're using only 1 x-val)
    let dataInverse = [{}];
    sdgsByAmount.forEach(r => {
      dataInverse[0][r.key] = r.value;
    });

    let series = stacker(dataInverse)
      .sort((s1, s2) => d3.ascending(s1.index, s2.index));

    // Now we have a list of series: [ [<sdg-A data 1>, ...], [<sdg-B data 1>, ... ], ...]
    // Need to flatten it because only doing one datum for each serie.
    let data = series.map(s => ({ sdgId: s.key, stackD: s[0], xfData: drilldownByKey[s.key] }))

      // d3 stack generator makes the top element the last element in the list.  That screws up
      // the transitions a bit because the data bind joins on index order, so if we data join
      // to/from a smaller list, the top element disapears while we want it to morph into the
      // smaller one.  Since stack generator gives us absolute coordinates, we simply reverse
      // the order of the data bind.
      .reverse();

    let allGlyphs = this._svg.chartArea.selectAll('rect.glyph')
      .data(data);

    this.updateYScale({
      domain: [0, allAmount],
      call: s => s.nice(),
    });
    this.renderScales();

    let yScale = this._components.canvasYScale;

    let glyphWidth = 20;

    allGlyphs.exit()
      .transition()
        .attr('x', 0)
        .attr('y', yScale(0))
        .attr('width', glyphWidth)
        .attr('height', 0)
        .remove();

    allGlyphs
      .enter()
      .append('rect')
        .classed('glyph', true)
        .attr('x', 0)
        .attr('y', yScale(0))
        .attr('width', glyphWidth)
        .attr('height', 0)
        .style('fill', d => (d.xfData.meta ? d.xfData.meta.color : '#000'))
      .merge(allGlyphs)
      .transition()
        .attr('x', 0)
        .attr('y', d => yScale(d.stackD[0]))
        .attr('width', glyphWidth)
        .attr('height', d => yScale(d.stackD[1] - d.stackD[0]))
        .style('fill', d => (d.xfData.meta ? d.xfData.meta.color : '#000'));
  }

  renderByOrgs(xfData) {
    let allAmount = xfData.allAmount;
    let sdgsByOrg = xfData.drilldownKV; // list of {key: <sdgId>, value: <number>}

    let keys = sdgsByOrg.map(r => r.key);

    let stacker = d3.stack()
      .keys(keys)
      .order(d3.stackOrderDescending)
      .offset(d3.stackOffsetNone);

    // Transform data into a list of x-entries as expected by d3 stack generator
    // (although we're using only 1 x-val)
    let dataInverse = [{}];
    sdgsByOrg.forEach(r => {
      dataInverse[0][r.key] = r.value;
    });

    let series = stacker(dataInverse)
      .sort((s1, s2) => d3.ascending(s1.index, s2.index));

    // Now we have a list of series: [ [<sdg-A data 1>, ...], [<sdg-B data 1>, ... ], ...]
    // Need to flatten it because only doing one datum for each serie.
    let data = series.map(s => ({ orgId: s.key, stackD: s[0] }));

    // d3 stack generator makes the top element the last element in the list.  That screws up
    // the transitions a bit because the data bind joins on index order, so if we data join
    // to/from a smaller list, the top element disapears while we want it to morph into the
    // smaller one.  Since stack generator gives us absolute coordinates, we simply reverse
    // the order of the data bind.
    data.reverse();

    let allGlyphs = this._svg.chartArea.selectAll('rect.glyph')
      .data(data);

    this.updateYScale({
      domain: [0, allAmount],
      call: s => s.nice(),
    });
    this.renderScales();

    let yScale = this._components.canvasYScale;

    let glyphWidth = 20;
    let orgScale = scaleOrgColor();
    orgScale.domain(data.map(d => d.orgId).reverse());

    allGlyphs.exit()
      .transition()
        .attr('x', 0)
        .attr('y', yScale(0))
        .attr('width', glyphWidth)
        .attr('height', 0)
        .remove();

    allGlyphs
      .enter()
      .append('rect')
        .classed('glyph', true)
        .attr('x', 0)
        .attr('y', yScale(0))
        .attr('width', glyphWidth)
        .attr('height', 0)
        .style('fill', d => orgScale(d.orgId))
      .merge(allGlyphs)
      .transition()
        .attr('x', 0)
        .attr('y', d => yScale(d.stackD[0]))
        .attr('width', glyphWidth)
        .attr('height', d => yScale(d.stackD[1] - d.stackD[0]))
        .style('fill', d => orgScale(d.orgId));
  }
};
