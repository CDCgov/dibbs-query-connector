export const mockGet = jest.fn().mockResolvedValue({
  status: 200,
  resourceType: "Bundle",
  entry: [
    {
      resource: {
        resourceType: "Patient",
        id: "test-patient-123",
        name: [{ given: ["Test"], family: "Patient" }],
        identifier: [{ value: "MRN-12345" }],
      },
    },
  ],
});
export const mockPost = jest.fn().mockResolvedValue({
  status: 200,
  url: "http://mock-server.com/fhir",
  text: jest.fn().mockResolvedValue(""),
  json: jest.fn().mockResolvedValue({
    resourceType: "Bundle",
    entry: [],
  }),
  headers: new Headers(),
});
export const mockGetAccessToken = jest.fn().mockResolvedValue("mock-token");
export const mockEnsureValidToken = jest.fn().mockResolvedValue(undefined);
export const mockGetRequestLog = jest.fn().mockReturnValue([]);
export const mockPostJson = jest.fn().mockReturnValue({});

const mockFhirClient = jest.fn().mockImplementation(() => ({
  get: mockGet,
  post: mockPost,
  getAccessToken: mockGetAccessToken,
  ensureValidToken: mockEnsureValidToken,
  getRequestLog: mockGetRequestLog,
  postJson: mockPostJson,
}));

export default mockFhirClient;
