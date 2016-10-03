const _ = require('lodash');
const d3 = require('d3');

const actions = require('../actions');
const CrossfilterDataStore = require('../stores/CrossfilterDataStore');
const InteractionDataStore = require('../stores/InteractionStore');
const Formatters = require('../Formatters');

const ThermometerOutline = require('./ThermometerOutline');
const AmountIndicator = require('./AmountIndicator');

const GLYPH_WIDTH = 21;
const THERM_OUTLINE_WIDTH = 10;

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

function addGlossGradientDef(svgDefsSelection) {
  svgDefsSelection.append('linearGradient')
    .attr('id', 'thermGloss')
    .attr('spreadMethod', 'pad')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '0%')
    .html(`
      <stop offset="0%"   style="stop-color:rgba(255, 255, 255, 0);stop-opacity:0;" />
      <stop offset="28%"  style="stop-color:rgba(255, 255, 255, 0.76);stop-opacity:0.76;" />
      <stop offset="48%"  style="stop-color:rgba(134, 134, 134, 0.4);stop-opacity:0.4;" />
      <stop offset="75%"  style="stop-color:rgba(0, 0, 0, 0.3);stop-opacity:0.3;" />
      <stop offset="100%" style="stop-color:rgba(255, 255, 255, 0);stop-opacity:0;" />
    `);
}

