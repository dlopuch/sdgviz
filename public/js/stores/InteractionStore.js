const _ = require('lodash');
const actions = require('../actions');
const Reflux = require('reflux');


module.exports = Reflux.createStore({
  init() {
    this.listenToMany({
      onHoverDrilldown: actions.interactions.hoverDrilldown,
      onClickDrilldown: actions.interactions.clickDrilldown,
    });

    this.state = {
      currentHoverKey: null,
    };
  },

  onHoverDrilldown(drilldownKey) {
    this.state.currentHoverKey = drilldownKey || null;
    this.trigger(_.clone(this.state));
  },

  onClickDrilldown(drilldownKey, expand) {
    this.trigger(
      _.extend(
        {
          clickedDrilldown: {
            key: drilldownKey,
            expand: expand === null || expand === undefined ? null : expand,
          },
        },
        this.state,
        {}
      )
    );
  },
});
