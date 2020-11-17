import { WDialog } from "../leafletClasses";
import { getSelectedOperation } from "../selectedOp";
import { addToColorList } from "../skin";

const ZoneSetColorDialog = WDialog.extend({
  statics: {
    TYPE: "zoneSetColorDialog",
  },

  addHooks: function () {
    WDialog.prototype.addHooks.call(this);
    this._displayDialog();
  },

  removeHooks: function () {
    WDialog.prototype.removeHooks.call(this);
    window.map.fire("wasabeeUIUpdate", { reason: "ZoneSetColorDialog" }, false);
  },

  _displayDialog: function () {
    this._dialog = window.dialog({
      title: "Zone color",
      html: this._buildContent(),
      width: "auto",
      dialogClass: "wasabee-dialog wasabee-dialog-zone-color",
      closeCallback: () => {
        this.disable();
        delete this._dialog;
      },
    });
  },

  _buildContent: function () {
    const container = L.DomUtil.create("div", "container");
    const desc = L.DomUtil.create("div", "desc", container);
    desc.textContent =
      "Set the color of all links in zone " + this.options.zone.name;

    const picker = L.DomUtil.create("input", "picker", container);
    picker.type = "color";
    picker.setAttribute("list", "wasabee-colors-datalist");

    L.DomEvent.on(picker, "change", (ev) => {
      L.DomEvent.stop(ev);
      const so = getSelectedOperation();
      for (const l of so.links) {
        if (l.zone == this.options.zone.id) l.color = picker.value;
      }
      so.store();
      addToColorList(picker.value);
      window.map.fire(
        "wasabeeUIUpdate",
        { reason: "ZonzeSetColorDialog" },
        false
      );
    });

    return container;
  },
});

export default ZoneSetColorDialog;
