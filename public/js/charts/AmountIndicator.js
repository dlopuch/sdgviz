const _ = require('lodash');

const svgPathRoundCorners = require('./utils/svgPathRoundCorners');

module.exports = class AmountIndicator {
  constructor(gSelection, axisYScale, _opts = {}) {
    gSelection.classed('therm-amt-indicator-g', true);

    let opts = this.opts = _.defaults(_opts, {
      height: 20,
      pointWidth: 10,
      bodyWidth: 40,
      color: 'steelblue',
    });

    this.yScale = axisYScale;

    this._indicatorEl = gSelection.append('g')
      .classed('therm-amt-indicator', true)
      .attr('transform', 'translate(0, 0)'); // gets animated up and down

    let halfHeight = opts.height / 2;
    this._indicatorElPath = this._indicatorEl.append('path')
      .attr('d', svgPathRoundCorners(`
        M 0 0
        L ${opts.pointWidth} ${halfHeight}
        L ${opts.pointWidth + opts.bodyWidth} ${halfHeight}
        L ${opts.pointWidth + opts.bodyWidth} ${-halfHeight}
        L ${opts.pointWidth} ${-halfHeight}
      `, 3))
      .style('fill', opts.color);

    this._indicatorText = this._indicatorEl.append('text')
      .attr('x', Math.floor(opts.pointWidth * 1.2))
      .attr('text-anchor', 'left')
      .attr('dy', '0.4em');
  }

  setPos(domainY) {
    this._indicatorEl
      .attr('transform', `translate(0, ${this.yScale(domainY)})`);
    return this;
  }

  slideToPos(domainY) {
    this._indicatorEl.transition('slide')
      .attr('transform', `translate(0, ${this.yScale(domainY)})`);
    return this;
  }

  opacity(opacity, immediately = false) {
    (immediately ? this._indicatorEl : this._indicatorEl.transition('opacity'))
      .style('opacity', opacity);
    return this;
  }
  show(immediately) {
    return this.opacity(1, immediately);
  }
  hide(immediately) {
    return this.opacity(0, immediately);
  }

  setText(text) {
    this._indicatorText.text(text);
    return this;
  }

  setColor(newColor = null, immediately = false) {
    (immediately ? this._indicatorElPath : this._indicatorElPath.transition('color'))
      .style('fill', newColor || this.opts.color);
    return this;
  }
};
