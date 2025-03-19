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
      name: "150 ELR's a day",
      duration: 9,
      arrivalRate: 3
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vYXBpQXVkaXRMb2cudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImV4cG9ydCBjb25zdCBjb25maWcgPSB7XG4gIHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjMwMDBcIixcbiAgcHJvY2Vzc29yOiBcIi4vcHJvY2Vzc29yLnRzXCIsXG4gIHBoYXNlczogW1xuICAgIHtcbiAgICAgIG5hbWU6IFwiMTUwIEVMUidzIGEgZGF5XCIsXG4gICAgICBkdXJhdGlvbjogOSxcbiAgICAgIGFycml2YWxSYXRlOiAzLFxuICAgIH0sXG4gIF0sXG59O1xuZXhwb3J0IGNvbnN0IHNjZW5hcmlvcyA9IFtcbiAge1xuICAgIGJlZm9yZVNjZW5hcmlvOiBcInNldHVwXCIsXG4gICAgZmxvdzogW1xuICAgICAge1xuICAgICAgICBnZXQ6IHtcbiAgICAgICAgICB1cmw6IFwiL2FwaS9xdWVyeVwiLFxuICAgICAgICAgIHFzOiB7XG4gICAgICAgICAgICBmaGlyX3NlcnZlcjogXCJ7eyBmaGlyX3NlcnZlciB9fVwiLFxuICAgICAgICAgICAgaWQ6IFwie3sgaWQgfX1cIixcbiAgICAgICAgICAgIGdpdmVuOiBcInt7IGdpdmVuIH19XCIsXG4gICAgICAgICAgICBmYW1pbHk6IFwie3sgZmFtaWx5IH19XCIsXG4gICAgICAgICAgICBkb2I6IFwie3sgZG9iIH19XCIsXG4gICAgICAgICAgICBtcm46IFwie3sgbXJuIH19XCIsXG4gICAgICAgICAgICBwaG9uZTogXCJ7eyBwaG9uZSB9fVwiLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gIH0sXG5dO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBTyxJQUFNLFNBQVM7QUFBQSxFQUNwQixRQUFRO0FBQUEsRUFDUixXQUFXO0FBQUEsRUFDWCxRQUFRO0FBQUEsSUFDTjtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLE1BQ1YsYUFBYTtBQUFBLElBQ2Y7QUFBQSxFQUNGO0FBQ0Y7QUFDTyxJQUFNLFlBQVk7QUFBQSxFQUN2QjtBQUFBLElBQ0UsZ0JBQWdCO0FBQUEsSUFDaEIsTUFBTTtBQUFBLE1BQ0o7QUFBQSxRQUNFLEtBQUs7QUFBQSxVQUNILEtBQUs7QUFBQSxVQUNMLElBQUk7QUFBQSxZQUNGLGFBQWE7QUFBQSxZQUNiLElBQUk7QUFBQSxZQUNKLE9BQU87QUFBQSxZQUNQLFFBQVE7QUFBQSxZQUNSLEtBQUs7QUFBQSxZQUNMLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxVQUNUO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGOyIsCiAgIm5hbWVzIjogW10KfQo=
