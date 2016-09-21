function drawOutline(
  startX, startY,
  thermWidth,
  width,
  bulbCy,
  bulbR
) {
  return `
    M ${startX - width} ${startY}
    L ${startX - width} ${bulbCy - bulbR}
    A ${bulbR + width} ${bulbR + width} 0 1 0 ${startX + thermWidth + width} ${bulbCy - bulbR}
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
      .attr('style', 'stop-color: rgb(182, 211, 245); stop-opacity: 1'); // d3 doesn't recognize svg styles in .style()

    gradDef.append('stop')
      .attr('offset', '100%')
      .attr('style', 'stop-color: rgb(70, 130, 180); stop-opacity: 1'); // d3 doesn't recognize svg styles in .style()
  }

  constructor(gSelection, params) {
    gSelection
      .classed('thermometer', true);

    let p = params;

    let bulbCy = p.startY + p.thermH + p.bulbR - p.bulbR / 4;

    this._components = {
      outline: gSelection.append('path')
        .attr('d', drawOutline(p.startX, p.startY, p.thermW, p.outlineW, bulbCy, p.bulbR))
        .attr('stroke', 'none')
        .attr('fill', 'url(#thermOutlineGrad)'),

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

      bulb: gSelection.append('circle')
        .classed('therm-bulb', true)
        .attr('cx', p.startX + Math.ceil(p.thermW / 2))
        .attr('cy', bulbCy)
        .attr('r', p.bulbR)
        .attr('fill', p.initialColor),
    };
  }

  changeBulbColor(newColor) {
    return this._components.bulb
    .transition()
      .style('fill', newColor);
  }
};
