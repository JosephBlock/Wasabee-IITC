import PortalUI from "./portal";
import ConfirmDialog from "../dialogs/confirmDialog";
import AgentDialog from "../dialogs/agentDialog";
import { targetPromise } from "../server";
import { getSelectedOperation } from "../selectedOp";
import wX from "../wX";

import WasabeeAgent from "../model/agent";
import { displayInfo, displayWarning } from "../error";

/**
 * @param {WasabeeAgent} agent
 * @returns html anchor with agent name (and verification states)
 */
function formatDisplay(agent) {
  const display = L.DomUtil.create("a", "wasabee-agent-label");
  if (agent.Vverified || agent.rocks) {
    L.DomUtil.addClass(display, "enl");
  }
  if (agent.blacklisted) {
    L.DomUtil.addClass(display, "res");
  }
  L.DomEvent.on(display, "click", (ev) => {
    L.DomEvent.stop(ev);
    const ad = new AgentDialog({ gid: agent.id });
    ad.enable();
  });

  let prefix = "";
  if (agent.communityname) prefix += "C";
  if (agent.Vverified) prefix += "V";
  else if (agent.vname === agent.name) prefix += "v";
  if (agent.rocks) prefix += "R";
  else if (agent.rocksname === agent.name) prefix += "r";
  if (agent.intelname) {
    // no identity source exept intel
    if (!agent.rocksname && !agent.vname) prefix += "I";
    // no verified source
    else if (!agent.rocks && !agent.Vverified) prefix += "I";
    // match server preference
    else if (agent.intelname === agent.name) prefix += "I";
    // match server preference, in lower case
    else if (agent.intelname.toLowerCase() === agent.name.toLowerCase())
      prefix += "i";
  }

  display.textContent = prefix
    ? `[${prefix}] ` + agent.getName()
    : agent.getName();
  return display;
}

function timeSinceformat(agent) {
  if (!agent.date) return "";
  const date = Date.parse(agent.date + "Z");
  if (Number.isNaN(date)) return `(${agent.date} UTC)`; // FireFox Date.parse no good
  if (date == 0) return "";

  const seconds = Math.floor((Date.now() - date) / 1000);
  if (seconds < 0) return "";
  let interval = Math.floor(seconds / 31536000 / 2592000 / 86400);

  if (interval > 1) return wX("AGES");
  interval = Math.floor(seconds / 3600);
  if (interval > 1) return wX("HOURS", { hours: interval });
  interval = Math.floor(seconds / 60);
  if (interval > 1) return wX("MINUTES", { minutes: interval });
  interval = Math.floor(seconds);
  return wX("SECONDS", { seconds: interval });
}

// change this to return an L.Marker() to make the logic in mapDrawing simpler
function icon(agent, z = 7) {
  if (z < 6) return globalIcon();
  if (z >= 6 && z < 9) return smallIcon(agent);
  if (z >= 9 && z < 15) return mediumIcon(agent);
  return bigIcon(agent);
}

function iconSize(z = 7) {
  if (z < 6) return [30, 30];
  if (z >= 6 && z < 9) return [36, 47];
  if (z >= 9 && z < 15) return [40, 52];
  return [46, 60];
}

function iconAnchor(z = 7) {
  if (z < 6) return [15, 30];
  if (z >= 6 && z < 9) return [18, 47];
  if (z >= 9 && z < 15) return [20, 52];
  return [23, 60];
}

// XXX there has to be a way to apply the viewBox onto the paths, to get rid of that extra nonsense
function globalIcon() {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  icon.setAttribute("viewBox", "200 70 630 520");
  icon.setAttribute("height", "30");
  icon.setAttribute("width", "30");
  icon.setAttribute(
    "style",
    "fill-rule: evenodd; clip-rule: evenodd; stroke-miterlimit: 10;"
  );
  icon.innerHTML = `<path d="M694 342L835 376 699 412 694 342Z" fill="rgb(220,110,110)"/><path d="M555 75C600 91 616 164 591 237 566 311 497 351 463 341 422 328 401 251 427 178 452 105 510 59 555 75Z" fill="rgb(182,182,182)"/><path d="M479 189C608 189 713 273 713 378 713 482 608 567 479 567 351 567 246 482 246 378 246 273 351 189 479 189Z" fill="rgb(220,110,110)"/><path d="M717 124C756 153 751 227 705 290 659 353 581 372 551 352 515 329 517 249 563 186 608 123 678 95 717 124Z" fill="rgb(214,214,214)"/><path d="M398 365C404 365 409 374 409 386 409 398 404 407 398 407 391 407 386 398 386 386 386 374 391 365 398 365Z" fill="rgb(43,43,33)"/><path d="M289 356C295 356 300 366 300 377 300 389 295 399 289 399 283 399 278 389 278 377 278 366 283 356 289 356Z" fill="rgb(43,43,33)"/><path d="M313 425C316 438 332 480 342 480 352 476 356 449 361 427 328 428 327 427 313 425Z" fill="rgb(43,43,33)"/>`;
  return icon;
}

