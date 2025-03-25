export const config = {
  target: "http://localhost:3000",
  processor: "./processor.ts",
  phases: [
    {
      name: "Max load for large STLT estimate",
      // number of seconds we're simulating
      duration: 60,
      // total ELR's we want to simulate over the period
      // the load we'd expect in an hour of time
      arrivalCount: 1025,
    },
  ],
};
export const scenarios = [
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
            phone: "{{ phone }}",
          },
        },
      },
    ],
  },
];
