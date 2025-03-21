"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// load/apiAuditLog.ts
var apiAuditLog_exports = {};
__export(apiAuditLog_exports, {
  config: () => config,
  scenarios: () => scenarios
});
module.exports = __toCommonJS(apiAuditLog_exports);
var config = {
  target: "http://localhost:3000",
  processor: "./processor.ts",
  phases: [
    {
      name: "Max load for large STLT estimate",
      // number of seconds we're simulating
      duration: 60,
      // total ELR's we want to simulate over the period
      // the load we'd expect in an hour of time
      arrivalCount: 1025
    }
  ]
};
var scenarios = [
  {
    beforeScenario: "setup",
    flow: [
      {
        get: {
          url: "/api/query",
          qs: {
            fhir_server: "{{ fhir_server }}",
            id: "{{ id }}",
            given: "{{ given }}",
            family: "{{ family }}",
            dob: "{{ dob }}",
            mrn: "{{ mrn }}",
            phone: "{{ phone }}"
          }
        }
      }
    ]
  }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  config,
  scenarios
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vYXBpQXVkaXRMb2cudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImV4cG9ydCBjb25zdCBjb25maWcgPSB7XG4gIHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjMwMDBcIixcbiAgcHJvY2Vzc29yOiBcIi4vcHJvY2Vzc29yLnRzXCIsXG4gIHBoYXNlczogW1xuICAgIHtcbiAgICAgIG5hbWU6IFwiTWF4IGxvYWQgZm9yIGxhcmdlIFNUTFQgZXN0aW1hdGVcIixcbiAgICAgIC8vIG51bWJlciBvZiBzZWNvbmRzIHdlJ3JlIHNpbXVsYXRpbmdcbiAgICAgIGR1cmF0aW9uOiA2MCxcbiAgICAgIC8vIHRvdGFsIEVMUidzIHdlIHdhbnQgdG8gc2ltdWxhdGUgb3ZlciB0aGUgcGVyaW9kXG4gICAgICAvLyB0aGUgbG9hZCB3ZSdkIGV4cGVjdCBpbiBhbiBob3VyIG9mIHRpbWVcbiAgICAgIGFycml2YWxDb3VudDogMTAyNSxcbiAgICB9LFxuICBdLFxufTtcbmV4cG9ydCBjb25zdCBzY2VuYXJpb3MgPSBbXG4gIHtcbiAgICBiZWZvcmVTY2VuYXJpbzogXCJzZXR1cFwiLFxuICAgIGZsb3c6IFtcbiAgICAgIHtcbiAgICAgICAgZ2V0OiB7XG4gICAgICAgICAgdXJsOiBcIi9hcGkvcXVlcnlcIixcbiAgICAgICAgICBxczoge1xuICAgICAgICAgICAgZmhpcl9zZXJ2ZXI6IFwie3sgZmhpcl9zZXJ2ZXIgfX1cIixcbiAgICAgICAgICAgIGlkOiBcInt7IGlkIH19XCIsXG4gICAgICAgICAgICBnaXZlbjogXCJ7eyBnaXZlbiB9fVwiLFxuICAgICAgICAgICAgZmFtaWx5OiBcInt7IGZhbWlseSB9fVwiLFxuICAgICAgICAgICAgZG9iOiBcInt7IGRvYiB9fVwiLFxuICAgICAgICAgICAgbXJuOiBcInt7IG1ybiB9fVwiLFxuICAgICAgICAgICAgcGhvbmU6IFwie3sgcGhvbmUgfX1cIixcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICB9LFxuXTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQU8sSUFBTSxTQUFTO0FBQUEsRUFDcEIsUUFBUTtBQUFBLEVBQ1IsV0FBVztBQUFBLEVBQ1gsUUFBUTtBQUFBLElBQ047QUFBQSxNQUNFLE1BQU07QUFBQTtBQUFBLE1BRU4sVUFBVTtBQUFBO0FBQUE7QUFBQSxNQUdWLGNBQWM7QUFBQSxJQUNoQjtBQUFBLEVBQ0Y7QUFDRjtBQUNPLElBQU0sWUFBWTtBQUFBLEVBQ3ZCO0FBQUEsSUFDRSxnQkFBZ0I7QUFBQSxJQUNoQixNQUFNO0FBQUEsTUFDSjtBQUFBLFFBQ0UsS0FBSztBQUFBLFVBQ0gsS0FBSztBQUFBLFVBQ0wsSUFBSTtBQUFBLFlBQ0YsYUFBYTtBQUFBLFlBQ2IsSUFBSTtBQUFBLFlBQ0osT0FBTztBQUFBLFlBQ1AsUUFBUTtBQUFBLFlBQ1IsS0FBSztBQUFBLFlBQ0wsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFVBQ1Q7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7IiwKICAibmFtZXMiOiBbXQp9Cg==