// XXX resize this properly
function smallIcon(agent) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  icon.setAttribute("viewBox", "0 0 52 68");
  icon.innerHTML = `<defs><clipPath id="circleView"><circle fill="#fff" cx="26" cy="26" r="23" /></clipPath></defs>
      <path fill="yellow" stroke="#aaa" stroke-width="1" stroke-opacity="0.6" d="M 51 26 a 25 25 90 0 0 -50 0 c 0 11 5 20 10 25 l 12 12 c 3 3 3 3 6 0 l 11 -12 c 5 -5 11 -14 11 -25 z" />
      <circle fill="#fff" cx="26" cy="26" r="24" opacity="0.8" />
      <image x="2.5" y="2.5" width="47" height="47" href="${agent.pic}" clip-path="url(#circleView)" />`;
  return icon;
}

// XXX resize this properly
function mediumIcon(agent) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  icon.setAttribute("viewBox", "0 0 52 68");
  icon.innerHTML = `<defs><clipPath id="circleView"><circle fill="#fff" cx="26" cy="26" r="23" /></clipPath></defs>
      <path fill="orange" stroke="#aaa" stroke-width="1" stroke-opacity="0.6" d="M 51 26 a 25 25 90 0 0 -50 0 c 0 11 5 20 10 25 l 12 12 c 3 3 3 3 6 0 l 11 -12 c 5 -5 11 -14 11 -25 z" />
      <circle fill="#fff" cx="26" cy="26" r="24" opacity="0.8" />
      <image x="2.5" y="2.5" width="47" height="47" href="${agent.pic}" clip-path="url(#circleView)" />`;
  return icon;
}

function bigIcon(agent) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  icon.setAttribute("viewBox", "0 0 52 68");
  icon.innerHTML = `<defs><clipPath id="circleView"><circle fill="#fff" cx="26" cy="26" r="23" /></clipPath></defs>
      <path fill="red" stroke="#aaa" stroke-width="1" stroke-opacity="0.6" d="M 51 26 a 25 25 90 0 0 -50 0 c 0 11 5 20 10 25 l 12 12 c 3 3 3 3 6 0 l 11 -12 c 5 -5 11 -14 11 -25 z" />
      <circle fill="#fff" cx="26" cy="26" r="24" opacity="0.8" />
      <image x="2.5" y="2.5" width="47" height="47" href="${agent.pic}" clip-path="url(#circleView)" />`;
  return icon;
}

const WLAgent = L.Marker.extend({
  initialize: function (agent) {
    const zoom = window.map.getZoom();
    L.Marker.prototype.initialize.call(this, agent.latLng, {
      title: agent.getName(),
      icon: L.divIcon({
        className: "wasabee-agent-icon",
        iconSize: iconSize(zoom),
        iconAnchor: iconAnchor(zoom),
        popupAnchor: L.point(0, -70),
        html: icon(agent, zoom),
      }),
      id: agent.id,
      agent: agent,
      zoom: zoom,
    });

    this.bindPopup((layer) => layer._getPopup(), {
      className: "wasabee-popup",
      closeButton: false,
    });

    this.off("click", this._openPopup);
    window.registerMarkerForOMS(this);
    this.on("spiderfiedclick", this._openPopup);
  },

  update: function () {
    const zoom = window.map.getZoom();
    if (this.options.zoom != zoom) {
      this.options.zoom = zoom;
      this.setIcon(
        L.divIcon({
          className: "wasabee-agent-icon",
          iconSize: iconSize(zoom),
          iconAnchor: iconAnchor(zoom),
          popupAnchor: L.point(0, -70),
          html: icon(this.options.agent, zoom),
        })
      );
    } else L.Marker.prototype.update.call(this);
  },

  _getPopup: function () {
    const agent = this.options.agent;
    const content = L.DomUtil.create("div", "wasabee-agent-popup");
    const title = L.DomUtil.create("div", "desc", content);
    title.id = agent.id;
    title.textContent = agent.getName();
    const time = L.DomUtil.create("div", "desc", content);
    time.id = agent.id;
    time.textContent = timeSinceformat(agent);

    WasabeeAgent.get(this.options.id)
      .then(formatDisplay)
      .then((fd) => {
        title.textContent = "";
        title.appendChild(fd);
        time.textContent = timeSinceformat(agent);
      });

    const sendTarget = L.DomUtil.create("button", null, content);
    sendTarget.textContent = wX("SEND TARGET");
    L.DomEvent.on(sendTarget, "click", (ev) => {
      L.DomEvent.stop(ev);
      const selectedPortal = PortalUI.getSelected();
      if (!selectedPortal) {
        displayWarning(wX("SELECT PORTAL"));
        return;
      }

      const d = new ConfirmDialog({
        title: wX("SEND TARGET"),
        label: wX("SEND TARGET CONFIRM", {
          portalName: PortalUI.displayName(selectedPortal),
          agent: agent.getName(),
        }),
        type: "agent",
        callback: async () => {
          try {
            await targetPromise(agent.id, selectedPortal);
            displayInfo(wX("TARGET SENT"));
          } catch (e) {
            console.error(e);
          }
        },
      });
      d.enable();
    });

    const op = getSelectedOperation();
    const assignments = L.DomUtil.create("ul", "assignments", content);
    for (const m of op.markers) {
      if (m.assignedTo != agent.id) continue;
      const a = L.DomUtil.create("li", "assignment", assignments);
      const portal = op.getPortal(m.portalId);
      a.textContent = `${m.order}: ${wX(m.type)} `;
      a.appendChild(PortalUI.displayFormat(portal));
    }

    return content;
  },
});

export default {
  formatDisplay,
  WLAgent,
  timeSinceformat,
};
