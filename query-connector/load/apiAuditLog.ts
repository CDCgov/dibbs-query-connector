export const config = {
  target: "http://localhost:3000",
  processor: "./processor.ts",
  phases: [
    {
      name: "150 ELR's a day",
      duration: 9,
      arrivalRate: 3,
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
