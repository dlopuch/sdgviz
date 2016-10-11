const F = require('../Formatters');

function drawOutline(
  startX, startY,
  thermWidth,
  width,
  bulbCy,
  bulbR,
  bulbFudge = 0
) {
  return `
    M ${startX - width} ${startY}
    L ${startX - width} ${bulbCy - bulbR + bulbFudge}
    A ${bulbR + width} ${bulbR + width} 0 1 0 ${startX + thermWidth + width} ${bulbCy - bulbR + bulbFudge}
    L ${startX + thermWidth + width} ${startX}
    A ${thermWidth / 2 + width} ${thermWidth / 2 + width} 0 1 0 ${startX - width} ${startY} 
    `;
}

module.exports = class ThermometerOutline {
  static addGradientDef(svgDefsSelection) {
    let gradDef = svgDefsSelection.append('linearGradient')
      .attr('id', 'thermOutlineGrad')
      .attr('x1', '100%')
      .attr('y1', '7%')
      .attr('x2', '100%')
      .attr('y2', '100%')
      .attr('gradientUnits', 'objectBoundingBox');

    gradDef.append('stop')
      .attr('offset', '0%')
      .attr('style', `stop-color: ${F.colors.gscLightBlue}; stop-opacity: 1`); // d3 doesn't recognize svg styles in .style()

    gradDef.append('stop')
      .attr('offset', '100%')
      .attr('style', `stop-color: ${F.colors.gscBlue}; stop-opacity: 1`); // d3 doesn't recognize svg styles in .style()


    svgDefsSelection.append('linearGradient')
      .attr('spreadMethod', 'pad')
      .attr('id', 'thermBulbGloss')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%')
      .html(`
        <stop offset="0%" style="stop-color:rgba(255, 255, 255, 0.76);stop-opacity:0.76;" />
	      <stop offset="100%" style="stop-color:rgba(255, 255, 255, 0);stop-opacity:0;" />
      `);
  }

  constructor(gSelection, decorationsGSelection, params) {
    gSelection
      .classed('thermometer', true);

    let p = params;

    let bulbCy = p.startY + p.thermH + p.bulbR - p.bulbR / 4;

    this._components = {
      outline: gSelection.append('path')
        .attr('d', drawOutline(p.startX, p.startY, p.thermW, p.outlineW, bulbCy, p.bulbR))
        .attr('stroke', 'none')
        .attr('fill', 'url(#thermOutlineGrad)'),

      inline: gSelection.append('path')
      .attr('d', drawOutline(p.startX, p.startY, p.thermW, p.outlineW / 2.5, bulbCy, p.bulbR, 3))
      .attr('stroke', 'none')
      .attr('fill', 'white'),

      thermBody: gSelection.append('rect')
        .classed('therm-body', true)
        .attr('x', p.startX)
        .attr('y', p.startY)
        .attr('width', p.thermW)
        .attr('height', bulbCy),

      thermTop: gSelection.append('circle')
        .classed('therm-body', true)
        .attr('cx', p.startX + p.thermW / 2)
        .attr('cy', p.startY)
        .attr('r', p.thermW / 2),

      bulb: decorationsGSelection.append('circle')
        .classed('therm-bulb', true)
        .attr('r', p.bulbR)
        .attr('fill', p.initialColor)

        // Params when in gSelection:
        // .attr('cx', p.startX + Math.ceil(p.thermW / 2))
        // .attr('cy', bulbCy)

        // Params when in decoractionsGSelection:
        .attr('cx', p.startX + Math.ceil(p.thermW / 2))
        .attr('cy', '-16'),

      bulbGloss: decorationsGSelection.append('ellipse')
        .attr('cx', p.startX + Math.ceil(p.thermW / 2))
        .attr('cy', -8)
        .attr('rx', 15)
        .attr('ry', 10)
        .attr('fill', 'url(#thermBulbGloss)'),
    };
  }

  changeBulbColor(newColor) {
    return this._components.bulb
    .transition()
      .style('fill', newColor);
  }
};