module.exports = class ChartBaseView {
  constructor(svgSelector = 'svg', _opts = {}) {
    // flux bindings:
    // ----------------
    CrossfilterDataStore.listen(this.onNewCrossfilterData.bind(this));
    InteractionDataStore.listen(this.onNewInteractionData.bind(this));


    // d3 setup:
    // ----------------
    let svg = this.svg = d3.select(svgSelector);

    if (!svg.size()) {
      throw new Error('Invalid svg specified');
    }

    let opts = this.opts = _.defaults(_opts, {
      margin: {
        left: 25,
        right: 10,
        bottom: 50,
        top: 22,
      },
    });

    let defs = svg.append('defs');
    ThermometerOutline.addGradientDef(defs);
    addGlossGradientDef(defs);

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

    this._components.yAxis = d3.axisRight(this._components.axisYScale)
      .tickSize(10)
      .tickPadding(6)
      .ticks(5)
      .tickFormat(Formatters.tick);

    this._svg = {
      thermometer: svg.append('g'),

      xAxis: svg.append('g')
        .classed('x axis', true)
        .attr('transform', `translate(0, ${opts.chartArea.height})`),

      yAxis: svg.append('g')
        .classed('y axis', true)
        .attr('transform', `translate(${GLYPH_WIDTH + THERM_OUTLINE_WIDTH * 1.5}, 0)`),

      amountIndicator: svg.append('g')
        .attr('transform', `translate(${GLYPH_WIDTH + THERM_OUTLINE_WIDTH * 1.7}, 0)`),

      chartArea: svg.append('g')
        .classed('chart-canvas', true)
        .attr('transform', `translate(0, ${opts.chartArea.height}) scale(1, -1)`),

      chartAreaDecoration: svg.append('g')
        .classed('chart-canvas-decoration', true)
        .attr('transform', `translate(0, ${opts.chartArea.height}) scale(1, -1)`),
    };

    // Note: we want ThermometerOutline's bulb to be stacked above this element, so since both are going inside
    // this._svg.chartAreaDecoration, this must be BEFORE ThermometerOutline instantiated.
    this._svg.chartAreaGloss = this._svg.chartAreaDecoration.append('rect')
      .attr('fill', 'url(#thermGloss)') // id of addGlossGradientDef()
      .classed('therm-gloss', true)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', GLYPH_WIDTH)
      .attr('height', 0);

    this._components.thermometerOutline = new ThermometerOutline(
      this._svg.thermometer,
      this._svg.chartAreaDecoration,
      {
        startX: 0,
        startY: 0,

        thermW: GLYPH_WIDTH,
        thermH: this.opts.chartArea.height,

        outlineW: THERM_OUTLINE_WIDTH,
        bulbR: GLYPH_WIDTH - 1,

        initialColor: 'FireBrick',
      }
    );

    this._components.amountIndicator = new AmountIndicator(
      this._svg.amountIndicator,
      this._components.axisYScale
    )
      .setPos(0);
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

  scaleGloss(newHeightPx) {
    this._svg.chartAreaGloss.transition()
      .attr('height', newHeightPx);
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

    this.scaleGloss(yScale(allAmount));

    this.initIndicator(null, null, allAmount);
    this._svg.chartArea.classed('clickable', false);

    allGlyphs.exit()
      .transition()
        .attr('x', 0)
        .attr('y', yScale(0))
        .attr('width', GLYPH_WIDTH)
        .attr('height', 0)
        .remove();

    allGlyphs
      .enter()
        .append('rect')
        .classed('glyph', true)
        .attr('x', 0)
        .attr('y', yScale(0))
        .attr('width', GLYPH_WIDTH)
        .attr('height', 0)
        .style('fill', 'FireBrick')
      .merge(allGlyphs)
        .on('mouseover', null) // clear any mouseover's
        .on('click', null) // clear any clicks
      .transition()
        .attr('x', 0)
        .attr('y', yScale(0))
        .attr('width', GLYPH_WIDTH)
        .attr('height', yScale)
        .style('fill', 'FireBrick');

    this._components.thermometerOutline.changeBulbColor('FireBrick');
    this._components.amountIndicator
      .setColor()
      .show()
      .slideToPos(allAmount)
      .setText(Formatters.tick(allAmount));
  }

  renderBySdg(xfData) {
    let allAmount = xfData.allAmount;
    let sdgsByAmount = _.clone(xfData.drilldownKV).reverse(); // list of {key: <sdgId>, value: <number>}

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

    this.scaleGloss(yScale(allAmount));

    let colorFromDatum = d => (d.xfData.meta ? d.xfData.meta.color : '#000');

    this.initIndicator(data, colorFromDatum, xfData.allAmount);
    this._svg.chartArea.classed('clickable', true);

    allGlyphs.exit()
      .transition()
        .attr('x', 0)
        .attr('y', yScale(0))
        .attr('width', GLYPH_WIDTH)
        .attr('height', 0)
        .remove();

    allGlyphs
      .enter()
      .append('rect')
        .classed('glyph', true)
        .attr('x', 0)
        .attr('y', yScale(0))
        .attr('width', GLYPH_WIDTH)
        .attr('height', 0)
        .style('fill', colorFromDatum)
      .merge(allGlyphs)
        // Note: any previous mouseovers are overridden
        .on('mouseover', this.onHoverDatum.bind(this))
        .on('click', d => actions.interactions.clickDrilldown(d.xfData.key))
      .transition()
        .attr('x', 0)
        .attr('y', d => yScale(d.stackD[0]))
        .attr('width', GLYPH_WIDTH)
        .attr('height', d => yScale(d.stackD[1] - d.stackD[0]))
        .style('fill', colorFromDatum);

    let lastDatum = data[data.length - 1];
    this._components.thermometerOutline.changeBulbColor(colorFromDatum(lastDatum));
    this._components.amountIndicator
      .show()
      .setColor()
      .slideToPos(xfData.allAmount)
      .setText(Formatters.tick(xfData.allAmount));
  }

  renderByOrgs(xfData) {
    let allAmount = xfData.allAmount;
    let sdgsByOrg = xfData.drilldownKV; // list of {key: <sdgId>, value: <number>}

    let keys = sdgsByOrg.map(r => r.key);
    let drilldownByKey = _.keyBy(sdgsByOrg, r => r.key);

    let stacker = d3.stack()
      .keys(keys)
      .order(d3.stackOrderAscending)
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
    let data = series.map(s => ({ orgId: s.key, stackD: s[0], xfData: drilldownByKey[s.key] }));

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

    this.scaleGloss(yScale(allAmount));

    let orgScale = scaleOrgColor();
    orgScale.domain(data.map(d => d.orgId).reverse());

    let colorFromDatum = d => orgScale(d.orgId);

    this.initIndicator(data, colorFromDatum, xfData.allAmount);
    this._svg.chartArea.classed('clickable', true);

    allGlyphs.exit()
      .transition()
        .attr('x', 0)
        .attr('y', yScale(0))
        .attr('width', GLYPH_WIDTH)
        .attr('height', 0)
        .remove();

    allGlyphs
      .enter()
      .append('rect')
        .classed('glyph', true)
        .attr('x', 0)
        .attr('y', yScale(0))
        .attr('width', GLYPH_WIDTH)
        .attr('height', 0)
        .style('fill', colorFromDatum)
      .merge(allGlyphs)
        // Note: any previous mouseovers are overridden
        .on('mouseover', this.onHoverDatum.bind(this))
        .on('click', d => actions.interactions.clickDrilldown(d.xfData.key))
      .transition()
        .attr('x', 0)
        .attr('y', d => yScale(d.stackD[0]))
        .attr('width', GLYPH_WIDTH)
        .attr('height', d => yScale(d.stackD[1] - d.stackD[0]))
        .style('fill', colorFromDatum);

    let lastDatum = data[data.length - 1];
    this._components.thermometerOutline.changeBulbColor(colorFromDatum(lastDatum));
    this._components.amountIndicator
      .show()
      .setColor()
      .slideToPos(xfData.allAmount)
      .setText(Formatters.tick(xfData.allAmount));
  }

  onNewInteractionData(data) {
    if (this._currentData && data.currentHoverKey) {
      let datum = _.find(this._currentData, ['xfData.key', data.currentHoverKey]);
      this.moveIndicatorByDatum(datum); // if no datum, moves to default position (eg hoverout)
    } else {
      this.moveIndicatorByDatum();
    }
  }

  /**
   * Configured indicator component against current data
   * @param {array(object)} data Current dataset being displayed
   * @param {function} datum2ColorFn How color is derived from a datum
   */
  initIndicator(data, datum2ColorFn, defaultValue) {
    this._currentData = data;
    this._datum2ColorFn = datum2ColorFn;
    this._indicatorDefaultValue = defaultValue;
  }
  moveIndicatorByDatum(d) {
    if (d === null || d === undefined) {
      this._components.amountIndicator
        .setColor() // default color
        .slideToPos(this._indicatorDefaultValue)
        .setText(Formatters.tick(this._indicatorDefaultValue));
    } else {
      this._components.amountIndicator
        .setColor(this._datum2ColorFn(d))
        .slideToPos((d.stackD[0] + d.stackD[1]) / 2)
        .setText(Formatters.tick(d.xfData.value));
    }
  }
  onHoverDatum(d) {
    actions.interactions.hoverDrilldown(d.xfData.key);
    this.moveIndicatorByDatum(d);
  }
};
